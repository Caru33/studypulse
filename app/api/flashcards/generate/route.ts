import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  openai,
  FLASHCARD_PROMPT,
  IS_OPENAI_MOCK,
  MOCK_FLASHCARDS,
  simulateDelay,
} from "@/lib/openai";

const IS_MOCK =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project");

export async function POST(req: NextRequest) {
  try {
    const { course_id } = (await req.json()) as { course_id: string };
    if (!course_id) {
      return NextResponse.json({ error: "course_id requis" }, { status: 400 });
    }

    // Mock mode
    if (IS_MOCK) {
      await simulateDelay(1500);
      const today = new Date().toISOString().split("T")[0];
      const mockCards = MOCK_FLASHCARDS.map((f, i) => ({
        id: `mock-fc-${i}`,
        user_id: "mock-user",
        course_id,
        concept_id: "mock-concept",
        front: f.front,
        back: f.back,
        ease_factor: 2.5,
        interval_days: 1,
        repetitions: 0,
        next_review_date: today,
        last_reviewed_at: null,
        created_at: new Date().toISOString(),
      }));
      return NextResponse.json({ flashcards: mockCards, flashcard_count: mockCards.length });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    // Return existing cards if already generated
    const { data: existing } = await supabase
      .from("flashcards")
      .select("id")
      .eq("course_id", course_id)
      .eq("user_id", user.id)
      .limit(1);

    if (existing && existing.length > 0) {
      const { data: all } = await supabase
        .from("flashcards")
        .select("*")
        .eq("course_id", course_id)
        .eq("user_id", user.id);
      return NextResponse.json({ flashcards: all ?? [], flashcard_count: all?.length ?? 0 });
    }

    // Load concepts
    const { data: concepts } = await supabase
      .from("concepts")
      .select("*")
      .eq("course_id", course_id)
      .limit(20);

    if (!concepts || concepts.length === 0) {
      return NextResponse.json({ error: "Aucun concept trouvé" }, { status: 404 });
    }

    const today = new Date().toISOString().split("T")[0];
    const allFlashcards: Record<string, unknown>[] = [];

    for (const concept of concepts.slice(0, 10)) {
      let cards: { front: string; back: string }[];

      if (IS_OPENAI_MOCK || !openai) {
        cards = MOCK_FLASHCARDS.slice(0, 3).map((f) => ({ front: f.front, back: f.back }));
      } else {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: FLASHCARD_PROMPT },
            { role: "user", content: `Concept : ${concept.title}\n\n${concept.content}` },
          ],
          response_format: { type: "json_object" },
        });
        const result = JSON.parse(completion.choices[0].message.content ?? "{}");
        cards = result.flashcards ?? [];
      }

      const { data: saved } = await supabase
        .from("flashcards")
        .insert(
          cards.map((c) => ({
            user_id: user.id,
            course_id,
            concept_id: concept.id,
            front: c.front,
            back: c.back,
            next_review_date: today,
          }))
        )
        .select();
      if (saved) allFlashcards.push(...saved);
    }

    return NextResponse.json({
      flashcards: allFlashcards,
      flashcard_count: allFlashcards.length,
    });
  } catch (err) {
    console.error("[flashcards/generate] error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la génération des flashcards" },
      { status: 500 }
    );
  }
}
