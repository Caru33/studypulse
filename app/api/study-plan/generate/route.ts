import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { openai, STUDY_PLAN_PROMPT, IS_OPENAI_MOCK, simulateDelay } from "@/lib/openai";
import { MOCK_STUDY_PLAN } from "@/lib/mock-data";

const IS_MOCK =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project");

export async function POST(_req: NextRequest) {
  try {
    // Mock mode
    if (IS_MOCK) {
      await simulateDelay(1000);
      return NextResponse.json({ plan: MOCK_STUDY_PLAN });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    // Load courses
    const { data: courses } = await supabase
      .from("courses")
      .select("id, title, exam_date, mastery_score")
      .eq("user_id", user.id);

    if (!courses || courses.length === 0) {
      return NextResponse.json({ error: "Aucun cours trouvé" }, { status: 404 });
    }

    // Load weakest concepts
    const courseIds = courses.map((c) => c.id);
    const { data: weakConcepts } = await supabase
      .from("concepts")
      .select("title, mastery_score, course_id")
      .in("course_id", courseIds)
      .order("mastery_score", { ascending: true })
      .limit(10);

    const coursesSummary = courses
      .map(
        (c) =>
          `${c.title} (maîtrise: ${Math.round((c.mastery_score ?? 0) * 100)}%${
            c.exam_date ? `, examen: ${c.exam_date}` : ""
          })`
      )
      .join("\n");

    const weakSummary =
      weakConcepts
        ?.map((c) => `- ${c.title} (${Math.round(c.mastery_score * 100)}%)`)
        .join("\n") ?? "Aucun concept faible identifié";

    let planData;
    if (IS_OPENAI_MOCK || !openai) {
      planData = MOCK_STUDY_PLAN.plan_data;
    } else {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: STUDY_PLAN_PROMPT },
          {
            role: "user",
            content: `Cours:\n${coursesSummary}\n\nConcepts les plus faibles:\n${weakSummary}\n\nDisponibilité estimée: 30 minutes par jour`,
          },
        ],
        response_format: { type: "json_object" },
      });
      planData = JSON.parse(completion.choices[0].message.content ?? "{}");
    }

    // Deactivate old plans
    await supabase.from("study_plans").update({ is_active: false }).eq("user_id", user.id);

    // Save new plan
    const { data: plan } = await supabase
      .from("study_plans")
      .insert({ user_id: user.id, plan_data: planData, is_active: true })
      .select()
      .single();

    return NextResponse.json({ plan });
  } catch (err) {
    console.error("[study-plan/generate] error:", err);
    return NextResponse.json({ error: "Erreur lors de la génération du plan" }, { status: 500 });
  }
}
