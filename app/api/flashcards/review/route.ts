import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sm2, QUALITY_MAP, type DifficultyRating } from "@/lib/sm2";

const IS_MOCK =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project");

export async function POST(req: NextRequest) {
  try {
    const { flashcard_id, rating } = (await req.json()) as {
      flashcard_id: string;
      rating: DifficultyRating;
    };

    // Mock mode — no-op
    if (IS_MOCK || flashcard_id?.startsWith("mock-")) {
      return NextResponse.json({ success: true });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { data: card } = await supabase
      .from("flashcards")
      .select("ease_factor, interval_days, repetitions")
      .eq("id", flashcard_id)
      .eq("user_id", user.id)
      .single();

    if (!card) {
      return NextResponse.json({ error: "Flashcard introuvable" }, { status: 404 });
    }

    const quality = QUALITY_MAP[rating] ?? 3;
    const result = sm2(quality, card);

    await supabase
      .from("flashcards")
      .update({
        ease_factor: result.ease_factor,
        interval_days: result.interval_days,
        repetitions: result.repetitions,
        next_review_date: result.next_review_date,
        last_reviewed_at: new Date().toISOString(),
      })
      .eq("id", flashcard_id);

    return NextResponse.json({ success: true, next_review_date: result.next_review_date });
  } catch (err) {
    console.error("[flashcards/review] error:", err);
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}
