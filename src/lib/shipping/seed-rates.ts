import { SHIPPING_COUNTRIES } from "./countries";
import { DEFAULT_SERVICE_MAP } from "./service-map";
import type { ShippingRateRow, SupportedCountryCode } from "./types";

/** Common ratecard weight slabs (kg). */
export const SEED_WEIGHT_SLABS = [
  0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.75, 1, 1.5, 2, 3, 5,
  7.5, 10, 15, 20,
] as const;

/**
 * Deterministic placeholder source rates until the real Ratecard[With-GST] is imported.
 * Values are intentionally above typical floors so markup tests remain meaningful.
 */
function baseForService(serviceId: number): number {
  const table: Record<number, number> = {
    384: 900,
    440: 980,
    381: 1400,
    140: 1550,
    262: 1700,
    242: 2100,
    35: 1800,
    241: 1950,
    240: 2000,
  };
  return table[serviceId] ?? 1600;
}

function countryFactor(code: string): number {
  const table: Record<string, number> = {
    AU: 1.0,
    US: 1.08,
    GB: 1.05,
    CA: 1.1,
    NZ: 1.02,
    AE: 0.92,
    DE: 1.06,
    MY: 0.88,
    IT: 1.07,
    FR: 1.07,
    JP: 1.12,
    CH: 1.15,
    SG: 0.9,
    SA: 0.95,
  };
  return table[code] ?? 1;
}

function buildPlanRates(safe: number) {
  // Keep all plan columns; safe_source_rate = MAX of them.
  const lite = Math.round(safe * 0.92);
  const basic = Math.round(safe * 0.95);
  const advanced = Math.round(safe * 0.97);
  const pro = Math.round(safe * 0.99);
  const enterprise = Math.round(safe);
  const diamond = Math.round(safe * 0.98);
  return { lite, basic, advanced, pro, enterprise, diamond, safe: enterprise };
}

export function generateSeedRates(): ShippingRateRow[] {
  const rows: ShippingRateRow[] = [];

  for (const country of SHIPPING_COUNTRIES) {
    const map = DEFAULT_SERVICE_MAP[country.code as SupportedCountryCode];
    const services = new Map<
      number,
      { name: string; sla: string; tier: "economy" | "standard" }
    >();

    for (const candidate of map.economy) {
      services.set(candidate.sourceServiceId, {
        name: candidate.sourceServiceName,
        sla: candidate.sourceSla,
        tier: "economy",
      });
    }
    for (const candidate of map.standard) {
      if (!services.has(candidate.sourceServiceId)) {
        services.set(candidate.sourceServiceId, {
          name: candidate.sourceServiceName,
          sla: candidate.sourceSla,
          tier: "standard",
        });
      }
    }

    for (const [serviceId, meta] of services) {
      for (const weight of SEED_WEIGHT_SLABS) {
        const raw =
          (baseForService(serviceId) + weight * 420) * countryFactor(country.code);
        const rounded = Math.ceil(raw);
        const plans = buildPlanRates(rounded);

        rows.push({
          country_code: country.code,
          country_name: country.name,
          weight_kg: weight,
          source_service_name: meta.name,
          source_service_id: serviceId,
          source_sla: meta.sla,
          lite_rate: plans.lite,
          basic_rate: plans.basic,
          advanced_rate: plans.advanced,
          pro_rate: plans.pro,
          enterprise_rate: plans.enterprise,
          diamond_rate: plans.diamond,
          safe_source_rate: plans.safe,
          customer_service_tier: meta.tier,
          active: true,
        });
      }
    }
  }

  return rows;
}
