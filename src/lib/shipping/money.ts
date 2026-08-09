/** Round upward to a fixed number of decimal places (never down). */
export function roundUp(value: number, decimals = 2): number {
  if (!Number.isFinite(value)) {
    throw new Error("Cannot round a non-finite value.");
  }
  if (decimals < 0) {
    throw new Error("decimals must be >= 0");
  }
  const factor = 10 ** decimals;
  return Math.ceil((value - Number.EPSILON) * factor) / factor;
}

/** Round upward to the nearest multiple (e.g. nearest ₹10). */
export function roundUpToNearest(value: number, nearest: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(nearest) || nearest <= 0) {
    throw new Error("Invalid round-up inputs.");
  }
  return Math.ceil(value / nearest - Number.EPSILON) * nearest;
}

export function maxPlanRate(rates: Array<number | null | undefined>): number | null {
  let max: number | null = null;
  for (const rate of rates) {
    if (rate == null || !Number.isFinite(rate)) continue;
    if (max == null || rate > max) max = rate;
  }
  return max;
}

export function computeSafeSourceRate(plan: {
  lite_rate?: number | null;
  basic_rate?: number | null;
  advanced_rate?: number | null;
  pro_rate?: number | null;
  enterprise_rate?: number | null;
  diamond_rate?: number | null;
  lite?: number | null;
  basic?: number | null;
  advanced?: number | null;
  pro?: number | null;
  enterprise?: number | null;
  diamond?: number | null;
}): number | null {
  return maxPlanRate([
    plan.lite_rate ?? plan.lite,
    plan.basic_rate ?? plan.basic,
    plan.advanced_rate ?? plan.advanced,
    plan.pro_rate ?? plan.pro,
    plan.enterprise_rate ?? plan.enterprise,
    plan.diamond_rate ?? plan.diamond,
  ]);
}
