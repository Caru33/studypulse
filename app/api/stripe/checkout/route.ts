import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createCheckoutSession } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const returnUrl =
      body.return_url ??
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard`;

    // Fetch profile to get stripe_customer_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, plan")
      .eq("id", user.id)
      .single();

    if (profile?.plan === "pro") {
      return NextResponse.json(
        { error: "Vous êtes déjà abonné à Pro" },
        { status: 400 }
      );
    }

    const result = await createCheckoutSession(
      user.id,
      user.email!,
      profile?.stripe_customer_id ?? null,
      returnUrl
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la création de la session de paiement" },
      { status: 500 }
    );
  }
}
