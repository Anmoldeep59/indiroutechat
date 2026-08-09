import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth-server";
import { toPublicQuoteView } from "@/lib/consolidation-quote";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdminUser(_request);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  const { data: row, error } = await auth.db
    .from("consolidation_requests")
    .select(
      "*, profiles(id, first_name, last_name, email, phone), lockers(id, locker_code)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  const { data: links } = await auth.db
    .from("consolidation_request_parcels")
    .select(
      "parcel_id, parcels(*)",
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
      quote = {
        ...toPublicQuoteView(quoteRow as Record<string, unknown>),
        internal: {
          economySource: {
            id: quoteRow.economy_source_service_id,
            name: quoteRow.economy_source_service_name,
            rate: quoteRow.economy_source_rate,
            sla: quoteRow.economy_source_sla,
          },
          standardSource: {
            id: quoteRow.standard_source_service_id,
            name: quoteRow.standard_source_service_name,
            rate: quoteRow.standard_source_rate,
            sla: quoteRow.standard_source_sla,
          },
        },
      };
    }
  }

  return NextResponse.json({
    request: {
      ...row,
      parcels: (links ?? []).map((l) => l.parcels),
      quote,
    },
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminUser(request);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  let body: {
    action?: "mark_processing" | "save_measurements";
    finalWeightKg?: number;
    finalLengthCm?: number;
    finalWidthCm?: number;
    finalHeightCm?: number;
    finalPieces?: number;
    packingNotes?: string;
    packingFeeOverride?: number | null;
    destinationCountryCode?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { data: existing } = await auth.db
    .from("consolidation_requests")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  if (body.action === "mark_processing") {
    const { error } = await auth.db
      .from("consolidation_requests")
      .update({ status: "processing" })
      .eq("id", id);
    if (error) {
      return NextResponse.json(
        { error: "Unable to update request." },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true, status: "processing" });
  }

  if (body.action === "save_measurements") {
    const update = {
      final_weight_kg: Number(body.finalWeightKg),
      final_length_cm: Number(body.finalLengthCm),
      final_width_cm: Number(body.finalWidthCm),
      final_height_cm: Number(body.finalHeightCm),
      final_pieces: Math.max(1, Math.floor(Number(body.finalPieces ?? 1))),
      packing_notes: body.packingNotes?.trim() || null,
      packing_fee_override:
        body.packingFeeOverride == null
          ? null
          : Number(body.packingFeeOverride),
      status: existing.status === "requested" ? "processing" : existing.status,
    };

    if (
      !Number.isFinite(update.final_weight_kg) ||
      update.final_weight_kg <= 0 ||
      !Number.isFinite(update.final_length_cm) ||
      !Number.isFinite(update.final_width_cm) ||
      !Number.isFinite(update.final_height_cm)
    ) {
      return NextResponse.json(
        { error: "Enter valid final weight and dimensions." },
        { status: 400 },
      );
    }

    const { error } = await auth.db
      .from("consolidation_requests")
      .update(update)
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: "Unable to save measurements." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
