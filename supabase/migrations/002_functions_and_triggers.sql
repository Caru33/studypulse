-- StudyPulse — Functions and Triggers

-- 1. Auto-update courses.updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists courses_updated_at on courses;
create trigger courses_updated_at
  before update on courses
  for each row execute function update_updated_at();

-- 2. Auto-recompute courses.mastery_score when a concept changes
create or replace function update_course_mastery()
returns trigger as $$
begin
  update courses
  set mastery_score = (
    select coalesce(avg(mastery_score), 0)
    from concepts
    where course_id = new.course_id
  )
  where id = new.course_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists concepts_mastery_update on concepts;
create trigger concepts_mastery_update
  after insert or update of mastery_score on concepts
  for each row execute function update_course_mastery();

-- 3. Study streak: counts consecutive days with at least one completed quiz session
create or replace function get_study_streak(p_user_id uuid)
returns integer as $$
declare
  streak integer := 0;
  check_date date := current_date;
  session_exists boolean;
begin
  loop
    select exists(
      select 1 from quiz_sessions
      where user_id = p_user_id
        and completed_at is not null
        and completed_at::date = check_date
    ) into session_exists;

    exit when not session_exists;

    streak := streak + 1;
    check_date := check_date - 1;
  end loop;

  return streak;
end;
$$ language plpgsql security definer;

-- 4. Count quiz questions answered today (for daily limit check)
create or replace function count_quiz_questions_today(p_user_id uuid)
returns integer as $$
declare
  total integer;
begin
  select count(*)
  into total
  from quiz_questions qq
  join quiz_sessions qs on qs.id = qq.session_id
  where qs.user_id = p_user_id
    and qq.user_answer is not null
    and qq.created_at::date = current_date;

  return coalesce(total, 0);
end;
$$ language plpgsql security definer;
