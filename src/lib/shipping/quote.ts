import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildQuote,
  QuoteBuildError,
  toPublicQuote,
  type QuoteBuildContext,
} from "./quote-builder";
import {
  loadActiveRatesForCountry,
  loadEnabledCountryCodes,
  loadPackingFeeSlabs,
  loadServiceMap,
  loadShippingSettings,
} from "./settings";
import type { QuoteRequestInput, QuoteResult } from "./types";

export { QuoteBuildError, toPublicQuote };

export async function createShippingQuote(
  db: SupabaseClient,
  input: QuoteRequestInput,
  options?: { includeAdminDetails?: boolean },
): Promise<QuoteResult & { adminOptions?: QuoteResult["options"] }> {
  const countryCode = input.countryCode.trim().toUpperCase();

  const [settings, packingSlabs, enabledCountries, serviceMap, rates] =
    await Promise.all([
      loadShippingSettings(db),
      loadPackingFeeSlabs(db),
      loadEnabledCountryCodes(db),
      loadServiceMap(db, countryCode),
      loadActiveRatesForCountry(db, countryCode),
    ]);

  const context: QuoteBuildContext = {
    rates,
    settings,
    packingSlabs,
    serviceMap,
    enabledCountryCodes: enabledCountries,
  };

  return buildQuote(input, context, options);
}

export function parseQuoteRequestBody(body: unknown): QuoteRequestInput {
  if (!body || typeof body !== "object") {
    throw new QuoteBuildError("invalid_weight", "Invalid request body.");
  }

  const data = body as Record<string, unknown>;
  const countryCode = String(
    data.countryCode ?? data.destinationCountry ?? data.country ?? "",
  ).trim();

  const actualWeightKg = Number(data.actualWeightKg ?? data.weightKg ?? data.weight);
  const lengthCm = Number(data.lengthCm ?? data.length ?? 0);
  const widthCm = Number(data.widthCm ?? data.width ?? 0);
  const heightCm = Number(data.heightCm ?? data.height ?? 0);
  const pieces = Number(data.pieces ?? data.parcels ?? 1);

  return {
    countryCode,
    city: data.city == null ? undefined : String(data.city),
    postcode: data.postcode == null ? undefined : String(data.postcode),
    actualWeightKg,
    lengthCm,
    widthCm,
    heightCm,
    pieces: Number.isFinite(pieces) ? pieces : 1,
  };
}
