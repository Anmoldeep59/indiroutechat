import { resolveCountry } from "./countries";
import { DEFAULT_PACKING_FEE_SLABS, DEFAULT_SHIPPING_SETTINGS } from "./defaults";
import { calculateCustomerPrice, PricingSafetyError } from "./pricing";
import { getDefaultServiceMap, type CountryServiceMap } from "./service-map";
import { selectEconomyRate, selectStandardRate } from "./select-rate";
import type {
  AdminTierQuote,
  CustomerTierQuote,
  PackingFeeSlab,
  QuoteRequestInput,
  QuoteResult,
  SelectedSourceRate,
  ShippingRateRow,
  ShippingSettings,
} from "./types";
import { calculateChargeableWeightKg } from "./weight";

export type QuoteBuildContext = {
  rates: ShippingRateRow[];
  settings?: ShippingSettings;
  packingSlabs?: PackingFeeSlab[];
  serviceMap?: CountryServiceMap | null;
  enabledCountryCodes?: Set<string> | string[];
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
  packingSlabs: PackingFeeSlab[],
  includeAdmin: boolean,
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
      selected.safeSourceRate,
      chargeableWeightKg,
      settings,
      packingSlabs,
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

export function buildQuote(
  input: QuoteRequestInput,
  context: QuoteBuildContext,
  options?: { includeAdminDetails?: boolean },
): QuoteResult & { adminOptions?: AdminTierQuote[] } {
  const includeAdmin = options?.includeAdminDetails === true;
  const settings = context.settings ?? DEFAULT_SHIPPING_SETTINGS;
  const packingSlabs = context.packingSlabs ?? DEFAULT_PACKING_FEE_SLABS;

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

  const serviceMap =
    context.serviceMap ?? getDefaultServiceMap(country.code);

  if (!serviceMap) {
    throw new QuoteBuildError(
      "unsupported_country",
      "No service mapping exists for this country.",
    );
  }

  const countryRates = context.rates.filter(
    (row) => row.country_code.toUpperCase() === country.code && row.active,
  );

  if (countryRates.length === 0) {
    throw new QuoteBuildError(
      "missing_rates",
      "No shipping rates are configured for this destination yet.",
    );
  }

  const economySelected = settings.economy_enabled
    ? selectEconomyRate(
        countryRates,
        country.code,
        weights.chargeableWeightKg,
        serviceMap,
      )
    : null;

  const standardSelected = settings.standard_enabled
    ? selectStandardRate(
        countryRates,
        country.code,
        weights.chargeableWeightKg,
        serviceMap,
      )
    : null;

  const economy = toCustomerOption(
    "economy",
    weights.chargeableWeightKg,
    settings.economy_enabled ? economySelected : null,
    settings,
    packingSlabs,
    includeAdmin,
  );
  const standard = toCustomerOption(
    "standard",
    weights.chargeableWeightKg,
    settings.standard_enabled ? standardSelected : null,
    settings,
    packingSlabs,
    includeAdmin,
  );
  const express = toCustomerOption(
    "express",
    weights.chargeableWeightKg,
    null,
    settings,
    packingSlabs,
    includeAdmin,
  );

  // Express is always Coming Soon for now (no live rate).
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

/** Strip any supplier fields before sending to browsers. */
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
