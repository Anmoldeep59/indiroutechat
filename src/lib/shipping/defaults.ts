import type { PackingFeeSlab, ShippingSettings } from "./types";

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  shipping_markup_percent: 11,
  handling_fee_inr: 49,
  service_fee_inr: 79,
  gst_rate: 0.18,
  volumetric_divisor: 5000,
  tax_mode: "gst_on_indiroute_fees_only",
  economy_enabled: true,
  standard_enabled: true,
  express_enabled: false,
  final_price_round_to_inr: 10,
  currency: "INR",
  quote_validity_hours: 24,
};

export const DEFAULT_PACKING_FEE_SLABS: PackingFeeSlab[] = [
  { min_kg: 0, max_kg: 0.5, fee_inr: 49 },
  { min_kg: 0.5, max_kg: 1, fee_inr: 69 },
  { min_kg: 1, max_kg: 2, fee_inr: 99 },
  { min_kg: 2, max_kg: 5, fee_inr: 149 },
  { min_kg: 5, max_kg: 10, fee_inr: 249 },
  { min_kg: 10, max_kg: null, fee_inr: 349 },
];
