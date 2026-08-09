import { DEFAULT_INDIROUTE_FEE_SLABS } from "./defaults";
import type { WeightFeeSlab } from "./types";

/**
 * Weight slabs use exclusive lower bounds after the first slab:
 * 0–0.50, >0.50–1, >1–2, etc.
 */
export function getIndiRouteFee(
  chargeableWeightKg: number,
  slabs: WeightFeeSlab[] = DEFAULT_INDIROUTE_FEE_SLABS,
): number {
  if (!Number.isFinite(chargeableWeightKg) || chargeableWeightKg < 0) {
    throw new Error("Invalid chargeable weight for IndiRoute fee.");
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

/** @deprecated Use getIndiRouteFee */
export function getPackingFee(
  chargeableWeightKg: number,
  slabs: WeightFeeSlab[] = DEFAULT_INDIROUTE_FEE_SLABS,
): number {
  return getIndiRouteFee(chargeableWeightKg, slabs);
}
