import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createPortalSession } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    const returnUrl =
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/settings`;

    if (!profile?.stripe_customer_id) {
      // No customer yet — redirect to checkout
      return NextResponse.json(
        { error: "Aucun abonnement actif trouvé" },
        { status: 400 }
      );
    }

    const result = await createPortalSession(
      profile.stripe_customer_id,
      returnUrl
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("Portal error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la création du portail" },
      { status: 500 }
    );
  }
}
