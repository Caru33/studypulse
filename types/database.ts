// StudyPulse — TypeScript interfaces for all 7 Supabase tables
// This is the central data contract used across API routes, components, and lib helpers.

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  university: string | null;
  program: string | null;
  plan: "free" | "pro";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
}

export interface Course {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  exam_date: string | null; // ISO date string YYYY-MM-DD
  file_url: string | null;
  content_text: string | null;
  total_concepts: number;
  mastery_score: number; // 0.0 to 1.0
  created_at: string;
  updated_at: string;
}

export interface Concept {
  id: string;
  course_id: string;
  title: string;
  content: string;
  embedding: number[] | null; // vector(1536) from text-embedding-3-small
  mastery_score: number; // 0.0 to 1.0
  times_tested: number;
  times_correct: number;
  last_tested_at: string | null;
  created_at: string;
}

export interface QuizSession {
  id: string;
  user_id: string;
  course_id: string;
  mode: "adaptive" | "review" | "exam_prep";
  total_questions: number;
  correct_answers: number;
  score: number | null; // 0.0 to 1.0
  duration_seconds: number | null;
  completed_at: string | null;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  session_id: string;
  concept_id: string;
  question_text: string;
  options: string[]; // ["option A", "option B", "option C", "option D"]
  correct_option: number; // index 0-3
  user_answer: number | null; // index 0-3, null if unanswered
  is_correct: boolean | null;
  explanation: string;
  created_at: string;
}

export interface Flashcard {
  id: string;
  user_id: string;
  course_id: string;
  concept_id: string;
  front: string;
  back: string;
  // SM-2 spaced repetition fields
  ease_factor: number; // default 2.5
  interval_days: number; // default 1
  repetitions: number; // default 0
  next_review_date: string; // ISO date YYYY-MM-DD
  last_reviewed_at: string | null;
  created_at: string;
}

export interface StudyPlan {
  id: string;
  user_id: string;
  generated_at: string;
  plan_data: StudyPlanData;
  is_active: boolean;
}

export interface StudyPlanData {
  week_summary: string;
  days: StudyPlanDay[];
}

export interface StudyPlanDay {
  date: string; // ISO date YYYY-MM-DD
  day_label: string; // "Lundi 24 mars"
  total_minutes: number;
  sessions: StudySession[];
}

export interface StudySession {
  course_id: string;
  course_title: string;
  activity: "quiz" | "flashcards" | "review";
  duration_minutes: number;
  focus: string; // e.g. "Révision des antibiotiques bêta-lactamines"
  concepts_to_review: string[];
}

// ---- API response types ----

export interface CourseWithConcepts extends Course {
  concepts: Concept[];
}

export interface QuizSessionWithQuestions extends QuizSession {
  questions: QuizQuestion[];
}

export interface LevelUpEvent {
  concept_id: string;
  concept_title: string;
  old_level: number;
  new_level: number;
}

export interface UploadCourseResponse {
  course_id: string;
  title: string;
  concept_count: number;
}

export interface GenerateQuizResponse {
  session_id: string;
  questions: QuizQuestion[];
}

export interface SubmitQuizResponse {
  score: number;
  correct: number;
  total: number;
  level_ups: LevelUpEvent[];
}
