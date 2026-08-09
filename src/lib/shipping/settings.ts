import type { SupabaseClient } from "@supabase/supabase-js";
import { SHIPPING_COUNTRIES } from "./countries";
import { DEFAULT_PACKING_FEE_SLABS, DEFAULT_SHIPPING_SETTINGS } from "./defaults";
import { getDefaultServiceMap } from "./service-map";
import type { CountryServiceMap } from "./service-map";
import type {
  PackingFeeSlab,
  ServiceCandidate,
  ShippingRateRow,
  ShippingSettings,
  SupportedCountryCode,
} from "./types";

type SettingsRow = {
  shipping_markup_percent: number;
  handling_fee_inr: number;
  service_fee_inr: number;
  gst_rate: number;
  volumetric_divisor: number;
  tax_mode: ShippingSettings["tax_mode"];
  economy_enabled: boolean;
  standard_enabled: boolean;
  express_enabled: boolean;
  final_price_round_to_inr: number;
  currency: string;
};

export async function loadShippingSettings(
  db: SupabaseClient,
): Promise<ShippingSettings> {
  const { data, error } = await db
    .from("shipping_settings")
    .select(
      "shipping_markup_percent, handling_fee_inr, service_fee_inr, gst_rate, volumetric_divisor, tax_mode, economy_enabled, standard_enabled, express_enabled, final_price_round_to_inr, currency",
    )
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return { ...DEFAULT_SHIPPING_SETTINGS };
  }

  const row = data as SettingsRow;
  return {
    shipping_markup_percent: Number(row.shipping_markup_percent),
    handling_fee_inr: Number(row.handling_fee_inr),
    service_fee_inr: Number(row.service_fee_inr),
    gst_rate: Number(row.gst_rate),
    volumetric_divisor: Number(row.volumetric_divisor),
    tax_mode: row.tax_mode ?? DEFAULT_SHIPPING_SETTINGS.tax_mode,
    economy_enabled: Boolean(row.economy_enabled),
    standard_enabled: Boolean(row.standard_enabled),
    express_enabled: Boolean(row.express_enabled),
    final_price_round_to_inr: Number(row.final_price_round_to_inr),
    currency: row.currency || "INR",
  };
}

export async function loadPackingFeeSlabs(
  db: SupabaseClient,
): Promise<PackingFeeSlab[]> {
  const { data, error } = await db
    .from("shipping_packing_fee_slabs")
    .select("min_kg, max_kg, fee_inr")
    .eq("active", true)
    .order("min_kg", { ascending: true });

  if (error || !data || data.length === 0) {
    return DEFAULT_PACKING_FEE_SLABS.map((slab) => ({ ...slab }));
  }

  return data.map((row) => ({
    min_kg: Number(row.min_kg),
    max_kg: row.max_kg == null ? null : Number(row.max_kg),
    fee_inr: Number(row.fee_inr),
  }));
}

export async function loadEnabledCountryCodes(
  db: SupabaseClient,
): Promise<Set<string>> {
  const { data, error } = await db
    .from("shipping_countries")
    .select("country_code")
    .eq("enabled", true);

  if (error || !data || data.length === 0) {
    return new Set(SHIPPING_COUNTRIES.map((c) => c.code));
  }

  return new Set(data.map((row) => String(row.country_code).toUpperCase()));
}

export async function loadServiceMap(
  db: SupabaseClient,
  countryCode: string,
): Promise<CountryServiceMap | null> {
  const code = countryCode.toUpperCase() as SupportedCountryCode;
  const fallback = getDefaultServiceMap(code);

  const { data, error } = await db
    .from("shipping_service_mappings")
    .select(
      "customer_tier, source_service_id, source_service_name, source_sla, role, sort_order, active",
    )
    .eq("country_code", code)
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    return fallback;
  }

  const economy: ServiceCandidate[] = [];
  const standard: ServiceCandidate[] = [];

  for (const row of data) {
    const candidate: ServiceCandidate = {
      sourceServiceId: Number(row.source_service_id),
      sourceServiceName: String(row.source_service_name),
      sourceSla: String(row.source_sla ?? ""),
      role: row.role as ServiceCandidate["role"],
    };
    if (row.customer_tier === "economy") economy.push(candidate);
    if (row.customer_tier === "standard") standard.push(candidate);
  }

  if (economy.length === 0 && standard.length === 0) {
    return fallback;
  }

  return {
    economy: economy.length > 0 ? economy : fallback?.economy ?? [],
    standard: standard.length > 0 ? standard : fallback?.standard ?? [],
  };
}

export async function loadActiveRatesForCountry(
  db: SupabaseClient,
  countryCode: string,
): Promise<ShippingRateRow[]> {
  const { data, error } = await db
    .from("shipping_rates")
    .select(
      "id, country_code, country_name, weight_kg, source_service_name, source_service_id, source_sla, lite_rate, basic_rate, advanced_rate, pro_rate, enterprise_rate, diamond_rate, safe_source_rate, customer_service_tier, active",
    )
    .eq("country_code", countryCode.toUpperCase())
    .eq("active", true);

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    country_code: String(row.country_code),
    country_name: String(row.country_name),
    weight_kg: Number(row.weight_kg),
    source_service_name: String(row.source_service_name),
    source_service_id: Number(row.source_service_id),
    source_sla: row.source_sla == null ? null : String(row.source_sla),
    lite_rate: row.lite_rate == null ? null : Number(row.lite_rate),
    basic_rate: row.basic_rate == null ? null : Number(row.basic_rate),
    advanced_rate: row.advanced_rate == null ? null : Number(row.advanced_rate),
    pro_rate: row.pro_rate == null ? null : Number(row.pro_rate),
    enterprise_rate:
      row.enterprise_rate == null ? null : Number(row.enterprise_rate),
    diamond_rate: row.diamond_rate == null ? null : Number(row.diamond_rate),
    safe_source_rate: Number(row.safe_source_rate),
    customer_service_tier:
      (row.customer_service_tier as ShippingRateRow["customer_service_tier"]) ??
      null,
    active: Boolean(row.active),
  }));
}
