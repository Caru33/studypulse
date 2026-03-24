import Stripe from "stripe";

export const IS_STRIPE_MOCK = !process.env.STRIPE_SECRET_KEY;

export const stripe = IS_STRIPE_MOCK
  ? null
  : new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-02-25.clover",
    });

export async function createCheckoutSession(
  userId: string,
  email: string,
  stripeCustomerId: string | null,
  returnUrl: string
): Promise<{ url: string }> {
  if (IS_STRIPE_MOCK || !stripe) {
    return { url: `${returnUrl}?upgraded=true&mock=1` };
  }

  // Get or create Stripe customer
  let customerId = stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email,
      metadata: { user_id: userId },
    });
    customerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        price: process.env.STRIPE_PRO_PRICE_ID!,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    metadata: { user_id: userId },
    allow_promotion_codes: true,
  });

  return { url: session.url! };
}

export async function createPortalSession(
  stripeCustomerId: string,
  returnUrl: string
): Promise<{ url: string }> {
  if (IS_STRIPE_MOCK || !stripe) {
    return { url: returnUrl };
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });

  return { url: session.url };
}
