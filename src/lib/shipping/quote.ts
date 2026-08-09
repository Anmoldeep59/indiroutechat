import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildQuote,
  QuoteBuildError,
  toPublicQuote,
  type QuoteBuildContext,
} from "./quote-builder";
import { hasDatabaseUrl, loadQuoteContextFromPg } from "./pg-store";
import {
  loadAramexBaseRates,
  loadEnabledCountryCodes,
  loadFeeSlabSets,
  loadMarginBrackets,
  loadShippingSettings,
} from "./settings";
import type { AdminTierQuote, QuoteRequestInput, QuoteResult } from "./types";

export { QuoteBuildError, toPublicQuote };

/**
 * Authoritative quote using Aramex base transport rates.
 * Base rate comes from admin table (or future API), never the browser.
 * Economy/Standard SLAs come from existing service-map configuration.
 */
export async function createShippingQuote(
  db: SupabaseClient | null,
  input: QuoteRequestInput,
  options?: {
    includeAdminDetails?: boolean;
    packingFeeOverride?: number | null;
    indiRouteFeeOverride?: number | null;
  },
): Promise<QuoteResult & { adminOptions?: AdminTierQuote[] }> {
  const packingOverride =
    options?.packingFeeOverride ?? options?.indiRouteFeeOverride ?? null;

  // Prefer DATABASE_URL shipping store when configured (authoritative Aramex tables).
  if (hasDatabaseUrl()) {
    try {
      const context = await loadQuoteContextFromPg(input.countryCode);
      return buildQuote(
        input,
        {
          ...context,
          feeOverrides: { packingFeeOverride: packingOverride },
        },
        options,
      );
    } catch (error) {
      if (error instanceof QuoteBuildError) throw error;
      console.error("[shipping/quote] DATABASE_URL quote failed", error);
      // Fall through to Supabase admin client if available.
    }
  }

  if (!db) {
    console.warn(
      "[shipping/quote] Supabase admin unavailable and DATABASE_URL quote failed/missing.",
    );
    throw new QuoteBuildError(
      "missing_rates",
      "Shipping service is temporarily unavailable. Configure DATABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  try {
    const [settings, feeSlabs, marginBrackets, enabledCountries, baseRates] =
      await Promise.all([
        loadShippingSettings(db),
        loadFeeSlabSets(db),
        loadMarginBrackets(db),
        loadEnabledCountryCodes(db),
        loadAramexBaseRates(db, input.countryCode.trim().toUpperCase()),
      ]);

    const context: QuoteBuildContext = {
      baseRates,
      settings,
      feeSlabs,
      marginBrackets,
      enabledCountryCodes: enabledCountries,
      feeOverrides: { packingFeeOverride: packingOverride },
    };

    return buildQuote(input, context, options);
  } catch (error) {
    if (error instanceof QuoteBuildError) throw error;
    console.error("[shipping/quote] DB quote failed", error);
    throw error;
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

  const actualWeightKg = Number(
    data.actualWeightKg ?? data.weightKg ?? data.weight,
  );
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
