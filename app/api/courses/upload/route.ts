import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { extractTextFromPDF } from "@/lib/pdf-parser";
import {
  openai,
  IS_OPENAI_MOCK,
  COURSE_ANALYSIS_PROMPT,
  MOCK_COURSE_ANALYSES,
  simulateDelay,
} from "@/lib/openai";
import { checkFeatureLimit } from "@/lib/feature-gate";

const MAX_CONCEPTS = 30;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Feature gate
    const gate = await checkFeatureLimit(user.id, "course_upload");
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.reason }, { status: 403 });
    }

    // Parse multipart form
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }
    if (!file.name.endsWith(".pdf") && file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Seuls les fichiers PDF sont acceptés" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Extract text from PDF
    let courseText: string;
    try {
      courseText = await extractTextFromPDF(buffer);
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? err.message
              : "Impossible d'extraire le texte du PDF",
        },
        { status: 422 }
      );
    }

    // 2. Upload PDF to Supabase Storage
    let fileUrl: string | null = null;
    if (!IS_OPENAI_MOCK) {
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { data: storageData } = await supabase.storage
        .from("courses")
        .upload(fileName, buffer, { contentType: "application/pdf" });

      if (storageData) {
        const { data: urlData } = supabase.storage
          .from("courses")
          .getPublicUrl(storageData.path);
        fileUrl = urlData.publicUrl;
      }
    }

    // 3. Analyze with GPT-4o (or mock)
    let analysis: {
      course_title: string;
      description: string;
      concepts: Array<{
        title: string;
        content: string;
        chapter: string;
        difficulty: number;
      }>;
    };

    if (IS_OPENAI_MOCK || !openai) {
      await simulateDelay(1500);
      analysis = MOCK_COURSE_ANALYSES.default as typeof analysis;
    } else {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: COURSE_ANALYSIS_PROMPT },
          {
            role: "user",
            content: `Voici le contenu du document à analyser:\n\n${courseText}`,
          },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const rawJson = completion.choices[0].message.content ?? "{}";
      analysis = JSON.parse(rawJson);
    }

    // Limit concepts
    const concepts = (analysis.concepts ?? []).slice(0, MAX_CONCEPTS);

    // 4. Insert course row
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .insert({
        user_id: user.id,
        title: analysis.course_title || file.name.replace(".pdf", ""),
        description: analysis.description || null,
        file_url: fileUrl,
        content_text: courseText.slice(0, 10000), // store first 10k chars
        total_concepts: concepts.length,
      })
      .select()
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: "Erreur lors de la création du cours" },
        { status: 500 }
      );
    }

    // 5. Insert concepts
    const conceptRows = concepts.map((c) => ({
      course_id: course.id,
      title: c.title,
      content: c.content,
      embedding: null, // populated asynchronously
    }));

    const { error: conceptsError } = await supabase
      .from("concepts")
      .insert(conceptRows);

    if (conceptsError) {
      console.error("Error inserting concepts:", conceptsError);
    }

    // 6. Trigger background embedding generation (fire-and-forget)
    if (!IS_OPENAI_MOCK) {
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      fetch(`${appUrl}/api/courses/${course.id}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }).catch(console.error);
    }

    return NextResponse.json({
      course_id: course.id,
      title: course.title,
      concept_count: concepts.length,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
