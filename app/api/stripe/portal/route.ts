import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createPortalSession } from "@/lib/stripe";

export async function POST(_req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: "Aucun abonnement trouvé" }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const { url } = await createPortalSession(
      profile.stripe_customer_id,
      `${appUrl}/settings`
    );

    return NextResponse.json({ url });
  } catch (err) {
    console.error("[stripe/portal] error:", err);
    return NextResponse.json({ error: "Erreur lors de la création du portail" }, { status: 500 });
  }
}
