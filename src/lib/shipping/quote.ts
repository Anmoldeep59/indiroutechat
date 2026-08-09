import type { SupabaseClient } from "@supabase/supabase-js";
import { SHIPPING_COUNTRIES } from "./countries";
import { DEFAULT_PACKING_FEE_SLABS, DEFAULT_SHIPPING_SETTINGS } from "./defaults";
import {
  buildQuote,
  QuoteBuildError,
  toPublicQuote,
  type QuoteBuildContext,
} from "./quote-builder";
import { generateSeedRates } from "./seed-rates";
import { getDefaultServiceMap } from "./service-map";
import {
  loadActiveRatesForCountry,
  loadEnabledCountryCodes,
  loadPackingFeeSlabs,
  loadServiceMap,
  loadShippingSettings,
} from "./settings";
import type { QuoteRequestInput, QuoteResult } from "./types";

export { QuoteBuildError, toPublicQuote };

function buildOfflineQuoteContext(countryCode: string): QuoteBuildContext {
  const code = countryCode.trim().toUpperCase();
  return {
    rates: generateSeedRates().filter(
      (row) => row.country_code.toUpperCase() === code,
    ),
    settings: { ...DEFAULT_SHIPPING_SETTINGS },
    packingSlabs: DEFAULT_PACKING_FEE_SLABS.map((slab) => ({ ...slab })),
    serviceMap: getDefaultServiceMap(code),
    enabledCountryCodes: new Set(SHIPPING_COUNTRIES.map((c) => c.code)),
  };
}

/**
 * Authoritative quote. Uses Supabase when configured; otherwise falls back to
 * in-memory seed rates so the public calculator still works during setup.
 */
export async function createShippingQuote(
  db: SupabaseClient | null,
  input: QuoteRequestInput,
  options?: { includeAdminDetails?: boolean },
): Promise<QuoteResult & { adminOptions?: QuoteResult["options"] }> {
  const countryCode = input.countryCode.trim().toUpperCase();

  if (!db) {
    console.warn(
      "[shipping/quote] Supabase admin unavailable — using in-memory seed rates.",
    );
    return buildQuote(input, buildOfflineQuoteContext(countryCode), options);
  }

  try {
    const [settings, packingSlabs, enabledCountries, serviceMap, rates] =
      await Promise.all([
        loadShippingSettings(db),
        loadPackingFeeSlabs(db),
        loadEnabledCountryCodes(db),
        loadServiceMap(db, countryCode),
        loadActiveRatesForCountry(db, countryCode),
      ]);

    // If migration/rates are not loaded yet, fall back to seed data.
    if (rates.length === 0) {
      console.warn(
        `[shipping/quote] No DB rates for ${countryCode} — using in-memory seed rates.`,
      );
      return buildQuote(input, buildOfflineQuoteContext(countryCode), options);
    }

    const context: QuoteBuildContext = {
      rates,
      settings,
      packingSlabs,
      serviceMap,
      enabledCountryCodes: enabledCountries,
    };

    return buildQuote(input, context, options);
  } catch (error) {
    console.error(
      "[shipping/quote] DB quote failed — falling back to seed rates.",
      error,
    );
    return buildQuote(input, buildOfflineQuoteContext(countryCode), options);
  }
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
