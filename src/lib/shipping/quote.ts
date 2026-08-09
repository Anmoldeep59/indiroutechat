import type { SupabaseClient } from "@supabase/supabase-js";
import { SHIPPING_COUNTRIES } from "./countries";
import {
  DEFAULT_HANDLING_FEE_SLABS,
  DEFAULT_MARGIN_BRACKETS,
  DEFAULT_REPACKING_FEE_SLABS,
  DEFAULT_SERVICE_FEE_SLABS,
  DEFAULT_SHIPPING_SETTINGS,
} from "./defaults";
import {
  buildQuote,
  QuoteBuildError,
  toPublicQuote,
  type QuoteBuildContext,
} from "./quote-builder";
import {
  loadAramexBaseRates,
  loadEnabledCountryCodes,
  loadFeeSlabSets,
  loadMarginBrackets,
  loadShippingSettings,
} from "./settings";
import type { QuoteRequestInput, QuoteResult } from "./types";

export { QuoteBuildError, toPublicQuote };

function buildOfflineQuoteContext(): QuoteBuildContext {
  return {
    baseRates: [],
    settings: { ...DEFAULT_SHIPPING_SETTINGS },
    feeSlabs: {
      handling: DEFAULT_HANDLING_FEE_SLABS.map((s) => ({ ...s })),
      service: DEFAULT_SERVICE_FEE_SLABS.map((s) => ({ ...s })),
      repacking: DEFAULT_REPACKING_FEE_SLABS.map((s) => ({ ...s })),
    },
    marginBrackets: DEFAULT_MARGIN_BRACKETS.map((b) => ({ ...b })),
    enabledCountryCodes: new Set(SHIPPING_COUNTRIES.map((c) => c.code)),
  };
}

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
): Promise<QuoteResult & { adminOptions?: QuoteResult["options"] }> {
  const packingOverride =
    options?.packingFeeOverride ?? options?.indiRouteFeeOverride ?? null;

  if (!db) {
    console.warn(
      "[shipping/quote] Supabase admin unavailable — cannot load Aramex base rates.",
    );
    return buildQuote(
      input,
      {
        ...buildOfflineQuoteContext(),
        feeOverrides: { packingFeeOverride: packingOverride },
      },
      options,
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
