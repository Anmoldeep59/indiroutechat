import type { ShippingSettings } from "./types";

export function calculateVolumetricWeightKg(
  lengthCm: number,
  widthCm: number,
  heightCm: number,
  volumetricDivisor: number,
): number {
  if (
    !Number.isFinite(lengthCm) ||
    !Number.isFinite(widthCm) ||
    !Number.isFinite(heightCm) ||
    !Number.isFinite(volumetricDivisor) ||
    volumetricDivisor <= 0
  ) {
    throw new Error("Invalid dimensions or volumetric divisor.");
  }

  if (lengthCm < 0 || widthCm < 0 || heightCm < 0) {
    throw new Error("Dimensions cannot be negative.");
  }

  // Zero dimensions → volumetric weight 0 (actual weight still applies).
  if (lengthCm === 0 || widthCm === 0 || heightCm === 0) {
    return 0;
  }

  return (lengthCm * widthCm * heightCm) / volumetricDivisor;
}

export function calculateChargeableWeightKg(
  actualWeightKg: number,
  lengthCm: number,
  widthCm: number,
  heightCm: number,
  settings: Pick<ShippingSettings, "volumetric_divisor">,
): { actualWeightKg: number; volumetricWeightKg: number; chargeableWeightKg: number } {
  if (!Number.isFinite(actualWeightKg) || actualWeightKg <= 0) {
    throw new Error("Actual weight must be greater than zero.");
  }

  const volumetricWeightKg = calculateVolumetricWeightKg(
    lengthCm,
    widthCm,
    heightCm,
    settings.volumetric_divisor,
  );

  return {
    actualWeightKg,
    volumetricWeightKg,
    chargeableWeightKg: Math.max(actualWeightKg, volumetricWeightKg),
  };
}

/**
 * Never interpolate downward: pick the smallest available slab >= chargeable weight.
 */
export function selectWeightSlab(
  chargeableWeightKg: number,
  availableSlabsKg: number[],
): number | null {
  const valid = availableSlabsKg
    .map(Number)
    .filter((w) => Number.isFinite(w) && w >= chargeableWeightKg)
    .sort((a, b) => a - b);

  return valid[0] ?? null;
}
