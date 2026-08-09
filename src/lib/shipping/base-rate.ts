import type { SupabaseClient } from "@supabase/supabase-js";
import { getDefaultServiceMap } from "./service-map";
import type {
  AramexBaseRateRow,
  BaseRateSource,
  CustomerServiceTier,
  SelectedSourceRate,
} from "./types";

export type BaseRateLookupInput = {
  countryCode: string;
  countryName: string;
  tier: CustomerServiceTier;
  chargeableWeightKg: number;
};

/**
 * Future Aramex API adapter hook.
 * When credentials exist and base_rate_source = aramex_api, swap implementation here
 * without rewriting the pricing engine.
 */
export async function fetchLiveAramexBaseRate(
  input: BaseRateLookupInput,
): Promise<AramexBaseRateRow | null> {
  void input;
  // Placeholder until Aramex API credentials are configured.
  return null;
}

export function findAdminBaseRateRow(
  rows: AramexBaseRateRow[],
  input: BaseRateLookupInput,
): AramexBaseRateRow | null {
  const code = input.countryCode.toUpperCase();
  const matching = rows
    .filter(
      (row) =>
        row.active &&
        row.country_code.toUpperCase() === code &&
        row.service_tier === input.tier,
    )
    .sort((a, b) => a.min_weight_kg - b.min_weight_kg);

  for (let i = 0; i < matching.length; i += 1) {
    const row = matching[i];
    const isFirst = i === 0;
    const minOk = isFirst
      ? input.chargeableWeightKg >= row.min_weight_kg
      : input.chargeableWeightKg > row.min_weight_kg;
    const maxOk =
      row.max_weight_kg == null
        ? true
        : input.chargeableWeightKg <= row.max_weight_kg;

    if (minOk && maxOk && Number(row.base_aramex_rate) > 0) {
      return row;
    }
  }

  return null;
}

export function toSelectedFromBaseRate(
  row: AramexBaseRateRow,
  tier: CustomerServiceTier,
): SelectedSourceRate {
  const map = getDefaultServiceMap(row.country_code);
  const candidates = map?.[tier] ?? [];
  const preferred =
    candidates.find((c) => c.role === "preferred") ?? candidates[0] ?? null;

  // SLA comes from existing IndiRoute service-map configuration — never from Aramex rate rows.
  const sourceSla =
    preferred?.sourceSla ||
    (tier === "economy" ? "Up to 20 Business Days" : "10–15 Business Days");

  return {
    countryCode: row.country_code.toUpperCase(),
    countryName: row.country_name,
    customerTier: tier,
    sourceServiceId: preferred?.sourceServiceId ?? 0,
    sourceServiceName: preferred?.sourceServiceName ?? "Aramex base (admin)",
    sourceSla,
    weightSlabKg: row.max_weight_kg ?? row.min_weight_kg,
    safeSourceRate: Number(row.base_aramex_rate),
    baseAramexRate: Number(row.base_aramex_rate),
    minWeightKg: Number(row.min_weight_kg),
    maxWeightKg:
      row.max_weight_kg == null ? null : Number(row.max_weight_kg),
    planRates: {
      lite: null,
      basic: null,
      advanced: null,
      pro: null,
      enterprise: Number(row.base_aramex_rate),
      diamond: null,
    },
  };
}

export async function resolveBaseAramexRate(
  input: BaseRateLookupInput,
  options: {
    source: BaseRateSource;
    adminRows: AramexBaseRateRow[];
  },
): Promise<SelectedSourceRate | null> {
  if (options.source === "aramex_api") {
    const live = await fetchLiveAramexBaseRate(input);
    if (live) {
      return toSelectedFromBaseRate(live, input.tier);
    }
    // Fall back to admin table until API is live.
  }

  const row = findAdminBaseRateRow(options.adminRows, input);
  if (!row) return null;
  return toSelectedFromBaseRate(row, input.tier);
}

export async function loadAramexBaseRates(
  db: SupabaseClient,
  countryCode?: string,
): Promise<AramexBaseRateRow[]> {
  let query = db
    .from("aramex_base_rates")
    .select(
      "id, country_code, country_name, service_tier, min_weight_kg, max_weight_kg, base_aramex_rate, currency, source_sla, active",
    )
    .eq("active", true);

  if (countryCode) {
    query = query.eq("country_code", countryCode.toUpperCase());
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id as string,
    country_code: String(row.country_code),
    country_name: String(row.country_name),
    service_tier: row.service_tier as CustomerServiceTier,
    min_weight_kg: Number(row.min_weight_kg),
    max_weight_kg:
      row.max_weight_kg == null ? null : Number(row.max_weight_kg),
    base_aramex_rate: Number(row.base_aramex_rate),
    currency: String(row.currency || "INR"),
    source_sla: row.source_sla == null ? null : String(row.source_sla),
    active: Boolean(row.active),
  }));
}
