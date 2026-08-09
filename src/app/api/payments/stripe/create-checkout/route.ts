import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth-server";
import { isQuoteExpired } from "@/lib/consolidation-quote";
import { getStripeClient } from "@/lib/stripe";

export async function POST(request: Request) {
  const auth = await requireVerifiedUser(request);
  if (!auth.ok) return auth.response;

  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 503 },
    );
  }

  let body: { shipmentOrderId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const shipmentOrderId = body.shipmentOrderId?.trim();
  if (!shipmentOrderId) {
    return NextResponse.json(
      { error: "shipmentOrderId is required." },
      { status: 400 },
    );
  }

  const { data: shipment, error } = await auth.db
    .from("shipments")
    .select("*")
    .eq("id", shipmentOrderId)
    .eq("profile_id", auth.profile.id)
    .maybeSingle();

  if (error || !shipment) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (shipment.payment_status === "paid") {
    return NextResponse.json(
      { error: "This order is already paid." },
      { status: 409 },
    );
  }

  if (!shipment.quote_id) {
    return NextResponse.json(
      { error: "Order is missing a quote." },
      { status: 400 },
    );
  }

  const { data: quote } = await auth.db
    .from("shipping_quotes")
    .select("*")
    .eq("id", shipment.quote_id)
    .maybeSingle();

  if (!quote) {
    return NextResponse.json({ error: "Quote not found." }, { status: 404 });
  }

  if (isQuoteExpired(String(quote.expires_at)) || quote.status === "expired") {
    return NextResponse.json(
      {
        error:
          "This shipping quote has expired. Please request a new quote.",
        code: "quote_expired",
      },
      { status: 410 },
    );
  }

  const tier = shipment.selected_tier === "economy" ? "economy" : "standard";
  const serverPrice =
    tier === "economy" ? Number(quote.economy_price) : Number(quote.standard_price);

  if (!Number.isFinite(serverPrice) || serverPrice <= 0) {
    return NextResponse.json(
      { error: "Invalid server-side price for this quote." },
      { status: 400 },
    );
  }

  // Authoritative amount from quote, not browser
  await auth.db
    .from("shipments")
    .update({ shipping_cost: serverPrice })
    .eq("id", shipment.id);

  const origin = new URL(request.url).origin;
  const productName = `IndiRoute International Shipping - ${
    tier === "standard" ? "Standard" : "Economy"
  }`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: shipment.delivery_email || auth.profile.email || undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: String(quote.currency || "INR").toLowerCase(),
          unit_amount: Math.round(serverPrice * 100),
          product_data: {
            name: productName,
            description: `Chargeable weight ${quote.chargeable_weight_kg} kg`,
          },
        },
      },
    ],
    success_url: `${origin}/dashboard/shipments/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/dashboard/shipments/${shipment.id}?payment=cancelled`,
    metadata: {
      shipment_order_id: shipment.id,
      quote_id: String(quote.id),
      consolidation_request_id: String(shipment.consolidation_request_id ?? ""),
      profile_id: auth.profile.id,
      firebase_uid: auth.decoded.uid,
      selected_tier: tier,
    },
  });

  await auth.db
    .from("shipments")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", shipment.id);

  await auth.db
    .from("payments")
    .update({ stripe_checkout_session_id: session.id, amount: serverPrice })
    .eq("shipment_id", shipment.id)
    .in("status", ["pending", "requires_action"]);

  return NextResponse.json({
    url: session.url,
    sessionId: session.id,
  });
}
