export type CustomerServiceTier = "economy" | "standard";

export type CustomerFacingService =
  | "IndiRoute Economy"
  | "IndiRoute Standard"
  | "IndiRoute Express";

export type SupportedCountryCode =
  | "AU"
  | "US"
  | "GB"
  | "CA"
  | "NZ"
  | "AE"
  | "DE"
  | "MY"
  | "IT"
  | "FR"
  | "JP"
  | "CH"
  | "SG"
  | "SA";

export type ServiceCandidateRole = "preferred" | "fallback" | "candidate";

export type ServiceCandidate = {
  sourceServiceId: number;
  sourceServiceName: string;
  sourceSla: string;
  role: ServiceCandidateRole;
};

/** Legacy ratecard row (kept for import/audit; not used for Aramex-style selling price). */
export type ShippingRateRow = {
  id?: string;
  country_code: string;
  country_name: string;
  weight_kg: number;
  source_service_name: string;
  source_service_id: number;
  source_sla: string | null;
  lite_rate: number | null;
  basic_rate: number | null;
  advanced_rate: number | null;
  pro_rate: number | null;
  enterprise_rate: number | null;
  diamond_rate: number | null;
  safe_source_rate: number;
  customer_service_tier: CustomerServiceTier | null;
  active: boolean;
};

export type AramexBaseRateRow = {
  id?: string;
  country_code: string;
  country_name: string;
  service_tier: CustomerServiceTier;
  min_weight_kg: number;
  max_weight_kg: number | null;
  base_aramex_rate: number;
  currency: string;
  source_sla: string | null;
  active: boolean;
};

export type WeightFeeSlab = {
  min_kg: number;
  max_kg: number | null;
  fee_inr: number;
};

/** @deprecated Use WeightFeeSlab / IndiRoute fee slabs */
export type PackingFeeSlab = WeightFeeSlab;

export type MarginBracket = {
  min_amount_inr: number;
  max_amount_inr: number | null;
  margin_percent: number;
};

export type BaseRateSource = "admin_table" | "aramex_api";

export type ShippingSettings = {
  /** Legacy field retained for DB compatibility; unused by Aramex-style formula. */
  shipping_markup_percent: number;
  handling_fee_inr: number;
  service_fee_inr: number;
  gst_rate: number;
  volumetric_divisor: number;
  tax_mode: "gst_on_indiroute_fees_only" | "gst_on_all" | "gst_none";
  economy_enabled: boolean;
  standard_enabled: boolean;
  express_enabled: boolean;
  final_price_round_to_inr: number;
  currency: string;
  quote_validity_hours: number;
  aramex_fuel_surcharge_percent: number;
  base_rate_source: BaseRateSource;
};

export type QuoteRequestInput = {
  countryCode: string;
  city?: string;
  postcode?: string;
  actualWeightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  pieces?: number;
};

export type SelectedSourceRate = {
  countryCode: string;
  countryName: string;
  customerTier: CustomerServiceTier;
  /** Internal label for audit (admin table / future API). */
  sourceServiceId: number;
  sourceServiceName: string;
  sourceSla: string;
  weightSlabKg: number;
  /** Base Aramex rate used for pricing (never shown to customers). */
  safeSourceRate: number;
  baseAramexRate: number;
  minWeightKg: number;
  maxWeightKg: number | null;
  planRates: {
    lite: number | null;
    basic: number | null;
    advanced: number | null;
    pro: number | null;
    enterprise: number | null;
    diamond: number | null;
  };
};

export type PricedQuoteBreakdown = {
  baseAramexRate: number;
  /** Alias of baseAramexRate for older callers */
  sourceRate: number;
  fuelSurchargePercent: number;
  fuelCharge: number;
  aramexLandedCost: number;
  marginPercent: number;
  shippingSellingPrice: number;
  indiRouteFee: number;
  /** @deprecated mapped to indiRouteFee for compatibility */
  packingFee: number;
  handlingFee: number;
  serviceFee: number;
  gst: number;
  feeSubtotal: number;
  shippingCharge: number;
  preRoundTotal: number;
  finalPrice: number;
  currency: string;
  markupPercent: number;
  gstRate: number;
  minimumAllowed: number;
};

export type CustomerTierQuote = {
  tier: CustomerServiceTier | "express";
  displayName: CustomerFacingService;
  available: boolean;
  comingSoon?: boolean;
  badge: "Economy" | "Recommended" | "Coming Soon" | null;
  priceInr: number | null;
  estimatedDelivery: string | null;
  chargeableWeightKg: number | null;
  currency: string;
};

export type AdminTierQuote = CustomerTierQuote & {
  breakdown: PricedQuoteBreakdown | null;
  source: SelectedSourceRate | null;
};

export type QuoteResult = {
  origin: "India";
  countryCode: string;
  countryName: string;
  city: string | null;
  postcode: string | null;
  pieces: number;
  actualWeightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  weightSlabKg: number | null;
  options: CustomerTierQuote[];
};
