import type { SupabaseClient } from "@supabase/supabase-js";
import { loadAramexBaseRates } from "./base-rate";
import { SHIPPING_COUNTRIES } from "./countries";
import {
  DEFAULT_HANDLING_FEE_SLABS,
  DEFAULT_MARGIN_BRACKETS,
  DEFAULT_REPACKING_FEE_SLABS,
  DEFAULT_SERVICE_FEE_SLABS,
  DEFAULT_SHIPPING_SETTINGS,
} from "./defaults";
import type { FeeSlabSets } from "./pricing";
import { getDefaultServiceMap } from "./service-map";
import type { CountryServiceMap } from "./service-map";
import type {
  MarginBracket,
  ServiceCandidate,
  ShippingRateRow,
  ShippingSettings,
  SupportedCountryCode,
  WeightFeeSlab,
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
  quote_validity_hours?: number;
  aramex_fuel_surcharge_percent?: number;
  base_rate_source?: ShippingSettings["base_rate_source"];
};

async function loadFeeSlabsFromTable(
  db: SupabaseClient,
  table: string,
  fallback: WeightFeeSlab[],
): Promise<WeightFeeSlab[]> {
  const { data, error } = await db
    .from(table)
    .select("min_kg, max_kg, fee_inr")
    .eq("active", true)
    .order("min_kg", { ascending: true });

  if (error || !data || data.length === 0) {
    return fallback.map((slab) => ({ ...slab }));
  }

  return data.map((row) => ({
    min_kg: Number(row.min_kg),
    max_kg: row.max_kg == null ? null : Number(row.max_kg),
    fee_inr: Number(row.fee_inr),
  }));
}

export async function loadShippingSettings(
  db: SupabaseClient,
): Promise<ShippingSettings> {
  const { data, error } = await db
    .from("shipping_settings")
    .select(
      "shipping_markup_percent, handling_fee_inr, service_fee_inr, gst_rate, volumetric_divisor, tax_mode, economy_enabled, standard_enabled, express_enabled, final_price_round_to_inr, currency, quote_validity_hours, aramex_fuel_surcharge_percent, base_rate_source",
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
    volumetric_divisor: Number(
      row.volumetric_divisor || DEFAULT_SHIPPING_SETTINGS.volumetric_divisor,
    ),
    tax_mode: row.tax_mode ?? DEFAULT_SHIPPING_SETTINGS.tax_mode,
    economy_enabled: Boolean(row.economy_enabled),
    standard_enabled: Boolean(row.standard_enabled),
    express_enabled: Boolean(row.express_enabled),
    final_price_round_to_inr: Number(row.final_price_round_to_inr),
    currency: row.currency || "INR",
    quote_validity_hours: Number(
      row.quote_validity_hours ?? DEFAULT_SHIPPING_SETTINGS.quote_validity_hours,
    ),
    aramex_fuel_surcharge_percent: Number(
      row.aramex_fuel_surcharge_percent ??
        DEFAULT_SHIPPING_SETTINGS.aramex_fuel_surcharge_percent,
    ),
    base_rate_source:
      row.base_rate_source === "aramex_api" ? "aramex_api" : "admin_table",
  };
}

export async function loadHandlingFeeSlabs(
  db: SupabaseClient,
): Promise<WeightFeeSlab[]> {
  return loadFeeSlabsFromTable(
    db,
    "shipping_handling_fee_slabs",
    DEFAULT_HANDLING_FEE_SLABS,
  );
}

export async function loadServiceFeeSlabs(
  db: SupabaseClient,
): Promise<WeightFeeSlab[]> {
  return loadFeeSlabsFromTable(
    db,
    "shipping_service_fee_slabs",
    DEFAULT_SERVICE_FEE_SLABS,
  );
}

export async function loadRepackingFeeSlabs(
  db: SupabaseClient,
): Promise<WeightFeeSlab[]> {
  const slabs = await loadFeeSlabsFromTable(
    db,
    "shipping_repacking_fee_slabs",
    [],
  );
  if (slabs.length > 0) return slabs;
  return loadPackingFeeSlabs(db);
}

export async function loadFeeSlabSets(db: SupabaseClient): Promise<FeeSlabSets> {
  const [handling, service, repacking] = await Promise.all([
    loadHandlingFeeSlabs(db),
    loadServiceFeeSlabs(db),
    loadRepackingFeeSlabs(db),
  ]);
  return { handling, service, repacking };
}

/** @deprecated Use loadRepackingFeeSlabs / loadFeeSlabSets */
export async function loadIndiRouteFeeSlabs(
  db: SupabaseClient,
): Promise<WeightFeeSlab[]> {
  return loadRepackingFeeSlabs(db);
}

export async function loadPackingFeeSlabs(
  db: SupabaseClient,
): Promise<WeightFeeSlab[]> {
  return loadFeeSlabsFromTable(
    db,
    "shipping_packing_fee_slabs",
    DEFAULT_REPACKING_FEE_SLABS,
  );
}

export async function loadMarginBrackets(
  db: SupabaseClient,
): Promise<MarginBracket[]> {
  const { data, error } = await db
    .from("shipping_margin_brackets")
    .select("min_amount_inr, max_amount_inr, margin_percent")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    return DEFAULT_MARGIN_BRACKETS.map((b) => ({ ...b }));
  }

  return data.map((row) => ({
    min_amount_inr: Number(row.min_amount_inr),
    max_amount_inr:
      row.max_amount_inr == null ? null : Number(row.max_amount_inr),
    margin_percent: Number(row.margin_percent),
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

export { loadAramexBaseRates };
