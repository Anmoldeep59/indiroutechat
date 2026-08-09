import { resolveBaseAramexRate } from "./base-rate";
import { resolveCountry } from "./countries";
import {
  DEFAULT_INDIROUTE_FEE_SLABS,
  DEFAULT_MARGIN_BRACKETS,
  DEFAULT_SHIPPING_SETTINGS,
} from "./defaults";
import { calculateCustomerPrice, PricingSafetyError } from "./pricing";
import type {
  AdminTierQuote,
  AramexBaseRateRow,
  CustomerTierQuote,
  MarginBracket,
  QuoteRequestInput,
  QuoteResult,
  SelectedSourceRate,
  ShippingSettings,
  WeightFeeSlab,
} from "./types";
import { calculateChargeableWeightKg } from "./weight";

export type QuoteBuildContext = {
  /** Admin-entered / future-API base Aramex rates */
  baseRates: AramexBaseRateRow[];
  settings?: ShippingSettings;
  feeSlabs?: WeightFeeSlab[];
  marginBrackets?: MarginBracket[];
  enabledCountryCodes?: Set<string> | string[];
  indiRouteFeeOverride?: number | null;
};

export type QuoteBuildErrorCode =
  | "unsupported_country"
  | "country_disabled"
  | "invalid_weight"
  | "invalid_dimensions"
  | "missing_rates"
  | "pricing_safety";

export class QuoteBuildError extends Error {
  code: QuoteBuildErrorCode;

  constructor(code: QuoteBuildErrorCode, message: string) {
    super(message);
    this.name = "QuoteBuildError";
    this.code = code;
  }
}

function toCustomerOption(
  tier: "economy" | "standard" | "express",
  chargeableWeightKg: number,
  selected: SelectedSourceRate | null,
  settings: ShippingSettings,
  feeSlabs: WeightFeeSlab[],
  marginBrackets: MarginBracket[],
  includeAdmin: boolean,
  indiRouteFeeOverride?: number | null,
): CustomerTierQuote | AdminTierQuote {
  if (tier === "express") {
    const express: CustomerTierQuote = {
      tier: "express",
      displayName: "IndiRoute Express",
      available: false,
      comingSoon: true,
      badge: "Coming Soon",
      priceInr: null,
      estimatedDelivery: null,
      chargeableWeightKg: null,
      currency: settings.currency,
    };
    if (!includeAdmin) return express;
    return { ...express, breakdown: null, source: null };
  }

  const displayName =
    tier === "economy" ? "IndiRoute Economy" : "IndiRoute Standard";
  const badge = tier === "economy" ? "Economy" : "Recommended";

  if (!selected) {
    const unavailable: CustomerTierQuote = {
      tier,
      displayName,
      available: false,
      badge,
      priceInr: null,
      estimatedDelivery: null,
      chargeableWeightKg,
      currency: settings.currency,
    };
    if (!includeAdmin) return unavailable;
    return { ...unavailable, breakdown: null, source: null };
  }

  try {
    const breakdown = calculateCustomerPrice(
      selected.baseAramexRate,
      chargeableWeightKg,
      settings,
      feeSlabs,
      marginBrackets,
      indiRouteFeeOverride,
    );

    const base: CustomerTierQuote = {
      tier,
      displayName,
      available: true,
      badge,
      priceInr: breakdown.finalPrice,
      estimatedDelivery: selected.sourceSla,
      chargeableWeightKg,
      currency: breakdown.currency,
    };

    if (!includeAdmin) return base;
    return { ...base, breakdown, source: selected };
  } catch (error) {
    if (error instanceof PricingSafetyError) {
      throw new QuoteBuildError("pricing_safety", error.message);
    }
    throw error;
  }
}

