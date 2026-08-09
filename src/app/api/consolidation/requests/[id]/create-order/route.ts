import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth-server";
import { isQuoteExpired } from "@/lib/consolidation-quote";

type RouteContext = { params: Promise<{ id: string }> };

type DeliveryBody = {
  tier?: "economy" | "standard";
  fullName?: string;
  phone?: string;
  email?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  deliveryInstructions?: string;
  saveAddress?: boolean;
};

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireVerifiedUser(request);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  let body: DeliveryBody;
  try {
    body = (await request.json()) as DeliveryBody;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (body.tier !== "economy" && body.tier !== "standard") {
    return NextResponse.json(
      { error: "Select IndiRoute Economy or Standard." },
      { status: 400 },
    );
  }

  if (
    !body.fullName?.trim() ||
    !body.phone?.trim() ||
    !body.line1?.trim() ||
    !body.city?.trim() ||
    !body.postalCode?.trim() ||
    !body.country?.trim()
  ) {
    return NextResponse.json(
      { error: "Complete delivery address is required before payment." },
      { status: 400 },
    );
  }

  const { data: reqRow, error: reqError } = await auth.db
    .from("consolidation_requests")
    .select("*")
    .eq("id", id)
    .eq("profile_id", auth.profile.id)
    .maybeSingle();

  if (reqError || !reqRow) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  if (!reqRow.active_quote_id) {
    return NextResponse.json(
      { error: "No shipping quote is available yet." },
      { status: 400 },
    );
  }

  const { data: quote } = await auth.db
    .from("shipping_quotes")
    .select("*")
    .eq("id", reqRow.active_quote_id)
    .maybeSingle();

  if (!quote) {
    return NextResponse.json({ error: "Quote not found." }, { status: 404 });
  }

  if (quote.status === "paid") {
    return NextResponse.json(
      { error: "This quote has already been paid." },
      { status: 409 },
    );
  }

  if (isQuoteExpired(String(quote.expires_at)) || quote.status === "expired") {
    await auth.db
      .from("shipping_quotes")
      .update({ status: "expired" })
      .eq("id", quote.id);
    return NextResponse.json(
      {
        error:
          "This shipping quote has expired. Please request a new quote.",
        code: "quote_expired",
      },
      { status: 410 },
    );
  }

  const price =
    body.tier === "economy" ? quote.economy_price : quote.standard_price;
  const available =
    body.tier === "economy"
      ? quote.economy_available
      : quote.standard_available;

  if (!available || price == null || Number(price) <= 0) {
    return NextResponse.json(
      { error: "Selected shipping service is not available on this quote." },
      { status: 400 },
    );
  }

  // Reuse pending unpaid order for same request+quote if present
  const { data: existingOrder } = await auth.db
    .from("shipments")
    .select("id, payment_status, status")
    .eq("consolidation_request_id", id)
    .eq("quote_id", quote.id)
    .eq("profile_id", auth.profile.id)
    .eq("payment_status", "pending")
    .in("status", ["awaiting_payment", "payment_pending", "draft"])
    .maybeSingle();

  const { data: parcelLinks } = await auth.db
    .from("consolidation_request_parcels")
    .select("parcel_id")
    .eq("consolidation_request_id", id);

  const parcelIds = (parcelLinks ?? []).map((p) => p.parcel_id);

  if (body.saveAddress) {
    await auth.db.from("addresses").insert({
      profile_id: auth.profile.id,
      label: body.fullName.trim(),
      line1: body.line1.trim(),
      line2: body.line2?.trim() || null,
      city: body.city.trim(),
      state: body.state?.trim() || null,
      postal_code: body.postalCode.trim(),
      country: body.country.trim(),
      is_default: false,
    });
  }

  const shipmentPayload = {
    profile_id: auth.profile.id,
    consolidation_request_id: id,
    quote_id: quote.id,
    status: "awaiting_payment",
    payment_status: "pending",
    destination_country: body.country.trim(),
    service_type: body.tier,
    selected_tier: body.tier,
    weight_kg: Number(quote.final_weight_kg),
    length_cm: Number(quote.final_length_cm),
    width_cm: Number(quote.final_width_cm),
    height_cm: Number(quote.final_height_cm),
    shipping_cost: Number(price),
    currency: String(quote.currency || "INR"),
    parcel_count: parcelIds.length,
    delivery_full_name: body.fullName.trim(),
    delivery_phone: body.phone.trim(),
    delivery_email: body.email?.trim() || auth.profile.email,
    delivery_line1: body.line1.trim(),
    delivery_line2: body.line2?.trim() || null,
    delivery_city: body.city.trim(),
    delivery_state: body.state?.trim() || null,
    delivery_postal_code: body.postalCode.trim(),
    delivery_country: body.country.trim(),
    delivery_instructions: body.deliveryInstructions?.trim() || null,
  };

  let shipmentId = existingOrder?.id;

  if (shipmentId) {
    const { error } = await auth.db
      .from("shipments")
      .update(shipmentPayload)
      .eq("id", shipmentId)
      .eq("payment_status", "pending");
    if (error) {
      return NextResponse.json(
        { error: "Unable to update order." },
        { status: 500 },
      );
    }
  } else {
    const { data: created, error } = await auth.db
      .from("shipments")
      .insert(shipmentPayload)
      .select("id")
      .single();
    if (error || !created) {
      return NextResponse.json(
        { error: "Unable to create shipment order." },
        { status: 500 },
      );
    }
    shipmentId = created.id;

    if (parcelIds.length > 0) {
      await auth.db.from("shipment_parcels").upsert(
        parcelIds.map((parcelId) => ({
          shipment_id: shipmentId!,
          parcel_id: parcelId,
        })),
        { onConflict: "shipment_id,parcel_id" },
      );
    }
  }

  await auth.db
    .from("shipping_quotes")
    .update({ status: "selected" })
    .eq("id", quote.id);

  await auth.db
    .from("consolidation_requests")
    .update({ status: "awaiting_payment" })
    .eq("id", id);

  // Pending payment row (idempotent by shipment)
  const { data: existingPayment } = await auth.db
    .from("payments")
    .select("id")
    .eq("shipment_id", shipmentId)
    .in("status", ["pending", "requires_action"])
    .maybeSingle();

  if (!existingPayment) {
    await auth.db.from("payments").insert({
      profile_id: auth.profile.id,
      shipment_id: shipmentId,
      quote_id: quote.id,
      amount: Number(price),
      currency: String(quote.currency || "INR"),
      status: "pending",
      provider: "stripe",
      description: `IndiRoute International Shipping - ${
        body.tier === "standard" ? "Standard" : "Economy"
      }`,
    });
  } else {
    await auth.db
      .from("payments")
      .update({
        amount: Number(price),
        quote_id: quote.id,
        description: `IndiRoute International Shipping - ${
          body.tier === "standard" ? "Standard" : "Economy"
        }`,
      })
      .eq("id", existingPayment.id);
  }

  return NextResponse.json({
    shipmentOrderId: shipmentId,
    amount: Number(price),
    currency: quote.currency || "INR",
    tier: body.tier,
  });
}
