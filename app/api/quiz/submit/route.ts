import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateMasteryScore, getMasteryLevel } from "@/lib/mastery";
import type { LevelUpEvent } from "@/types/database";

interface AnswerInput {
  question_id: string;
  selected_option: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const sessionId: string = body.session_id;
    const answers: AnswerInput[] = body.answers ?? [];
    const durationSeconds: number = body.duration_seconds ?? 0;

    if (!sessionId) {
      return NextResponse.json({ error: "session_id requis" }, { status: 400 });
    }

    // Verify session belongs to user
    const { data: session } = await supabase
      .from("quiz_sessions")
      .select("id, user_id, total_questions")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (!session) {
      return NextResponse.json(
        { error: "Session introuvable" },
        { status: 404 }
      );
    }

    // Fetch questions for this session
    const { data: questions } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("session_id", sessionId);

    if (!questions) {
      return NextResponse.json(
        { error: "Questions introuvables" },
        { status: 404 }
      );
    }

    let correctCount = 0;
    const levelUps: LevelUpEvent[] = [];

    // Process each answer
    for (const answer of answers) {
      const question = questions.find((q) => q.id === answer.question_id);
      if (!question) continue;

      const isCorrect = answer.selected_option === question.correct_option;
      if (isCorrect) correctCount++;

      // Update question
      await supabase
        .from("quiz_questions")
        .update({
          user_answer: answer.selected_option,
          is_correct: isCorrect,
        })
        .eq("id", question.id);

      // Fetch current concept mastery
      const { data: concept } = await supabase
        .from("concepts")
        .select("id, title, mastery_score, times_tested, times_correct")
        .eq("id", question.concept_id)
        .single();

      if (concept) {
        const oldLevel = getMasteryLevel(concept.mastery_score).level;
        const newScore = updateMasteryScore(concept.mastery_score, isCorrect);
        const newLevel = getMasteryLevel(newScore).level;

        await supabase
          .from("concepts")
          .update({
            mastery_score: newScore,
            times_tested: concept.times_tested + 1,
            times_correct: concept.times_correct + (isCorrect ? 1 : 0),
            last_tested_at: new Date().toISOString(),
          })
          .eq("id", concept.id);

        if (newLevel > oldLevel) {
          levelUps.push({
            concept_id: concept.id,
            concept_title: concept.title,
            old_level: oldLevel,
            new_level: newLevel,
          });
        }
      }
    }

    const score = questions.length > 0 ? correctCount / questions.length : 0;

    // Update session as completed
    await supabase
      .from("quiz_sessions")
      .update({
        correct_answers: correctCount,
        score,
        duration_seconds: durationSeconds,
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    return NextResponse.json({
      score,
      correct: correctCount,
      total: questions.length,
      level_ups: levelUps,
    });
  } catch (err) {
    console.error("Quiz submit error:", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
