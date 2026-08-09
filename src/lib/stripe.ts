import Stripe from "stripe";

let stripeClient: Stripe | null | undefined;

/**
 * Server-only Stripe client. Returns null until STRIPE_SECRET_KEY is configured.
 * Never expose the secret key to the browser.
 */
export function getStripeClient(): Stripe | null {
  if (stripeClient !== undefined) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    stripeClient = null;
    return stripeClient;
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: "2026-07-29.dahlia",
  });

  return stripeClient;
}
