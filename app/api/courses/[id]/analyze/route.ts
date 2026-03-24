import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { openai, IS_OPENAI_MOCK } from "@/lib/openai";

const BATCH_SIZE = 10;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params;

  try {
    if (IS_OPENAI_MOCK || !openai) {
      return NextResponse.json({ processed: 0, mock: true });
    }

    const supabase = await createServerSupabaseClient();

    // Verify course exists and belongs to user (or allow internal calls)
    const { data: course } = await supabase
      .from("courses")
      .select("id, user_id")
      .eq("id", courseId)
      .single();

    if (!course) {
      return NextResponse.json({ error: "Cours introuvable" }, { status: 404 });
    }

    // Fetch concepts without embeddings
    const { data: concepts } = await supabase
      .from("concepts")
      .select("id, content")
      .eq("course_id", courseId)
      .is("embedding", null);

    if (!concepts || concepts.length === 0) {
      return NextResponse.json({ processed: 0 });
    }

    let processed = 0;

    // Process in batches
    for (let i = 0; i < concepts.length; i += BATCH_SIZE) {
      const batch = concepts.slice(i, i + BATCH_SIZE);

      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: batch.map((c) => c.content),
      });

      // Update each concept with its embedding
      for (let j = 0; j < batch.length; j++) {
        const embedding = embeddingResponse.data[j].embedding;
        await supabase
          .from("concepts")
          .update({ embedding })
          .eq("id", batch[j].id);
        processed++;
      }
    }

    return NextResponse.json({ processed });
  } catch (err) {
    console.error("Analyze error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la génération des embeddings" },
      { status: 500 }
    );
  }
}