export async function buildQuote(
  input: QuoteRequestInput,
  context: QuoteBuildContext,
  options?: { includeAdminDetails?: boolean },
): Promise<QuoteResult & { adminOptions?: AdminTierQuote[] }> {
  const includeAdmin = options?.includeAdminDetails === true;
  const settings = context.settings ?? DEFAULT_SHIPPING_SETTINGS;
  const feeSlabs = context.feeSlabs ?? DEFAULT_INDIROUTE_FEE_SLABS;
  const marginBrackets = context.marginBrackets ?? DEFAULT_MARGIN_BRACKETS;

  const country = resolveCountry(input.countryCode);
  if (!country) {
    throw new QuoteBuildError(
      "unsupported_country",
      "Shipping is not available to this country.",
    );
  }

  const enabled = context.enabledCountryCodes
    ? new Set(
        [...context.enabledCountryCodes].map((code) => code.toUpperCase()),
      )
    : null;

  if (enabled && !enabled.has(country.code)) {
    throw new QuoteBuildError(
      "country_disabled",
      "Shipping is not currently enabled for this country.",
    );
  }

  let weights;
  try {
    weights = calculateChargeableWeightKg(
      input.actualWeightKg,
      input.lengthCm,
      input.widthCm,
      input.heightCm,
      settings,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid shipment details.";
    if (message.toLowerCase().includes("weight")) {
      throw new QuoteBuildError("invalid_weight", message);
    }
    throw new QuoteBuildError("invalid_dimensions", message);
  }

  const countryRates = context.baseRates.filter(
    (row) => row.country_code.toUpperCase() === country.code && row.active,
  );

  if (countryRates.length === 0 && settings.base_rate_source === "admin_table") {
    throw new QuoteBuildError(
      "missing_rates",
      "No Aramex base rates are configured for this destination yet.",
    );
  }

  const lookupBase = {
    countryCode: country.code,
    countryName: country.name,
    chargeableWeightKg: weights.chargeableWeightKg,
  };

  const economySelected = settings.economy_enabled
    ? await resolveBaseAramexRate(
        { ...lookupBase, tier: "economy" },
        {
          source: settings.base_rate_source,
          adminRows: countryRates,
        },
      )
    : null;

  const standardSelected = settings.standard_enabled
    ? await resolveBaseAramexRate(
        { ...lookupBase, tier: "standard" },
        {
          source: settings.base_rate_source,
          adminRows: countryRates,
        },
      )
    : null;

  if (!economySelected && !standardSelected) {
    throw new QuoteBuildError(
      "missing_rates",
      "No Aramex base rate matches this chargeable weight for Economy or Standard.",
    );
  }

  const economy = toCustomerOption(
    "economy",
    weights.chargeableWeightKg,
    economySelected,
    settings,
    feeSlabs,
    marginBrackets,
    includeAdmin,
    context.indiRouteFeeOverride,
  );
  const standard = toCustomerOption(
    "standard",
    weights.chargeableWeightKg,
    standardSelected,
    settings,
    feeSlabs,
    marginBrackets,
    includeAdmin,
    context.indiRouteFeeOverride,
  );
  const express = toCustomerOption(
    "express",
    weights.chargeableWeightKg,
    null,
    settings,
    feeSlabs,
    marginBrackets,
    includeAdmin,
  );

  express.comingSoon = true;
  express.available = false;
  express.priceInr = null;
  express.estimatedDelivery = null;
  express.chargeableWeightKg = null;
  express.badge = "Coming Soon";

  const weightSlabKg =
    standardSelected?.weightSlabKg ?? economySelected?.weightSlabKg ?? null;

  const result: QuoteResult & { adminOptions?: AdminTierQuote[] } = {
    origin: "India",
    countryCode: country.code,
    countryName: country.name,
    city: input.city?.trim() || null,
    postcode: input.postcode?.trim() || null,
    pieces: Math.max(1, Math.floor(input.pieces ?? 1)),
    actualWeightKg: weights.actualWeightKg,
    volumetricWeightKg: Number(weights.volumetricWeightKg.toFixed(3)),
    chargeableWeightKg: Number(weights.chargeableWeightKg.toFixed(3)),
    weightSlabKg,
    options: [economy, standard, express],
  };

  if (includeAdmin) {
    result.adminOptions = [
      economy as AdminTierQuote,
      standard as AdminTierQuote,
      express as AdminTierQuote,
    ];
  }

  return result;
}

export function toPublicQuote(result: QuoteResult): QuoteResult {
  return {
    origin: result.origin,
    countryCode: result.countryCode,
    countryName: result.countryName,
    city: result.city,
    postcode: result.postcode,
    pieces: result.pieces,
    actualWeightKg: result.actualWeightKg,
    volumetricWeightKg: result.volumetricWeightKg,
    chargeableWeightKg: result.chargeableWeightKg,
    weightSlabKg: result.weightSlabKg,
    options: result.options.map((option) => ({
      tier: option.tier,
      displayName: option.displayName,
      available: option.available,
      comingSoon: option.comingSoon,
      badge: option.badge,
      priceInr: option.priceInr,
      estimatedDelivery: option.estimatedDelivery,
      chargeableWeightKg: option.chargeableWeightKg,
      currency: option.currency,
    })),
  };
}
