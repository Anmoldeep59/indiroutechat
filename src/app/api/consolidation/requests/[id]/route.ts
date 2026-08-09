import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth-server";
import {
  isQuoteExpired,
  toPublicQuoteView,
} from "@/lib/consolidation-quote";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireVerifiedUser(request);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  const { data: row, error } = await auth.db
    .from("consolidation_requests")
    .select(
      "id, status, customer_notes, packing_notes, created_at, updated_at, active_quote_id, final_weight_kg, final_length_cm, final_width_cm, final_height_cm, final_pieces, locker_id",
    )
    .eq("id", id)
    .eq("profile_id", auth.profile.id)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  const { data: links } = await auth.db
    .from("consolidation_request_parcels")
    .select(
      "parcel_id, parcels(id, reference_code, description, sender_name, carrier, inbound_tracking_number, weight_kg, status, received_at)",
    )
    .eq("consolidation_request_id", id);

  let quote = null;
  if (row.active_quote_id) {
    const { data: quoteRow } = await auth.db
      .from("shipping_quotes")
      .select("*")
      .eq("id", row.active_quote_id)
      .maybeSingle();

    if (quoteRow) {
      if (
        quoteRow.status === "quoted" &&
        isQuoteExpired(String(quoteRow.expires_at))
      ) {
        await auth.db
          .from("shipping_quotes")
          .update({ status: "expired" })
          .eq("id", quoteRow.id);
        quoteRow.status = "expired";
      }
      quote = toPublicQuoteView(quoteRow as Record<string, unknown>);
    }
  }

  const { data: shipment } = await auth.db
    .from("shipments")
    .select(
      "id, status, payment_status, selected_tier, shipping_cost, currency, delivery_full_name, delivery_country, created_at",
    )
    .eq("consolidation_request_id", id)
    .eq("profile_id", auth.profile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    request: {
      id: row.id,
      status: row.status,
      customerNotes: row.customer_notes,
      packingNotes: row.packing_notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      finalWeightKg: row.final_weight_kg,
      finalLengthCm: row.final_length_cm,
      finalWidthCm: row.final_width_cm,
      finalHeightCm: row.final_height_cm,
      finalPieces: row.final_pieces,
      parcels: (links ?? []).map((link) => link.parcels),
      quote,
      shipment,
    },
  });
}
