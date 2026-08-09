import { DEFAULT_PACKING_FEE_SLABS, DEFAULT_SHIPPING_SETTINGS } from "./defaults";
import { getPackingFee } from "./packing";
import { roundUp, roundUpToNearest } from "./money";
import type {
  PackingFeeSlab,
  PricedQuoteBreakdown,
  ShippingSettings,
} from "./types";

export class PricingSafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PricingSafetyError";
  }
}

export function applyShippingMarkup(
  sourceRate: number,
  markupPercent: number,
): number {
  if (!Number.isFinite(sourceRate) || sourceRate < 0) {
    throw new Error("Invalid source rate.");
  }
  if (!Number.isFinite(markupPercent) || markupPercent < 0) {
    throw new Error("Invalid markup percent.");
  }

  const raw = sourceRate * (1 + markupPercent / 100);
  return roundUp(raw, 2);
}

export function calculateGst(
  taxableAmount: number,
  gstRate: number,
  taxMode: ShippingSettings["tax_mode"],
): number {
  if (taxMode === "gst_none") return 0;
  if (!Number.isFinite(taxableAmount) || taxableAmount < 0) {
    throw new Error("Invalid taxable amount.");
  }
  if (!Number.isFinite(gstRate) || gstRate < 0) {
    throw new Error("Invalid GST rate.");
  }
  return roundUp(taxableAmount * gstRate, 2);
}

/**
 * Authoritative IndiRoute selling price.
 * Never trust browser-supplied price fields.
 */
export function calculateCustomerPrice(
  sourceRate: number,
  chargeableWeightKg: number,
  settings: ShippingSettings = DEFAULT_SHIPPING_SETTINGS,
  packingSlabs: PackingFeeSlab[] = DEFAULT_PACKING_FEE_SLABS,
): PricedQuoteBreakdown {
  const shippingCharge = applyShippingMarkup(
    sourceRate,
    settings.shipping_markup_percent,
  );
  const minimumAllowed = roundUp(
    sourceRate * (1 + settings.shipping_markup_percent / 100),
    2,
  );

  if (shippingCharge + Number.EPSILON < minimumAllowed) {
    console.error("[shipping] shippingCharge below floor", {
      sourceRate,
      shippingCharge,
      minimumAllowed,
    });
    throw new PricingSafetyError(
      "Shipping charge fell below the required markup floor.",
    );
  }

  const handlingFee = settings.handling_fee_inr;
  const serviceFee = settings.service_fee_inr;
  const packingFee = getPackingFee(chargeableWeightKg, packingSlabs);
  const feeSubtotal = handlingFee + serviceFee + packingFee;

  let gstTaxable = 0;
  if (settings.tax_mode === "gst_on_indiroute_fees_only") {
    gstTaxable = feeSubtotal;
  } else if (settings.tax_mode === "gst_on_all") {
    gstTaxable = shippingCharge + feeSubtotal;
  }

  const gst = calculateGst(gstTaxable, settings.gst_rate, settings.tax_mode);
  const preRoundTotal =
    shippingCharge + handlingFee + serviceFee + packingFee + gst;
  const finalPrice = roundUpToNearest(
    preRoundTotal,
    settings.final_price_round_to_inr,
  );

  if (finalPrice + Number.EPSILON < minimumAllowed) {
    console.error("[shipping] finalPrice below sourceRate markup floor", {
      sourceRate,
      finalPrice,
      minimumAllowed,
      preRoundTotal,
    });
    throw new PricingSafetyError(
      "Final customer price fell below sourceRate × markup floor.",
    );
  }

  return {
    sourceRate,
    shippingCharge,
    handlingFee,
    serviceFee,
    packingFee,
    gst,
    feeSubtotal,
    preRoundTotal,
    finalPrice,
    currency: settings.currency,
    markupPercent: settings.shipping_markup_percent,
    gstRate: settings.gst_rate,
    minimumAllowed,
  };
}
