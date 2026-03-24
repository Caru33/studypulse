import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { stripe, IS_STRIPE_MOCK } from "@/lib/stripe";

// IMPORTANT: Do NOT use request.json() here — Stripe requires the raw body for signature verification
export async function POST(request: NextRequest) {
  if (IS_STRIPE_MOCK || !stripe) {
    return NextResponse.json({ received: true, mock: true });
  }

  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing signature or webhook secret" },
      { status: 400 }
    );
  }

  let event;
  try {
    const rawBody = Buffer.from(await request.arrayBuffer());
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature invalid" },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as {
          metadata?: { user_id?: string };
          customer?: string;
          subscription?: string;
        };

        const userId = session.metadata?.user_id;
        if (!userId) break;

        await supabase
          .from("profiles")
          .update({
            plan: "pro",
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          })
          .eq("id", userId);

        console.log(`User ${userId} upgraded to Pro`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as {
          id: string;
          customer: string;
        };

        await supabase
          .from("profiles")
          .update({ plan: "free", stripe_subscription_id: null })
          .eq("stripe_subscription_id", subscription.id);

        console.log(`Subscription ${subscription.id} cancelled — downgraded to free`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as {
          id: string;
          status: string;
        };

        if (subscription.status === "active") {
          await supabase
            .from("profiles")
            .update({ plan: "pro" })
            .eq("stripe_subscription_id", subscription.id);
        } else if (
          subscription.status === "canceled" ||
          subscription.status === "unpaid"
        ) {
          await supabase
            .from("profiles")
            .update({ plan: "free" })
            .eq("stripe_subscription_id", subscription.id);
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    // Still return 200 to prevent Stripe from retrying
  }

  return NextResponse.json({ received: true });
}
