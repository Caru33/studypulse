import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  openai,
  QUIZ_GENERATION_PROMPT,
  IS_OPENAI_MOCK,
  MOCK_QUIZ_QUESTION,
  simulateDelay,
} from "@/lib/openai";
import { selectConceptsForQuiz } from "@/lib/mastery";
import { MOCK_QUIZ_QUESTIONS } from "@/lib/mock-data";
import type { QuizQuestion } from "@/types/database";

const IS_MOCK =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project");

export async function POST(req: NextRequest) {
  try {
    const {
      course_id,
      mode = "adaptive",
      question_count = 5,
    } = (await req.json()) as { course_id: string; mode?: string; question_count?: number };

    if (!course_id) {
      return NextResponse.json({ error: "course_id requis" }, { status: 400 });
    }

    // Mock mode
    if (IS_MOCK) {
      await simulateDelay(1200);
      const sessionId = `mock-${Date.now()}`;
      const questions: QuizQuestion[] = Array.from(
        { length: Math.min(question_count, MOCK_QUIZ_QUESTIONS.length) },
        (_, i) => ({
          ...MOCK_QUIZ_QUESTIONS[i % MOCK_QUIZ_QUESTIONS.length],
          id: `${MOCK_QUIZ_QUESTIONS[i % MOCK_QUIZ_QUESTIONS.length].id}-run${i}`,
          session_id: sessionId,
        })
      );
      return NextResponse.json({ session_id: sessionId, questions });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    // Daily question limit for free plan
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();
    if (profile?.plan === "free") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("quiz_questions")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startOfDay.toISOString());
      if ((count ?? 0) >= 10) {
        return NextResponse.json(
          { error: "Limite quotidienne de 10 questions atteinte. Passez à Pro pour continuer." },
          { status: 403 }
        );
      }
    }

    // Load concepts
    const { data: concepts } = await supabase
      .from("concepts")
      .select("*")
      .eq("course_id", course_id);

    if (!concepts || concepts.length === 0) {
      return NextResponse.json({ error: "Aucun concept trouvé pour ce cours" }, { status: 404 });
    }

    const count = mode === "exam_prep" ? 20 : question_count;
    const selected = selectConceptsForQuiz(concepts, count);

    // Create session
    const { data: session } = await supabase
      .from("quiz_sessions")
      .insert({ user_id: user.id, course_id, mode, total_questions: selected.length })
      .select()
      .single();

    if (!session) {
      return NextResponse.json({ error: "Impossible de créer la session" }, { status: 500 });
    }

    // Generate one question per concept
    const questions: QuizQuestion[] = [];
    for (const concept of selected) {
      let q: { question: string; options: string[]; correct_index: number; explanation: string };

      if (IS_OPENAI_MOCK || !openai) {
        q = {
          question: MOCK_QUIZ_QUESTION.question,
          options: [...MOCK_QUIZ_QUESTION.options],
          correct_index: MOCK_QUIZ_QUESTION.correct_index,
          explanation: MOCK_QUIZ_QUESTION.explanation,
        };
      } else {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: QUIZ_GENERATION_PROMPT },
            { role: "user", content: `Concept : ${concept.title}\n\n${concept.content}` },
          ],
          response_format: { type: "json_object" },
        });
        q = JSON.parse(completion.choices[0].message.content ?? "{}");
      }

      const { data: saved } = await supabase
        .from("quiz_questions")
        .insert({
          session_id: session.id,
          concept_id: concept.id,
          question_text: q.question,
          options: q.options,
          correct_option: q.correct_index,
          explanation: q.explanation,
        })
        .select()
        .single();

      if (saved) questions.push(saved as QuizQuestion);
    }

    return NextResponse.json({ session_id: session.id, questions });
  } catch (err) {
    console.error("[quiz/generate] error:", err);
    return NextResponse.json({ error: "Erreur lors de la génération du quiz" }, { status: 500 });
  }
}
