import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth-server";
import {
  generateQuoteForRequest,
  toPublicQuoteView,
} from "@/lib/consolidation-quote";
import { createNotification } from "@/lib/notifications";
import { QuoteBuildError } from "@/lib/shipping/quote";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAdminUser(request);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  let body: {
    destinationCountryCode?: string;
    finalWeightKg?: number;
    finalLengthCm?: number;
    finalWidthCm?: number;
    finalHeightCm?: number;
    finalPieces?: number;
    packingNotes?: string;
    packingFeeOverride?: number | null;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { data: row, error } = await auth.db
    .from("consolidation_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  const finalWeightKg = Number(body.finalWeightKg ?? row.final_weight_kg);
  const finalLengthCm = Number(body.finalLengthCm ?? row.final_length_cm);
  const finalWidthCm = Number(body.finalWidthCm ?? row.final_width_cm);
  const finalHeightCm = Number(body.finalHeightCm ?? row.final_height_cm);
  const finalPieces = Math.max(
    1,
    Math.floor(Number(body.finalPieces ?? row.final_pieces ?? 1)),
  );
  const destinationCountryCode = String(
    body.destinationCountryCode ?? "AU",
  ).toUpperCase();

  if (
    !Number.isFinite(finalWeightKg) ||
    finalWeightKg <= 0 ||
    !Number.isFinite(finalLengthCm) ||
    !Number.isFinite(finalWidthCm) ||
    !Number.isFinite(finalHeightCm)
  ) {
    return NextResponse.json(
      { error: "Final packed weight and dimensions are required." },
      { status: 400 },
    );
  }

  if (body.packingNotes != null) {
    await auth.db
      .from("consolidation_requests")
      .update({ packing_notes: body.packingNotes.trim() || null })
      .eq("id", id);
  }

  try {
    const quote = await generateQuoteForRequest(auth.db, {
      requestId: id,
      profileId: row.profile_id,
      destinationCountryCode,
      finalWeightKg,
      finalLengthCm,
      finalWidthCm,
      finalHeightCm,
      finalPieces,
      packingFeeOverride: body.packingFeeOverride,
    });

    await createNotification(auth.db, {
      profileId: row.profile_id,
      title: "Your shipping quote is ready",
      body: "Open your consolidation request to view IndiRoute Economy and Standard rates.",
      type: "quote_ready",
    });

    await auth.db.from("audit_logs").insert({
      actor_profile_id: auth.profile.id,
      action: "quote.generated",
      entity_type: "shipping_quote",
      entity_id: quote.id,
      metadata: {
        consolidation_request_id: id,
        destination_country_code: destinationCountryCode,
      },
    });

    return NextResponse.json({
      quote: {
        ...toPublicQuoteView(quote as Record<string, unknown>),
        internal: {
          economySource: {
            id: quote.economy_source_service_id,
            name: quote.economy_source_service_name,
            rate: quote.economy_source_rate,
          },
          standardSource: {
            id: quote.standard_source_service_id,
            name: quote.standard_source_service_name,
            rate: quote.standard_source_rate,
          },
        },
      },
    });
  } catch (err) {
    console.error("[generate-quote]", err);
    if (err instanceof QuoteBuildError) {
      const status =
        err.code === "pricing_safety"
          ? 500
          : err.code === "missing_rates"
            ? 404
            : 400;
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status },
      );
    }
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Unable to generate shipping quote.",
      },
      { status: 500 },
    );
  }
}
