import {
  DEFAULT_INDIROUTE_FEE_SLABS,
  DEFAULT_MARGIN_BRACKETS,
  DEFAULT_SHIPPING_SETTINGS,
} from "./defaults";
import { getIndiRouteFee } from "./packing";
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
  aramexLandedCost: number,
  brackets: MarginBracket[] = DEFAULT_MARGIN_BRACKETS,
): number {
  if (!Number.isFinite(aramexLandedCost) || aramexLandedCost < 0) {
    throw new Error("Invalid Aramex landed cost for margin selection.");
  }

  const ordered = [...brackets].sort(
    (a, b) => a.min_amount_inr - b.min_amount_inr,
  );

  for (const bracket of ordered) {
    const minOk = aramexLandedCost + Number.EPSILON >= bracket.min_amount_inr;
    const maxOk =
      bracket.max_amount_inr == null
        ? true
        : aramexLandedCost <= bracket.max_amount_inr + Number.EPSILON;
    if (minOk && maxOk) {
      return bracket.margin_percent;
    }
  }

  return ordered[ordered.length - 1]?.margin_percent ?? 0;
}

/**
 * Aramex-style IndiRoute selling price.
 * BaseAramexRate must come from admin table or future Aramex API — never the browser.
 */
export function calculateCustomerPrice(
  baseAramexRate: number,
  chargeableWeightKg: number,
  settings: ShippingSettings = DEFAULT_SHIPPING_SETTINGS,
  feeSlabs: WeightFeeSlab[] = DEFAULT_INDIROUTE_FEE_SLABS,
  marginBrackets: MarginBracket[] = DEFAULT_MARGIN_BRACKETS,
  indiRouteFeeOverride?: number | null,
): PricedQuoteBreakdown {
  if (!Number.isFinite(baseAramexRate) || baseAramexRate < 0) {
    throw new Error("Invalid BaseAramexRate.");
  }

  const fuelSurchargePercent = Number(settings.aramex_fuel_surcharge_percent);
  if (!Number.isFinite(fuelSurchargePercent) || fuelSurchargePercent < 0) {
    throw new Error("Invalid Aramex fuel surcharge percent.");
  }

  const fuelCharge = roundMoney(
    baseAramexRate * (fuelSurchargePercent / 100),
    2,
  );
  const aramexLandedCost = roundMoney(baseAramexRate + fuelCharge, 2);
  const marginPercent = selectMarginPercent(aramexLandedCost, marginBrackets);
  const shippingSellingPrice = roundMoney(
    aramexLandedCost * (1 + marginPercent / 100),
    2,
  );

  const indiRouteFee =
    indiRouteFeeOverride != null && Number.isFinite(indiRouteFeeOverride)
      ? Number(indiRouteFeeOverride)
      : getIndiRouteFee(chargeableWeightKg, feeSlabs);

  const preRoundTotal = roundMoney(shippingSellingPrice + indiRouteFee, 2);
  const finalPrice = roundUpToNearest(
    preRoundTotal,
    settings.final_price_round_to_inr,
  );

  const minimumAllowed = shippingSellingPrice;

  if (finalPrice + Number.EPSILON < minimumAllowed) {
    console.error("[shipping] finalPrice below shipping selling price", {
      baseAramexRate,
      shippingSellingPrice,
      finalPrice,
      preRoundTotal,
    });
    throw new PricingSafetyError(
      "Final customer price fell below ShippingSellingPrice floor.",
    );
  }

  if (finalPrice + Number.EPSILON < aramexLandedCost) {
    console.error("[shipping] finalPrice below Aramex landed cost", {
      aramexLandedCost,
      finalPrice,
    });
    throw new PricingSafetyError(
      "Final customer price fell below Aramex landed cost.",
    );
  }

  return {
    baseAramexRate,
    sourceRate: baseAramexRate,
    fuelSurchargePercent,
    fuelCharge,
    aramexLandedCost,
    marginPercent,
    shippingSellingPrice,
    indiRouteFee,
    packingFee: indiRouteFee,
    handlingFee: 0,
    serviceFee: 0,
    gst: 0,
    feeSubtotal: indiRouteFee,
    shippingCharge: shippingSellingPrice,
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
