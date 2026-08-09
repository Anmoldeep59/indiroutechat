import { isIndiaPostService } from "./india-post";
import { computeSafeSourceRate } from "./money";
import type { CountryServiceMap } from "./service-map";
import type {
  CustomerServiceTier,
  SelectedSourceRate,
  ServiceCandidate,
  ShippingRateRow,
} from "./types";
import { selectWeightSlab } from "./weight";

function toSafeRate(row: ShippingRateRow): number | null {
  if (row.safe_source_rate != null && Number.isFinite(Number(row.safe_source_rate))) {
    return Number(row.safe_source_rate);
  }
  return computeSafeSourceRate(row);
}

function isUsableRate(row: ShippingRateRow): boolean {
  if (!row.active) return false;
  if (isIndiaPostService(row.source_service_id, row.source_service_name)) {
    return false;
  }
  const safe = toSafeRate(row);
  return safe != null && safe > 0;
}

function findSlabRow(
  rows: ShippingRateRow[],
  countryCode: string,
  serviceId: number,
  chargeableWeightKg: number,
): ShippingRateRow | null {
  const matching = rows.filter(
    (row) =>
      row.country_code.toUpperCase() === countryCode.toUpperCase() &&
      Number(row.source_service_id) === serviceId &&
      isUsableRate(row),
  );

  if (matching.length === 0) return null;

  const slab = selectWeightSlab(
    chargeableWeightKg,
    matching.map((row) => Number(row.weight_kg)),
  );
  if (slab == null) return null;

  return (
    matching.find((row) => Number(row.weight_kg) === slab) ??
    matching
      .filter((row) => Number(row.weight_kg) >= chargeableWeightKg)
      .sort((a, b) => Number(a.weight_kg) - Number(b.weight_kg))[0] ??
    null
  );
}

function rowToSelected(
  row: ShippingRateRow,
  candidate: ServiceCandidate,
  tier: CustomerServiceTier,
): SelectedSourceRate {
  const safe = toSafeRate(row);
  if (safe == null) {
    throw new Error("Selected rate is missing a safe source rate.");
  }

  return {
    countryCode: row.country_code.toUpperCase(),
    countryName: row.country_name,
    customerTier: tier,
    sourceServiceId: Number(row.source_service_id),
    sourceServiceName: row.source_service_name,
    sourceSla: candidate.sourceSla || row.source_sla || "Business Days TBA",
    weightSlabKg: Number(row.weight_kg),
    safeSourceRate: safe,
    planRates: {
      lite: row.lite_rate,
      basic: row.basic_rate,
      advanced: row.advanced_rate,
      pro: row.pro_rate,
      enterprise: row.enterprise_rate,
      diamond: row.diamond_rate,
    },
  };
}

function selectPreferredThenFallback(
  rows: ShippingRateRow[],
  countryCode: string,
  chargeableWeightKg: number,
  candidates: ServiceCandidate[],
  tier: CustomerServiceTier,
): SelectedSourceRate | null {
  const preferred = candidates.filter((c) => c.role === "preferred");
  const fallbacks = candidates.filter((c) => c.role === "fallback");
  const ordered = [...preferred, ...fallbacks];

  for (const candidate of ordered) {
    if (isIndiaPostService(candidate.sourceServiceId, candidate.sourceServiceName)) {
      continue;
    }
    const row = findSlabRow(
      rows,
      countryCode,
      candidate.sourceServiceId,
      chargeableWeightKg,
    );
    if (row) {
      return rowToSelected(row, candidate, tier);
    }
  }

  return null;
}

function selectCheapestCandidate(
  rows: ShippingRateRow[],
  countryCode: string,
  chargeableWeightKg: number,
  candidates: ServiceCandidate[],
  tier: CustomerServiceTier,
): SelectedSourceRate | null {
  const usable: SelectedSourceRate[] = [];

  for (const candidate of candidates) {
    if (isIndiaPostService(candidate.sourceServiceId, candidate.sourceServiceName)) {
      continue;
    }
    const row = findSlabRow(
      rows,
      countryCode,
      candidate.sourceServiceId,
      chargeableWeightKg,
    );
    if (row) {
      usable.push(rowToSelected(row, candidate, tier));
    }
  }

  if (usable.length === 0) return null;

  usable.sort((a, b) => {
    if (a.safeSourceRate !== b.safeSourceRate) {
      return a.safeSourceRate - b.safeSourceRate;
    }
    return a.sourceServiceId - b.sourceServiceId;
  });

  return usable[0] ?? null;
}

