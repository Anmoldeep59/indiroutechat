/** Known India Post service courier IDs — never sell these to customers. */
export const INDIA_POST_SERVICE_IDS = new Set([326, 327, 328, 329]);

const INDIA_POST_NAME = /india\s*post/i;

export function isIndiaPostService(
  serviceId: number | string | null | undefined,
  serviceName?: string | null,
): boolean {
  if (serviceName && INDIA_POST_NAME.test(serviceName)) {
    return true;
  }

  if (serviceId == null || serviceId === "") {
    return false;
  }

  const numericId = Number(serviceId);
  if (!Number.isFinite(numericId)) {
    return false;
  }

  return INDIA_POST_SERVICE_IDS.has(numericId);
}

export function assertNotIndiaPost(
  serviceId: number,
  serviceName?: string | null,
): void {
  if (isIndiaPostService(serviceId, serviceName)) {
    throw new Error(
      `India Post service blocked (id=${serviceId}, name=${serviceName ?? "n/a"}).`,
    );
  }
}
