-- StudyPulse — Initial Schema
-- Run with: supabase db push  OR  paste in Supabase SQL Editor

-- 1. Enable pgvector for embeddings
create extension if not exists vector;

-- 2. profiles (extends Supabase Auth users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  university text,
  program text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now()
);

-- 3. courses
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text,
  exam_date date,
  file_url text,
  content_text text,
  total_concepts integer not null default 0,
  mastery_score float not null default 0 check (mastery_score >= 0 and mastery_score <= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. concepts
create table if not exists concepts (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade not null,
  title text not null,
  content text not null,
  embedding vector(1536),
  mastery_score float not null default 0 check (mastery_score >= 0 and mastery_score <= 1),
  times_tested integer not null default 0,
  times_correct integer not null default 0,
  last_tested_at timestamptz,
  created_at timestamptz not null default now()
);

-- HNSW index for fast cosine similarity search on embeddings
create index if not exists concepts_embedding_hnsw_idx
  on concepts using hnsw (embedding vector_cosine_ops);

-- 5. quiz_sessions
create table if not exists quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  course_id uuid references courses(id) on delete cascade not null,
  mode text not null default 'adaptive' check (mode in ('adaptive', 'review', 'exam_prep')),
  total_questions integer not null default 0,
  correct_answers integer not null default 0,
  score float check (score >= 0 and score <= 1),
  duration_seconds integer,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 6. quiz_questions
create table if not exists quiz_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references quiz_sessions(id) on delete cascade not null,
  concept_id uuid references concepts(id) not null,
  question_text text not null,
  options jsonb not null,
  correct_option integer not null check (correct_option >= 0 and correct_option <= 3),
  user_answer integer check (user_answer >= 0 and user_answer <= 3),
  is_correct boolean,
  explanation text not null default '',
  created_at timestamptz not null default now()
);

-- 7. flashcards
create table if not exists flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  course_id uuid references courses(id) on delete cascade not null,
  concept_id uuid references concepts(id) not null,
  front text not null,
  back text not null,
  ease_factor float not null default 2.5,
  interval_days integer not null default 1,
  repetitions integer not null default 0,
  next_review_date date not null default current_date,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 8. study_plans
create table if not exists study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  generated_at timestamptz not null default now(),
  plan_data jsonb not null,
  is_active boolean not null default true
);

-- =========================================================
-- Row Level Security
-- =========================================================
alter table profiles enable row level security;
alter table courses enable row level security;
alter table concepts enable row level security;
alter table quiz_sessions enable row level security;
alter table quiz_questions enable row level security;
alter table flashcards enable row level security;
alter table study_plans enable row level security;

-- profiles: users access only their own profile
create policy "profiles_own_all" on profiles
  for all using (auth.uid() = id);

-- courses: users access only their own courses
create policy "courses_own_all" on courses
  for all using (auth.uid() = user_id);

-- concepts: accessible if user owns the parent course
create policy "concepts_own_all" on concepts
  for all using (
    exists (
      select 1 from courses
      where courses.id = concepts.course_id
        and courses.user_id = auth.uid()
    )
  );

-- quiz_sessions: users access only their own sessions
create policy "quiz_sessions_own_all" on quiz_sessions
  for all using (auth.uid() = user_id);

-- quiz_questions: accessible via session ownership
create policy "quiz_questions_own_all" on quiz_questions
  for all using (
    exists (
      select 1 from quiz_sessions
      where quiz_sessions.id = quiz_questions.session_id
        and quiz_sessions.user_id = auth.uid()
    )
  );

-- flashcards: users access only their own flashcards
create policy "flashcards_own_all" on flashcards
  for all using (auth.uid() = user_id);

-- study_plans: users access only their own plans
create policy "study_plans_own_all" on study_plans
  for all using (auth.uid() = user_id);

-- =========================================================
-- Auto-create profile on signup
-- =========================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
