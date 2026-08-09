import type { SupabaseClient } from "@supabase/supabase-js";
import { createShippingQuote } from "@/lib/shipping/quote";
import { loadShippingSettings } from "@/lib/shipping/settings";
import type { AdminTierQuote } from "@/lib/shipping/types";

export async function generateQuoteForRequest(
  db: SupabaseClient,
  input: {
    requestId: string;
    profileId: string;
    destinationCountryCode: string;
    finalWeightKg: number;
    finalLengthCm: number;
    finalWidthCm: number;
    finalHeightCm: number;
    finalPieces: number;
    packingFeeOverride?: number | null;
  },
) {
  const settings = await loadShippingSettings(db);
  const hours = Number(settings.quote_validity_hours || 24);

  const quoteResult = await createShippingQuote(
    db,
    {
      countryCode: input.destinationCountryCode,
      actualWeightKg: input.finalWeightKg,
      lengthCm: input.finalLengthCm,
      widthCm: input.finalWidthCm,
      heightCm: input.finalHeightCm,
      pieces: input.finalPieces,
    },
    { includeAdminDetails: true },
  );

  const adminOptions = (quoteResult.adminOptions ?? []) as AdminTierQuote[];
  const economy = adminOptions.find((o) => o.tier === "economy") ?? null;
  const standard = adminOptions.find((o) => o.tier === "standard") ?? null;

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + (Number.isFinite(hours) ? hours : 24));

  const insertRow = {
    profile_id: input.profileId,
    consolidation_request_id: input.requestId,
    final_weight_kg: input.finalWeightKg,
    final_length_cm: input.finalLengthCm,
    final_width_cm: input.finalWidthCm,
    final_height_cm: input.finalHeightCm,
    final_pieces: input.finalPieces,
    chargeable_weight_kg: quoteResult.chargeableWeightKg,
    destination_country_code: quoteResult.countryCode,
    currency: "INR",
    economy_price: economy?.priceInr ?? null,
    economy_eta: economy?.estimatedDelivery ?? null,
    economy_available: Boolean(economy?.available),
    economy_source_service_id: economy?.source?.sourceServiceId ?? null,
    economy_source_service_name: economy?.source?.sourceServiceName ?? null,
    economy_source_sla: economy?.source?.sourceSla ?? null,
    economy_source_rate: economy?.source?.safeSourceRate ?? null,
    standard_price: standard?.priceInr ?? null,
    standard_eta: standard?.estimatedDelivery ?? null,
    standard_available: Boolean(standard?.available),
    standard_source_service_id: standard?.source?.sourceServiceId ?? null,
    standard_source_service_name: standard?.source?.sourceServiceName ?? null,
    standard_source_sla: standard?.source?.sourceSla ?? null,
    standard_source_rate: standard?.source?.safeSourceRate ?? null,
    packing_fee_inr:
      input.packingFeeOverride ??
      economy?.breakdown?.packingFee ??
      standard?.breakdown?.packingFee ??
      null,
    quote_payload: {
      public: {
        chargeableWeightKg: quoteResult.chargeableWeightKg,
        volumetricWeightKg: quoteResult.volumetricWeightKg,
        countryCode: quoteResult.countryCode,
        countryName: quoteResult.countryName,
      },
      admin: {
        economy: economy
          ? {
              source: economy.source,
              breakdown: economy.breakdown,
            }
          : null,
        standard: standard
          ? {
              source: standard.source,
              breakdown: standard.breakdown,
            }
          : null,
      },
    },
    status: "quoted",
    expires_at: expiresAt.toISOString(),
  };

  const { data: quote, error } = await db
    .from("shipping_quotes")
    .insert(insertRow)
    .select("*")
    .single();

  if (error || !quote) {
    throw new Error(error?.message || "Unable to save shipping quote.");
  }

  await db
    .from("consolidation_requests")
    .update({
      status: "quoted",
      active_quote_id: quote.id,
      final_weight_kg: input.finalWeightKg,
      final_length_cm: input.finalLengthCm,
      final_width_cm: input.finalWidthCm,
      final_height_cm: input.finalHeightCm,
      final_pieces: input.finalPieces,
      packing_fee_override: input.packingFeeOverride ?? null,
    })
    .eq("id", input.requestId);

  // Expire prior open quotes for this request
  await db
    .from("shipping_quotes")
    .update({ status: "expired" })
    .eq("consolidation_request_id", input.requestId)
    .neq("id", quote.id)
    .eq("status", "quoted");

  return quote;
}

export function isQuoteExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() <= Date.now();
}

export function toPublicQuoteView(quote: Record<string, unknown>) {
  return {
    id: quote.id,
    status: quote.status,
    expiresAt: quote.expires_at,
    expired: isQuoteExpired(String(quote.expires_at ?? "")),
    finalWeightKg: Number(quote.final_weight_kg),
    finalLengthCm: Number(quote.final_length_cm),
    finalWidthCm: Number(quote.final_width_cm),
    finalHeightCm: Number(quote.final_height_cm),
    finalPieces: Number(quote.final_pieces ?? 1),
    chargeableWeightKg: Number(quote.chargeable_weight_kg),
    destinationCountryCode: quote.destination_country_code,
    currency: quote.currency ?? "INR",
    options: [
      {
        tier: "economy" as const,
        displayName: "IndiRoute Economy",
        available: Boolean(quote.economy_available),
        priceInr: quote.economy_price == null ? null : Number(quote.economy_price),
        estimatedDelivery: (quote.economy_eta as string | null) ?? null,
        badge: "Economy" as const,
      },
      {
        tier: "standard" as const,
        displayName: "IndiRoute Standard",
        available: Boolean(quote.standard_available),
        priceInr:
          quote.standard_price == null ? null : Number(quote.standard_price),
        estimatedDelivery: (quote.standard_eta as string | null) ?? null,
        badge: "Recommended" as const,
      },
      {
        tier: "express" as const,
        displayName: "IndiRoute Express",
        available: false,
        comingSoon: true,
        priceInr: null,
        estimatedDelivery: null,
        badge: "Coming Soon" as const,
      },
    ],
  };
}