/**
 * GB Standard: prefer Aramex GPX (242); otherwise cheapest valid non-India-Post fallback.
 */
function selectUkStandard(
  rows: ShippingRateRow[],
  chargeableWeightKg: number,
  candidates: ServiceCandidate[],
): SelectedSourceRate | null {
  const preferred = candidates.find((c) => c.role === "preferred");
  if (preferred && !isIndiaPostService(preferred.sourceServiceId, preferred.sourceServiceName)) {
    const preferredRow = findSlabRow(
      rows,
      "GB",
      preferred.sourceServiceId,
      chargeableWeightKg,
    );
    if (preferredRow) {
      return rowToSelected(preferredRow, preferred, "standard");
    }
  }

  const fallbacks = candidates.filter((c) => c.role !== "preferred");
  return selectCheapestCandidate(
    rows,
    "GB",
    chargeableWeightKg,
    fallbacks,
    "standard",
  );
}

export function selectEconomyRate(
  rows: ShippingRateRow[],
  countryCode: string,
  chargeableWeightKg: number,
  serviceMap: CountryServiceMap,
): SelectedSourceRate | null {
  return selectPreferredThenFallback(
    rows,
    countryCode,
    chargeableWeightKg,
    serviceMap.economy,
    "economy",
  );
}

export function selectStandardRate(
  rows: ShippingRateRow[],
  countryCode: string,
  chargeableWeightKg: number,
  serviceMap: CountryServiceMap,
): SelectedSourceRate | null {
  const code = countryCode.toUpperCase();

  if (code === "GB") {
    return selectUkStandard(rows, chargeableWeightKg, serviceMap.standard);
  }

  const hasPreferredOnly =
    serviceMap.standard.some((c) => c.role === "preferred") &&
    !serviceMap.standard.some((c) => c.role === "candidate");

  if (hasPreferredOnly) {
    return selectPreferredThenFallback(
      rows,
      code,
      chargeableWeightKg,
      serviceMap.standard,
      "standard",
    );
  }

  // Mixed preferred+fallback (rare) or candidate sets: cheapest among available.
  const candidates = serviceMap.standard.filter(
    (c) => c.role === "candidate" || c.role === "preferred" || c.role === "fallback",
  );

  // If there is an explicit preferred among candidates (e.g. NZ/AE/CH/SA),
  // try preferred first, then cheapest remaining.
  const preferred = candidates.filter((c) => c.role === "preferred");
  const others = candidates.filter((c) => c.role !== "preferred");

  if (preferred.length > 0 && others.length === 0) {
    return selectPreferredThenFallback(
      rows,
      code,
      chargeableWeightKg,
      preferred,
      "standard",
    );
  }

  if (preferred.length > 0) {
    const preferredHit = selectPreferredThenFallback(
      rows,
      code,
      chargeableWeightKg,
      preferred,
      "standard",
    );
    if (preferredHit) return preferredHit;
    return selectCheapestCandidate(
      rows,
      code,
      chargeableWeightKg,
      others,
      "standard",
    );
  }

  return selectCheapestCandidate(
    rows,
    code,
    chargeableWeightKg,
    candidates,
    "standard",
  );
}

export function selectTierRate(
  rows: ShippingRateRow[],
  countryCode: string,
  chargeableWeightKg: number,
  tier: CustomerServiceTier,
  serviceMap: CountryServiceMap,
): SelectedSourceRate | null {
  if (tier === "economy") {
    return selectEconomyRate(rows, countryCode, chargeableWeightKg, serviceMap);
  }
  return selectStandardRate(rows, countryCode, chargeableWeightKg, serviceMap);
}
