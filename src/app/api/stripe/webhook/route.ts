import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createNotification, notifyAdmins } from "@/lib/notifications";
import { getStripeClient } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

async function markShipmentPaid(params: {
  shipmentOrderId: string;
  session: Stripe.Checkout.Session;
}) {
  const db = getSupabaseAdmin();
  if (!db) {
    throw new Error("Supabase admin unavailable");
  }

  const { data: shipment } = await db
    .from("shipments")
    .select("*")
    .eq("id", params.shipmentOrderId)
    .maybeSingle();

  if (!shipment) {
    console.error("[stripe/webhook] shipment missing", params.shipmentOrderId);
    return;
  }

  // Idempotent: already paid
  if (shipment.payment_status === "paid") {
    return;
  }

  const amountPaid =
    params.session.amount_total != null
      ? params.session.amount_total / 100
      : Number(shipment.shipping_cost);
  const currency = (
    params.session.currency ||
    shipment.currency ||
    "inr"
  ).toUpperCase();
  const paymentIntentId =
    typeof params.session.payment_intent === "string"
      ? params.session.payment_intent
      : params.session.payment_intent?.id ?? null;

  const paidAt = new Date().toISOString();

  await db
    .from("shipments")
    .update({
      payment_status: "paid",
      status: "ready_to_ship",
      paid_at: paidAt,
      stripe_checkout_session_id: params.session.id,
      shipping_cost: amountPaid,
      currency,
    })
    .eq("id", shipment.id)
    .neq("payment_status", "paid");

  // Upsert payment as paid (unique on session id)
  const { data: existingPayment } = await db
    .from("payments")
    .select("id, status")
    .or(
      `stripe_checkout_session_id.eq.${params.session.id},shipment_id.eq.${shipment.id}`,
    )
    .limit(1)
    .maybeSingle();

  if (existingPayment) {
    if (existingPayment.status !== "paid" && existingPayment.status !== "succeeded") {
      await db
        .from("payments")
        .update({
          status: "paid",
          amount: amountPaid,
          currency,
          stripe_checkout_session_id: params.session.id,
          stripe_payment_intent_id: paymentIntentId,
          paid_at: paidAt,
        })
        .eq("id", existingPayment.id);
    }
  } else {
    await db.from("payments").insert({
      profile_id: shipment.profile_id,
      shipment_id: shipment.id,
      quote_id: shipment.quote_id,
      amount: amountPaid,
      currency,
      status: "paid",
      provider: "stripe",
      stripe_checkout_session_id: params.session.id,
      stripe_payment_intent_id: paymentIntentId,
      paid_at: paidAt,
      description: `IndiRoute International Shipping - ${
        shipment.selected_tier === "economy" ? "Economy" : "Standard"
      }`,
    });
  }

  if (shipment.quote_id) {
    await db
      .from("shipping_quotes")
      .update({ status: "paid" })
      .eq("id", shipment.quote_id);
  }

  if (shipment.consolidation_request_id) {
    await db
      .from("consolidation_requests")
      .update({ status: "completed" })
      .eq("id", shipment.consolidation_request_id);

    const { data: links } = await db
      .from("consolidation_request_parcels")
      .select("parcel_id")
      .eq("consolidation_request_id", shipment.consolidation_request_id);

    const parcelIds = (links ?? []).map((l) => l.parcel_id);
    if (parcelIds.length > 0) {
      await db
        .from("parcels")
        .update({ status: "assigned_to_shipment" })
        .in("id", parcelIds);
    }
  }

  const { data: locker } = await db
    .from("lockers")
    .select("locker_code")
    .eq("profile_id", shipment.profile_id)
    .maybeSingle();

  const { data: profile } = await db
    .from("profiles")
    .select("first_name, last_name, email")
    .eq("id", shipment.profile_id)
    .maybeSingle();

  const customerName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  await createNotification(db, {
    profileId: shipment.profile_id,
    title: "Payment Successful",
    body: `Payment received for shipment ${shipment.id.slice(0, 8)}…. Your shipment is being prepared for dispatch.`,
    type: "payment_successful",
  });

  await notifyAdmins(db, {
    title: "PAYMENT RECEIVED",
    body: [
      customerName || profile?.email || "Customer",
      `Locker ${locker?.locker_code ?? "N/A"}`,
      `Order ${shipment.id.slice(0, 8)}…`,
      `${shipment.selected_tier ?? shipment.service_type} · ${currency} ${amountPaid}`,
      `${shipment.delivery_city ?? ""}, ${shipment.delivery_country ?? ""}`,
      `${shipment.parcel_count ?? "?"} parcels`,
    ]
      .filter(Boolean)
      .join(" · "),
    type: "admin_payment_received",
  });

  await db.from("audit_logs").insert({
    actor_profile_id: shipment.profile_id,
    action: "payment.paid",
    entity_type: "shipment",
    entity_id: shipment.id,
    metadata: {
      stripe_checkout_session_id: params.session.id,
      stripe_payment_intent_id: paymentIntentId,
      amount: amountPaid,
      currency,
    },
  });
}

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const db = getSupabaseAdmin();

  if (!stripe || !webhookSecret || !db) {
    return NextResponse.json(
      { error: "Stripe webhook not configured." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe/webhook] invalid signature", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status !== "paid" && event.type === "checkout.session.completed") {
          // Some methods stay unpaid until async success
          if (session.payment_status !== "no_payment_required") {
            break;
          }
        }
        const shipmentOrderId = session.metadata?.shipment_order_id;
        if (shipmentOrderId) {
          await markShipmentPaid({ shipmentOrderId, session });
        }
        break;
      }
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const shipmentOrderId = session.metadata?.shipment_order_id;
        if (shipmentOrderId) {
          await db
            .from("shipments")
            .update({ payment_status: "failed" })
            .eq("id", shipmentOrderId)
            .eq("payment_status", "pending");
          await db
            .from("payments")
            .update({ status: "failed" })
            .eq("stripe_checkout_session_id", session.id);
        }
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const shipmentOrderId = session.metadata?.shipment_order_id;
        if (shipmentOrderId) {
          await db
            .from("shipments")
            .update({ payment_status: "expired" })
            .eq("id", shipmentOrderId)
            .eq("payment_status", "pending");
          await db
            .from("payments")
            .update({ status: "expired" })
            .eq("stripe_checkout_session_id", session.id)
            .eq("status", "pending");
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe/webhook] handler error", err);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
