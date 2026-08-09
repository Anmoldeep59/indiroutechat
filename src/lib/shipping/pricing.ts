import {
  DEFAULT_HANDLING_FEE_SLABS,
  DEFAULT_MARGIN_BRACKETS,
  DEFAULT_REPACKING_FEE_SLABS,
  DEFAULT_SERVICE_FEE_SLABS,
  DEFAULT_SHIPPING_SETTINGS,
} from "./defaults";
import {
  getHandlingFee,
  getRepackingFee,
  getServiceFee,
} from "./packing";
import { roundUpToNearest } from "./money";
import type {
  MarginBracket,
  PricedQuoteBreakdown,
  ShippingSettings,
  WeightFeeSlab,
} from "./types";

export class PricingSafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PricingSafetyError";
  }
}

/** Standard 2-decimal money (half-up). Final customer price uses round-up separately. */
function roundMoney(value: number, decimals = 2): number {
  if (!Number.isFinite(value)) {
    throw new Error("Cannot round a non-finite value.");
  }
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function selectMarginPercent(
  aramexTransportCost: number,
  brackets: MarginBracket[] = DEFAULT_MARGIN_BRACKETS,
): number {
  if (!Number.isFinite(aramexTransportCost) || aramexTransportCost < 0) {
    throw new Error("Invalid Aramex transport cost for margin selection.");
  }

  const ordered = [...brackets].sort(
    (a, b) => a.min_amount_inr - b.min_amount_inr,
  );

  for (const bracket of ordered) {
    const minOk = aramexTransportCost + Number.EPSILON >= bracket.min_amount_inr;
    const maxOk =
      bracket.max_amount_inr == null
        ? true
        : aramexTransportCost <= bracket.max_amount_inr + Number.EPSILON;
    if (minOk && maxOk) {
      return bracket.margin_percent;
    }
  }

  return ordered[ordered.length - 1]?.margin_percent ?? 0;
}

export type FeeSlabSets = {
  handling: WeightFeeSlab[];
  service: WeightFeeSlab[];
  repacking: WeightFeeSlab[];
};

export type FeeOverrides = {
  handlingFeeOverride?: number | null;
  serviceFeeOverride?: number | null;
  packingFeeOverride?: number | null;
  repackingFeeOverride?: number | null;
};

/**
 * Aramex transport + IndiRoute fees.
 * AramexBaseRate must come from admin table or future Aramex API — never the browser.
 */
export function calculateCustomerPrice(
  baseAramexRate: number,
  chargeableWeightKg: number,
  settings: ShippingSettings = DEFAULT_SHIPPING_SETTINGS,
  feeSlabs: FeeSlabSets = {
    handling: DEFAULT_HANDLING_FEE_SLABS,
    service: DEFAULT_SERVICE_FEE_SLABS,
    repacking: DEFAULT_REPACKING_FEE_SLABS,
  },
  marginBrackets: MarginBracket[] = DEFAULT_MARGIN_BRACKETS,
  overrides?: FeeOverrides,
): PricedQuoteBreakdown {
  if (!Number.isFinite(baseAramexRate) || baseAramexRate < 0) {
    throw new Error("Invalid AramexBaseRate.");
  }

  const fuelSurchargePercent = Number(settings.aramex_fuel_surcharge_percent);
  if (!Number.isFinite(fuelSurchargePercent) || fuelSurchargePercent < 0) {
    throw new Error("Invalid Aramex fuel surcharge percent.");
  }

  const aramexFuelSurcharge = roundMoney(
    baseAramexRate * (fuelSurchargePercent / 100),
    2,
  );
  const aramexTransportCost = roundMoney(
    baseAramexRate + aramexFuelSurcharge,
    2,
  );
  const marginPercent = selectMarginPercent(aramexTransportCost, marginBrackets);
  const indiRouteTransportPrice = roundMoney(
    aramexTransportCost * (1 + marginPercent / 100),
    2,
  );

  const handlingFee =
    overrides?.handlingFeeOverride != null &&
    Number.isFinite(overrides.handlingFeeOverride)
      ? Number(overrides.handlingFeeOverride)
      : getHandlingFee(chargeableWeightKg, feeSlabs.handling);

  const serviceFee =
    overrides?.serviceFeeOverride != null &&
    Number.isFinite(overrides.serviceFeeOverride)
      ? Number(overrides.serviceFeeOverride)
      : getServiceFee(chargeableWeightKg, feeSlabs.service);

  const packingOverride =
    overrides?.repackingFeeOverride ?? overrides?.packingFeeOverride;
  const packingFee =
    packingOverride != null && Number.isFinite(packingOverride)
      ? Number(packingOverride)
      : getRepackingFee(chargeableWeightKg, feeSlabs.repacking);

  const feeSubtotal = roundMoney(handlingFee + serviceFee + packingFee, 2);
  const preRoundTotal = roundMoney(indiRouteTransportPrice + feeSubtotal, 2);
  const finalPrice = roundUpToNearest(
    preRoundTotal,
    settings.final_price_round_to_inr,
  );

  const minimumAllowed = indiRouteTransportPrice;

  if (finalPrice + Number.EPSILON < minimumAllowed) {
    console.error("[shipping] finalPrice below IndiRoute transport price", {
      baseAramexRate,
      indiRouteTransportPrice,
      finalPrice,
      preRoundTotal,
    });
    throw new PricingSafetyError(
      "Final customer price fell below IndiRoute transport price floor.",
    );
  }

  if (finalPrice + Number.EPSILON < aramexTransportCost) {
    console.error("[shipping] finalPrice below Aramex transport cost", {
      aramexTransportCost,
      finalPrice,
    });
    throw new PricingSafetyError(
      "Final customer price fell below Aramex transport cost.",
    );
  }

  return {
    baseAramexRate,
    sourceRate: baseAramexRate,
    fuelSurchargePercent,
    fuelCharge: aramexFuelSurcharge,
    aramexFuelSurcharge,
    aramexLandedCost: aramexTransportCost,
    aramexTransportCost,
    marginPercent,
    shippingSellingPrice: indiRouteTransportPrice,
    indiRouteTransportPrice,
    handlingFee,
    serviceFee,
    packingFee,
    repackingFee: packingFee,
    indiRouteFee: feeSubtotal,
    gst: 0,
    feeSubtotal,
    shippingCharge: indiRouteTransportPrice,
    preRoundTotal,
    finalPrice,
    currency: settings.currency,
    markupPercent: marginPercent,
    gstRate: settings.gst_rate,
    minimumAllowed,
  };
}

/** @deprecated kept for callers that still import the old helper name */
export function applyShippingMarkup(
  sourceRate: number,
  markupPercent: number,
): number {
  return roundMoney(sourceRate * (1 + markupPercent / 100), 2);
}
