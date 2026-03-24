import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  openai,
  IS_OPENAI_MOCK,
  FLASHCARD_PROMPT,
  MOCK_FLASHCARDS,
  simulateDelay,
} from "@/lib/openai";
import { checkFeatureLimit } from "@/lib/feature-gate";

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
    const conceptIds: string[] | undefined = body.concept_ids;

    if (!courseId) {
      return NextResponse.json({ error: "course_id requis" }, { status: 400 });
    }

    // Feature gate
    const gate = await checkFeatureLimit(user.id, "flashcard_generate", {
      courseId,
    });
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.reason }, { status: 403 });
    }

    // Verify course ownership
    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .eq("id", courseId)
      .eq("user_id", user.id)
      .single();

    if (!course) {
      return NextResponse.json({ error: "Cours introuvable" }, { status: 404 });
    }

    // Fetch concepts to generate flashcards for
    let query = supabase
      .from("concepts")
      .select("id, title, content")
      .eq("course_id", courseId);

    if (conceptIds && conceptIds.length > 0) {
      query = query.in("id", conceptIds);
    } else {
      query = query.limit(5);
    }

    const { data: concepts } = await query;

    if (!concepts || concepts.length === 0) {
      return NextResponse.json(
        { error: "Aucun concept trouvé" },
        { status: 422 }
      );
    }

    const allFlashcards = [];

    if (IS_OPENAI_MOCK || !openai) {
      await simulateDelay(800);
      for (const concept of concepts) {
        for (const card of MOCK_FLASHCARDS.slice(0, 3)) {
          allFlashcards.push({
            user_id: user.id,
            course_id: courseId,
            concept_id: concept.id,
            front: card.front,
            back: card.back,
          });
        }
      }
    } else {
      for (const concept of concepts) {
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: FLASHCARD_PROMPT },
              {
                role: "user",
                content: `Concept: ${concept.title}\n\n${concept.content}`,
              },
            ],
            temperature: 0.5,
            response_format: { type: "json_object" },
          });

          const raw = JSON.parse(
            completion.choices[0].message.content ?? "{}"
          );
          const cards = raw.flashcards ?? [];

          for (const card of cards) {
            allFlashcards.push({
              user_id: user.id,
              course_id: courseId,
              concept_id: concept.id,
              front: card.front,
              back: card.back,
            });
          }
        } catch (err) {
          console.error("Flashcard generation error:", err);
        }
      }
    }

    if (allFlashcards.length === 0) {
      return NextResponse.json(
        { error: "Erreur lors de la génération des flashcards" },
        { status: 500 }
      );
    }

    const { data: inserted, error } = await supabase
      .from("flashcards")
      .insert(allFlashcards)
      .select();

    if (error) {
      return NextResponse.json(
        { error: "Erreur lors de la sauvegarde" },
        { status: 500 }
      );
    }

    return NextResponse.json({ flashcards: inserted });
  } catch (err) {
    console.error("Flashcard generate error:", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
