import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  openai,
  IS_OPENAI_MOCK,
  QUIZ_GENERATION_PROMPT,
  MOCK_QUIZ_QUESTION,
  simulateDelay,
} from "@/lib/openai";
import { selectConceptsForQuiz } from "@/lib/mastery";
import type { Concept } from "@/types/database";

const DEFAULT_QUESTION_COUNT = 5;
const MAX_QUESTION_COUNT = 20;

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
    const courseId: string = body.course_id;
    const mode: string = body.mode ?? "adaptive";
    const questionCount: number = Math.min(
      body.question_count ?? DEFAULT_QUESTION_COUNT,
      MAX_QUESTION_COUNT
    );

    if (!courseId) {
      return NextResponse.json({ error: "course_id requis" }, { status: 400 });
    }

    // Verify course belongs to user
    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .eq("id", courseId)
      .eq("user_id", user.id)
      .single();

    if (!course) {
      return NextResponse.json({ error: "Cours introuvable" }, { status: 404 });
    }

    // Fetch concepts
    const { data: allConcepts } = await supabase
      .from("concepts")
      .select("*")
      .eq("course_id", courseId);

    if (!allConcepts || allConcepts.length === 0) {
      return NextResponse.json(
        { error: "Aucun concept trouvé pour ce cours" },
        { status: 422 }
      );
    }

    // Select concepts by priority
    const selectedConcepts = selectConceptsForQuiz(
      allConcepts as Concept[],
      questionCount
    );

    // Create quiz session
    const { data: session, error: sessionError } = await supabase
      .from("quiz_sessions")
      .insert({
        user_id: user.id,
        course_id: courseId,
        mode,
        total_questions: selectedConcepts.length,
      })
      .select()
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Erreur lors de la création de la session" },
        { status: 500 }
      );
    }

    // Generate questions
    const questions = [];

    if (IS_OPENAI_MOCK || !openai) {
      await simulateDelay(1000);
      // Return mock questions for each concept
      for (const concept of selectedConcepts) {
        questions.push({
          id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          session_id: session.id,
          concept_id: concept.id,
          question_text: MOCK_QUIZ_QUESTION.question,
          options: MOCK_QUIZ_QUESTION.options,
          correct_option: MOCK_QUIZ_QUESTION.correct_index,
          user_answer: null,
          is_correct: null,
          explanation: MOCK_QUIZ_QUESTION.explanation,
          created_at: new Date().toISOString(),
        });
      }
    } else {
      for (const concept of selectedConcepts) {
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: QUIZ_GENERATION_PROMPT },
              {
                role: "user",
                content: `Concept: ${concept.title}\n\n${concept.content}`,
              },
            ],
            temperature: 0.7,
            response_format: { type: "json_object" },
          });

          const raw = JSON.parse(
            completion.choices[0].message.content ?? "{}"
          );
          questions.push({
            session_id: session.id,
            concept_id: concept.id,
            question_text: raw.question,
            options: raw.options,
            correct_option: raw.correct_index,
            user_answer: null,
            is_correct: null,
            explanation: raw.explanation,
          });
        } catch (err) {
          console.error("GPT question generation error:", err);
        }
      }
    }

    // Insert questions into DB
    if (questions.length > 0) {
      await supabase.from("quiz_questions").insert(questions);
    }

    // Fetch inserted questions to get IDs
    const { data: dbQuestions } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("session_id", session.id)
      .order("created_at", { ascending: true });

    return NextResponse.json({
      session_id: session.id,
      questions: dbQuestions ?? questions,
    });
  } catch (err) {
    console.error("Quiz generate error:", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
