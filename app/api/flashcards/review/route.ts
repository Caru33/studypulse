import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sm2, QUALITY_MAP, type DifficultyRating } from "@/lib/sm2";

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
    const flashcardId: string = body.flashcard_id;
    const rating: DifficultyRating = body.rating;

    if (!flashcardId || !rating) {
      return NextResponse.json(
        { error: "flashcard_id et rating requis" },
        { status: 400 }
      );
    }

    if (!(rating in QUALITY_MAP)) {
      return NextResponse.json({ error: "Rating invalide" }, { status: 400 });
    }

    // Fetch flashcard and verify ownership
    const { data: flashcard } = await supabase
      .from("flashcards")
      .select("*")
      .eq("id", flashcardId)
      .eq("user_id", user.id)
      .single();

    if (!flashcard) {
      return NextResponse.json(
        { error: "Flashcard introuvable" },
        { status: 404 }
      );
    }

    // Apply SM-2 algorithm
    const quality = QUALITY_MAP[rating];
    const result = sm2(quality, {
      ease_factor: flashcard.ease_factor,
      interval_days: flashcard.interval_days,
      repetitions: flashcard.repetitions,
    });

    // Update flashcard
    const { data: updated } = await supabase
      .from("flashcards")
      .update({
        ease_factor: result.ease_factor,
        interval_days: result.interval_days,
        repetitions: result.repetitions,
        next_review_date: result.next_review_date,
        last_reviewed_at: new Date().toISOString(),
      })
      .eq("id", flashcardId)
      .select()
      .single();

    return NextResponse.json({ flashcard: updated });
  } catch (err) {
    console.error("Flashcard review error:", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
