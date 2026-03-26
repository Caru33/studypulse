import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateMasteryScore, getMasteryLevel } from "@/lib/mastery";

const IS_MOCK =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project");

interface AnswerPayload {
  question_id: string;
  concept_id: string;
  answer: number;
  is_correct: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const {
      session_id,
      answers,
      duration_seconds,
    }: { session_id: string; answers: AnswerPayload[]; duration_seconds?: number } =
      await req.json();

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: "answers requis" }, { status: 400 });
    }

    // Mock mode — calculate score without DB
    if (IS_MOCK || session_id?.startsWith("mock-")) {
      const correct = answers.filter((a) => a.is_correct).length;
      return NextResponse.json({
        score: answers.length > 0 ? correct / answers.length : 0,
        correct,
        total: answers.length,
        level_ups: [],
      });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    let correct = 0;
    const level_ups: { concept_id: string; old_level: number; new_level: number }[] = [];

    for (const answer of answers) {
      // Save answer on the question row
      await supabase
        .from("quiz_questions")
        .update({ user_answer: answer.answer, is_correct: answer.is_correct })
        .eq("id", answer.question_id);

      if (answer.is_correct) correct++;

      // Update concept mastery
      if (answer.concept_id) {
        const { data: concept } = await supabase
          .from("concepts")
          .select("mastery_score, times_tested, times_correct")
          .eq("id", answer.concept_id)
          .single();

        if (concept) {
          const oldLevel = getMasteryLevel(concept.mastery_score).level;
          const newMastery = updateMasteryScore(concept.mastery_score, answer.is_correct);
          const newLevel = getMasteryLevel(newMastery).level;

          await supabase
            .from("concepts")
            .update({
              mastery_score: newMastery,
              times_tested: concept.times_tested + 1,
              times_correct: concept.times_correct + (answer.is_correct ? 1 : 0),
              last_tested_at: new Date().toISOString(),
            })
            .eq("id", answer.concept_id);

          if (newLevel > oldLevel) {
            level_ups.push({
              concept_id: answer.concept_id,
              old_level: oldLevel,
              new_level: newLevel,
            });
          }
        }
      }
    }

    const score = answers.length > 0 ? correct / answers.length : 0;

    // Mark session complete
    await supabase
      .from("quiz_sessions")
      .update({
        correct_answers: correct,
        score,
        duration_seconds: duration_seconds ?? null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", session_id)
      .eq("user_id", user.id);

    // Update course mastery average
    const { data: sessionRow } = await supabase
      .from("quiz_sessions")
      .select("course_id")
      .eq("id", session_id)
      .single();

    if (sessionRow) {
      const { data: allConcepts } = await supabase
        .from("concepts")
        .select("mastery_score")
        .eq("course_id", sessionRow.course_id);

      if (allConcepts && allConcepts.length > 0) {
        const avg =
          allConcepts.reduce((s, c) => s + c.mastery_score, 0) / allConcepts.length;
        await supabase
          .from("courses")
          .update({ mastery_score: avg, updated_at: new Date().toISOString() })
          .eq("id", sessionRow.course_id);
      }
    }

    return NextResponse.json({ score, correct, total: answers.length, level_ups });
  } catch (err) {
    console.error("[quiz/submit] error:", err);
    return NextResponse.json({ error: "Erreur lors de la soumission" }, { status: 500 });
  }
}
