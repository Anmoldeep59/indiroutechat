import type { SupabaseClient } from "@supabase/supabase-js";
import { SHIPPING_COUNTRIES } from "./countries";
import {
  DEFAULT_INDIROUTE_FEE_SLABS,
  DEFAULT_MARGIN_BRACKETS,
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
  loadIndiRouteFeeSlabs,
  loadMarginBrackets,
  loadShippingSettings,
} from "./settings";
import type { QuoteRequestInput, QuoteResult } from "./types";

export { QuoteBuildError, toPublicQuote };

function buildOfflineQuoteContext(): QuoteBuildContext {
  return {
    // Never invent base rates offline — admin must enter them.
    baseRates: [],
    settings: { ...DEFAULT_SHIPPING_SETTINGS },
    feeSlabs: DEFAULT_INDIROUTE_FEE_SLABS.map((slab) => ({ ...slab })),
    marginBrackets: DEFAULT_MARGIN_BRACKETS.map((b) => ({ ...b })),
    enabledCountryCodes: new Set(SHIPPING_COUNTRIES.map((c) => c.code)),
  };
}

/**
 * Authoritative quote using Aramex-style pricing.
 * BaseAramexRate comes from admin table (or future API), never the browser.
 */
export async function createShippingQuote(
  db: SupabaseClient | null,
  input: QuoteRequestInput,
  options?: {
    includeAdminDetails?: boolean;
    indiRouteFeeOverride?: number | null;
  },
): Promise<QuoteResult & { adminOptions?: QuoteResult["options"] }> {
  const countryCode = input.countryCode.trim().toUpperCase();

  if (!db) {
    console.warn(
      "[shipping/quote] Supabase admin unavailable — cannot load Aramex base rates.",
    );
    return buildQuote(
      input,
      {
        ...buildOfflineQuoteContext(),
        indiRouteFeeOverride: options?.indiRouteFeeOverride,
      },
      options,
    );
  }

  try {
    const [settings, feeSlabs, marginBrackets, enabledCountries, baseRates] =
      await Promise.all([
        loadShippingSettings(db),
        loadIndiRouteFeeSlabs(db),
        loadMarginBrackets(db),
        loadEnabledCountryCodes(db),
        loadAramexBaseRates(db, countryCode),
      ]);

    const context: QuoteBuildContext = {
      baseRates,
      settings,
      feeSlabs,
      marginBrackets,
      enabledCountryCodes: enabledCountries,
      indiRouteFeeOverride: options?.indiRouteFeeOverride,
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
