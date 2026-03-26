import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { extractTextFromPDF } from "@/lib/pdf-parser";
import {
  openai,
  COURSE_ANALYSIS_PROMPT,
  IS_OPENAI_MOCK,
  MOCK_COURSE_ANALYSES,
  simulateDelay,
} from "@/lib/openai";

const IS_MOCK =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Seuls les fichiers PDF sont acceptés" }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)" }, { status: 400 });
    }

    // Mock mode — demo response
    if (IS_MOCK) {
      await simulateDelay(2000);
      const mock = MOCK_COURSE_ANALYSES.default as {
        course_title: string;
        concepts: unknown[];
      };
      return NextResponse.json({
        course_id: `mock-course-${Date.now()}`,
        title: mock.course_title,
        concept_count: mock.concepts.length,
      });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Enforce free-plan course limit
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();
    if (profile?.plan === "free") {
      const { count } = await supabase
        .from("courses")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      if ((count ?? 0) >= 2) {
        return NextResponse.json(
          { error: "Limite du plan gratuit atteinte (2 cours maximum)" },
          { status: 403 }
        );
      }
    }

    // Extract text from PDF
    const buffer = Buffer.from(await file.arrayBuffer());
    const contentText = await extractTextFromPDF(buffer);

    // Upload PDF to Supabase Storage
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${user.id}/${Date.now()}-${safeName}`;
    const { data: storageData } = await supabase.storage
      .from("course-pdfs")
      .upload(filePath, buffer, { contentType: "application/pdf", upsert: false });

    // Analyse with OpenAI
    let analysis: {
      course_title: string;
      description?: string;
      concepts: { title: string; content: string; chapter?: string; difficulty?: number }[];
    };

    if (IS_OPENAI_MOCK || !openai) {
      analysis = MOCK_COURSE_ANALYSES.default as typeof analysis;
    } else {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: COURSE_ANALYSIS_PROMPT },
          { role: "user", content: contentText.slice(0, 50_000) },
        ],
        response_format: { type: "json_object" },
      });
      analysis = JSON.parse(completion.choices[0].message.content ?? "{}");
    }

    const conceptsToInsert = (analysis.concepts ?? []).slice(0, 30);

    // Save course
    const { data: course, error: courseErr } = await supabase
      .from("courses")
      .insert({
        user_id: user.id,
        title: analysis.course_title ?? "Cours sans titre",
        description: analysis.description ?? null,
        file_url: storageData?.path ?? null,
        content_text: contentText.slice(0, 50_000),
        total_concepts: conceptsToInsert.length,
      })
      .select()
      .single();

    if (courseErr || !course) {
      return NextResponse.json({ error: "Impossible de sauvegarder le cours" }, { status: 500 });
    }

    // Save concepts
    if (conceptsToInsert.length > 0) {
      await supabase.from("concepts").insert(
        conceptsToInsert.map((c) => ({
          course_id: course.id,
          title: c.title,
          content: c.content,
          mastery_score: 0,
        }))
      );
    }

    return NextResponse.json({
      course_id: course.id,
      title: course.title,
      concept_count: conceptsToInsert.length,
    });
  } catch (err) {
    console.error("[upload] error:", err);
    return NextResponse.json({ error: "Erreur lors du traitement du fichier" }, { status: 500 });
  }
}
