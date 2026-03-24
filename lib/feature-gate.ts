import { createServiceRoleClient } from "@/lib/supabase/server";

export type FeatureKey =
  | "course_upload"
  | "quiz_question"
  | "flashcard_generate";

export interface GateResult {
  allowed: boolean;
  reason?: string;
}

const FREE_LIMITS = {
  course_upload: 2,
  quiz_questions_per_day: 10,
  flashcards_per_course: 20,
};

export async function checkFeatureLimit(
  userId: string,
  feature: FeatureKey,
  extra?: { courseId?: string }
): Promise<GateResult> {
  const supabase = createServiceRoleClient();

  // Get user plan
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  if (profile?.plan === "pro") {
    return { allowed: true };
  }

  switch (feature) {
    case "course_upload": {
      const { count } = await supabase
        .from("courses")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if ((count ?? 0) >= FREE_LIMITS.course_upload) {
        return {
          allowed: false,
          reason: `Limite de ${FREE_LIMITS.course_upload} cours atteinte. Passez à Pro pour des cours illimités.`,
        };
      }
      return { allowed: true };
    }

    case "quiz_question": {
      const today = new Date().toISOString().split("T")[0];

      // Count questions answered today across all sessions
      const { data: sessions } = await supabase
        .from("quiz_sessions")
        .select("id")
        .eq("user_id", userId);

      if (!sessions || sessions.length === 0) return { allowed: true };

      const sessionIds = sessions.map((s) => s.id);
      const { count } = await supabase
        .from("quiz_questions")
        .select("*", { count: "exact", head: true })
        .in("session_id", sessionIds)
        .not("user_answer", "is", null)
        .gte("created_at", `${today}T00:00:00.000Z`)
        .lte("created_at", `${today}T23:59:59.999Z`);

      if ((count ?? 0) >= FREE_LIMITS.quiz_questions_per_day) {
        return {
          allowed: false,
          reason: `Limite de ${FREE_LIMITS.quiz_questions_per_day} questions par jour atteinte. Passez à Pro pour des questions illimitées.`,
        };
      }
      return { allowed: true };
    }

    case "flashcard_generate": {
      if (!extra?.courseId) return { allowed: true };

      const { count } = await supabase
        .from("flashcards")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("course_id", extra.courseId);

      if ((count ?? 0) >= FREE_LIMITS.flashcards_per_course) {
        return {
          allowed: false,
          reason: `Limite de ${FREE_LIMITS.flashcards_per_course} flashcards par cours atteinte. Passez à Pro pour des flashcards illimitées.`,
        };
      }
      return { allowed: true };
    }

    default:
      return { allowed: true };
  }
}
