import type {
  MarginBracket,
  ShippingSettings,
  WeightFeeSlab,
} from "./types";

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  shipping_markup_percent: 0,
  handling_fee_inr: 0,
  service_fee_inr: 0,
  gst_rate: 0,
  volumetric_divisor: 5000,
  tax_mode: "gst_none",
  economy_enabled: true,
  standard_enabled: true,
  express_enabled: false,
  final_price_round_to_inr: 10,
  currency: "INR",
  quote_validity_hours: 24,
  aramex_fuel_surcharge_percent: 23.25,
  base_rate_source: "admin_table",
};

export const DEFAULT_MARGIN_BRACKETS: MarginBracket[] = [
  { min_amount_inr: 0, max_amount_inr: 1000, margin_percent: 15 },
  { min_amount_inr: 1001, max_amount_inr: 2500, margin_percent: 12 },
  { min_amount_inr: 2501, max_amount_inr: 5000, margin_percent: 10 },
  { min_amount_inr: 5000.01, max_amount_inr: null, margin_percent: 8 },
];

/** Combined IndiRoute processing fee by chargeable weight. */
export const DEFAULT_INDIROUTE_FEE_SLABS: WeightFeeSlab[] = [
  { min_kg: 0, max_kg: 0.5, fee_inr: 99 },
  { min_kg: 0.5, max_kg: 1, fee_inr: 129 },
  { min_kg: 1, max_kg: 2, fee_inr: 169 },
  { min_kg: 2, max_kg: 5, fee_inr: 249 },
  { min_kg: 5, max_kg: 10, fee_inr: 399 },
  { min_kg: 10, max_kg: 20, fee_inr: 599 },
  { min_kg: 20, max_kg: 30, fee_inr: 799 },
];

/** @deprecated Use DEFAULT_INDIROUTE_FEE_SLABS */
export const DEFAULT_PACKING_FEE_SLABS = DEFAULT_INDIROUTE_FEE_SLABS;
