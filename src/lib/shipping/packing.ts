import {
  DEFAULT_HANDLING_FEE_SLABS,
  DEFAULT_REPACKING_FEE_SLABS,
  DEFAULT_SERVICE_FEE_SLABS,
} from "./defaults";
import type { WeightFeeSlab } from "./types";

/**
 * Weight slabs use exclusive lower bounds after the first slab:
 * 0–0.50, >0.50–1, >1–2, etc.
 */
export function getFeeFromSlabs(
  chargeableWeightKg: number,
  slabs: WeightFeeSlab[],
  label = "fee",
): number {
  if (!Number.isFinite(chargeableWeightKg) || chargeableWeightKg < 0) {
    throw new Error(`Invalid chargeable weight for ${label}.`);
  }

  const ordered = [...slabs].sort((a, b) => a.min_kg - b.min_kg);

  for (let i = 0; i < ordered.length; i += 1) {
    const slab = ordered[i];
    const isFirst = i === 0;
    const minOk = isFirst
      ? chargeableWeightKg >= slab.min_kg
      : chargeableWeightKg > slab.min_kg;
    const maxOk =
      slab.max_kg == null ? true : chargeableWeightKg <= slab.max_kg;

    if (minOk && maxOk) {
      return slab.fee_inr;
    }
  }

  return ordered[ordered.length - 1]?.fee_inr ?? 0;
}

export function getHandlingFee(
  chargeableWeightKg: number,
  slabs: WeightFeeSlab[] = DEFAULT_HANDLING_FEE_SLABS,
): number {
  return getFeeFromSlabs(chargeableWeightKg, slabs, "handling fee");
}

export function getServiceFee(
  chargeableWeightKg: number,
  slabs: WeightFeeSlab[] = DEFAULT_SERVICE_FEE_SLABS,
): number {
  return getFeeFromSlabs(chargeableWeightKg, slabs, "service fee");
}

export function getRepackingFee(
  chargeableWeightKg: number,
  slabs: WeightFeeSlab[] = DEFAULT_REPACKING_FEE_SLABS,
): number {
  return getFeeFromSlabs(chargeableWeightKg, slabs, "repacking fee");
}

/** @deprecated Use getRepackingFee */
export function getPackingFee(
  chargeableWeightKg: number,
  slabs: WeightFeeSlab[] = DEFAULT_REPACKING_FEE_SLABS,
): number {
  return getRepackingFee(chargeableWeightKg, slabs);
}

/** @deprecated Use separate fee helpers */
export function getIndiRouteFee(
  chargeableWeightKg: number,
  slabs: WeightFeeSlab[] = DEFAULT_REPACKING_FEE_SLABS,
): number {
  return getRepackingFee(chargeableWeightKg, slabs);
}
