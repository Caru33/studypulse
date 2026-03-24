import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  openai,
  IS_OPENAI_MOCK,
  STUDY_PLAN_PROMPT,
  simulateDelay,
} from "@/lib/openai";
import { MOCK_STUDY_PLAN } from "@/lib/mock-data";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Check if an active plan already exists and is recent (< 7 days)
    const { data: existingPlan } = await supabase
      .from("study_plans")
      .select("id, generated_at")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();

    const forceRegenerate = (await request.json().catch(() => ({}))).force ?? false;

    if (existingPlan && !forceRegenerate) {
      const ageMs = Date.now() - new Date(existingPlan.generated_at).getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      if (ageDays < 7) {
        // Return existing plan
        const { data: plan } = await supabase
          .from("study_plans")
          .select("*")
          .eq("id", existingPlan.id)
          .single();
        return NextResponse.json({ plan, cached: true });
      }
    }

    // Fetch courses with their weakest concepts
    const { data: courses } = await supabase
      .from("courses")
      .select("id, title, mastery_score, exam_date, total_concepts")
      .eq("user_id", user.id)
      .order("mastery_score", { ascending: true });

    let planData;

    if (IS_OPENAI_MOCK || !openai || !courses || courses.length === 0) {
      await simulateDelay(1200);
      planData = MOCK_STUDY_PLAN.plan_data;
    } else {
      // Fetch weakest concepts per course (top 5)
      const courseContext = await Promise.all(
        courses.slice(0, 5).map(async (course) => {
          const { data: concepts } = await supabase
            .from("concepts")
            .select("title, mastery_score")
            .eq("course_id", course.id)
            .order("mastery_score", { ascending: true })
            .limit(5);

          return {
            ...course,
            weak_concepts: concepts?.map((c) => c.title) ?? [],
          };
        })
      );

      const today = new Date();
      const contextPrompt = `Voici les données de l'étudiant :
${courseContext
  .map(
    (c) =>
      `- ${c.title}: maîtrise ${Math.round((c.mastery_score ?? 0) * 100)}%, examen le ${
        c.exam_date ?? "non défini"
      }, lacunes: ${c.weak_concepts.join(", ")}`
  )
  .join("\n")}

Date d'aujourd'hui: ${today.toISOString().split("T")[0]}
Génère un plan sur 7 jours à partir d'aujourd'hui.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: STUDY_PLAN_PROMPT },
          { role: "user", content: contextPrompt },
        ],
        temperature: 0.4,
        response_format: { type: "json_object" },
      });

      planData = JSON.parse(completion.choices[0].message.content ?? "{}");
    }

    // Deactivate previous plans
    await supabase
      .from("study_plans")
      .update({ is_active: false })
      .eq("user_id", user.id);

    // Insert new plan
    const { data: newPlan } = await supabase
      .from("study_plans")
      .insert({
        user_id: user.id,
        plan_data: planData,
        is_active: true,
      })
      .select()
      .single();

    return NextResponse.json({ plan: newPlan });
  } catch (err) {
    console.error("Study plan generate error:", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
