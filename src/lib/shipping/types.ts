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

export type PackingFeeSlab = {
  min_kg: number;
  max_kg: number | null;
  fee_inr: number;
};

export type ShippingSettings = {
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
  sourceServiceId: number;
  sourceServiceName: string;
  sourceSla: string;
  weightSlabKg: number;
  safeSourceRate: number;
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
  sourceRate: number;
  shippingCharge: number;
  handlingFee: number;
  serviceFee: number;
  packingFee: number;
  gst: number;
  feeSubtotal: number;
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
