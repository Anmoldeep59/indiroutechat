import type { ServiceCandidate, SupportedCountryCode } from "./types";

export type CountryServiceMap = {
  economy: ServiceCandidate[];
  standard: ServiceCandidate[];
};

/**
 * Internal source-service mapping. Customer-facing names are always IndiRoute *.
 * Admin/audit retains these source names and IDs.
 */
export const DEFAULT_SERVICE_MAP: Record<SupportedCountryCode, CountryServiceMap> =
  {
    AU: {
      economy: [
        {
          sourceServiceId: 384,
          sourceServiceName: "SRX Economy",
          sourceSla: "Up to 20 Business Days",
          role: "preferred",
        },
        {
          sourceServiceId: 440,
          sourceServiceName: "SRX Economy Pro",
          sourceSla: "Up to 20 Business Days",
          role: "fallback",
        },
      ],
      standard: [
        {
          sourceServiceId: 140,
          sourceServiceName: "SRX Premium Pro",
          sourceSla: "10–15 Business Days",
          role: "candidate",
        },
        {
          sourceServiceId: 262,
          sourceServiceName: "SRX Premium Plus Pro",
          sourceSla: "10–15 Business Days",
          role: "candidate",
        },
      ],
    },
    US: {
      economy: [
        {
          sourceServiceId: 384,
          sourceServiceName: "SRX Economy",
          sourceSla: "12–15 Business Days",
          role: "preferred",
        },
      ],
      standard: [
        {
          sourceServiceId: 381,
          sourceServiceName: "SRX Premium",
          sourceSla: "10–12 Business Days",
          role: "candidate",
        },
        {
          sourceServiceId: 140,
          sourceServiceName: "SRX Premium Pro",
          sourceSla: "10–12 Business Days",
          role: "candidate",
        },
        {
          sourceServiceId: 262,
          sourceServiceName: "SRX Premium Plus Pro",
          sourceSla: "10–12 Business Days",
          role: "candidate",
        },
      ],
    },
    GB: {
      economy: [
        {
          sourceServiceId: 384,
          sourceServiceName: "SRX Economy",
          sourceSla: "Up to 20 Business Days",
          role: "preferred",
        },
        {
          sourceServiceId: 440,
          sourceServiceName: "SRX Economy Pro",
          sourceSla: "Up to 20 Business Days",
          role: "fallback",
        },
      ],
      standard: [
        {
          sourceServiceId: 242,
          sourceServiceName: "Aramex International GPX",
          sourceSla: "6–8 Business Days",
          role: "preferred",
        },
        {
          sourceServiceId: 140,
          sourceServiceName: "SRX Premium Pro",
          sourceSla: "10–15 Business Days",
          role: "fallback",
        },
        {
          sourceServiceId: 262,
          sourceServiceName: "SRX Premium Plus Pro",
          sourceSla: "10–15 Business Days",
          role: "fallback",
        },
        {
          sourceServiceId: 240,
          sourceServiceName: "SRX Priority Pro",
          sourceSla: "8–15 Business Days",
          role: "fallback",
        },
      ],
    },
    CA: {
      economy: [
        {
          sourceServiceId: 384,
          sourceServiceName: "SRX Economy",
          sourceSla: "Up to 20 Business Days",
          role: "preferred",
        },
        {
          sourceServiceId: 440,
          sourceServiceName: "SRX Economy Pro",
          sourceSla: "Up to 20 Business Days",
          role: "fallback",
        },
      ],
      standard: [
        {
          sourceServiceId: 140,
          sourceServiceName: "SRX Premium Pro",
          sourceSla: "10–15 Business Days",
          role: "candidate",
        },
        {
          sourceServiceId: 262,
          sourceServiceName: "SRX Premium Plus Pro",
          sourceSla: "10–15 Business Days",
          role: "candidate",
        },
      ],
    },
    NZ: {
      economy: [
        {
          sourceServiceId: 384,
          sourceServiceName: "SRX Economy",
          sourceSla: "Up to 20 Business Days",
          role: "preferred",
        },
        {
          sourceServiceId: 440,
          sourceServiceName: "SRX Economy Pro",
          sourceSla: "Up to 20 Business Days",
          role: "fallback",
        },
      ],
      standard: [
        {
          sourceServiceId: 35,
          sourceServiceName: "Aramex International",
          sourceSla: "10–14 Business Days",
          role: "preferred",
        },
      ],
    },
    AE: {
      economy: [
        {
          sourceServiceId: 440,
          sourceServiceName: "SRX Economy Pro",
          sourceSla: "Up to 20 Business Days",
          role: "preferred",
        },
      ],
      standard: [
        {
          sourceServiceId: 35,
          sourceServiceName: "Aramex International",
          sourceSla: "3–5 Business Days",
          role: "preferred",
        },
      ],
    },
    DE: {
      economy: [
        {
          sourceServiceId: 384,
          sourceServiceName: "SRX Economy",
          sourceSla: "Up to 20 Business Days",
          role: "preferred",
        },
        {
          sourceServiceId: 440,
          sourceServiceName: "SRX Economy Pro",
          sourceSla: "Up to 20 Business Days",
          role: "fallback",
        },
      ],
      standard: [
        {
          sourceServiceId: 241,
          sourceServiceName: "Aramex EPX",
          sourceSla: "8–15 Business Days",
          role: "candidate",
        },
        {
          sourceServiceId: 240,
          sourceServiceName: "SRX Priority Pro",
          sourceSla: "8–15 Business Days",
          role: "candidate",
        },
      ],
    },
    MY: {
      economy: [
        {
          sourceServiceId: 384,
          sourceServiceName: "SRX Economy",
          sourceSla: "Up to 20 Business Days",
          role: "preferred",
        },
        {
          sourceServiceId: 440,
          sourceServiceName: "SRX Economy Pro",
          sourceSla: "Up to 20 Business Days",
          role: "fallback",
        },
      ],
      standard: [
        {
          sourceServiceId: 140,
          sourceServiceName: "SRX Premium Pro",
          sourceSla: "10–15 Business Days",
          role: "candidate",
        },
        {
          sourceServiceId: 262,
          sourceServiceName: "SRX Premium Plus Pro",
          sourceSla: "10–15 Business Days",
          role: "candidate",
        },
      ],
    },
    IT: {
      economy: [
        {
          sourceServiceId: 384,
          sourceServiceName: "SRX Economy",
          sourceSla: "Up to 20 Business Days",
          role: "preferred",
        },
        {
          sourceServiceId: 440,
          sourceServiceName: "SRX Economy Pro",
          sourceSla: "Up to 20 Business Days",
          role: "fallback",
        },
      ],
      standard: [
        {
          sourceServiceId: 241,
          sourceServiceName: "Aramex EPX",
          sourceSla: "8–15 Business Days",
          role: "candidate",
        },
        {
          sourceServiceId: 240,
          sourceServiceName: "SRX Priority Pro",
          sourceSla: "8–15 Business Days",
          role: "candidate",
        },
      ],
    },
    FR: {
      economy: [
        {
          sourceServiceId: 384,
          sourceServiceName: "SRX Economy",
          sourceSla: "Up to 20 Business Days",
          role: "preferred",
        },
        {
          sourceServiceId: 440,
          sourceServiceName: "SRX Economy Pro",
          sourceSla: "Up to 20 Business Days",
          role: "fallback",
        },
      ],
      standard: [
        {
          sourceServiceId: 241,
          sourceServiceName: "Aramex EPX",
          sourceSla: "8–15 Business Days",
          role: "candidate",
        },
        {
          sourceServiceId: 240,
          sourceServiceName: "SRX Priority Pro",
          sourceSla: "8–15 Business Days",
          role: "candidate",
        },
      ],
    },
    JP: {
      economy: [
        {
          sourceServiceId: 384,
          sourceServiceName: "SRX Economy",
          sourceSla: "Up to 20 Business Days",
          role: "preferred",
        },
        {
          sourceServiceId: 440,
          sourceServiceName: "SRX Economy Pro",
          sourceSla: "Up to 20 Business Days",
          role: "fallback",
        },
      ],
      standard: [
        {
          sourceServiceId: 140,
          sourceServiceName: "SRX Premium Pro",
          sourceSla: "10–15 Business Days",
          role: "candidate",
        },
        {
          sourceServiceId: 262,
          sourceServiceName: "SRX Premium Plus Pro",
          sourceSla: "10–15 Business Days",
          role: "candidate",
        },
      ],
    },
    CH: {
      economy: [
        {
          sourceServiceId: 384,
          sourceServiceName: "SRX Economy",
          sourceSla: "Up to 20 Business Days",
          role: "preferred",
        },
        {
          sourceServiceId: 440,
          sourceServiceName: "SRX Economy Pro",
          sourceSla: "Up to 20 Business Days",
          role: "fallback",
        },
      ],
      standard: [
        {
          sourceServiceId: 262,
          sourceServiceName: "SRX Premium Plus Pro",
          sourceSla: "10–15 Business Days",
          role: "preferred",
        },
      ],
    },
    SG: {
      economy: [
        {
          sourceServiceId: 384,
          sourceServiceName: "SRX Economy",
          sourceSla: "Up to 20 Business Days",
          role: "preferred",
        },
        {
          sourceServiceId: 440,
          sourceServiceName: "SRX Economy Pro",
          sourceSla: "Up to 20 Business Days",
          role: "fallback",
        },
      ],
      standard: [
        {
          sourceServiceId: 140,
          sourceServiceName: "SRX Premium Pro",
          sourceSla: "10–15 Business Days",
          role: "candidate",
        },
        {
          sourceServiceId: 262,
          sourceServiceName: "SRX Premium Plus Pro",
          sourceSla: "10–15 Business Days",
          role: "candidate",
        },
      ],
    },
    SA: {
      economy: [
        {
          sourceServiceId: 384,
          sourceServiceName: "SRX Economy",
          sourceSla: "Up to 20 Business Days",
          role: "preferred",
        },
        {
          sourceServiceId: 440,
          sourceServiceName: "SRX Economy Pro",
          sourceSla: "Up to 20 Business Days",
          role: "fallback",
        },
      ],
      standard: [
        {
          sourceServiceId: 262,
          sourceServiceName: "SRX Premium Plus Pro",
          sourceSla: "10–15 Business Days",
          role: "preferred",
        },
      ],
    },
  };

export function getDefaultServiceMap(
  countryCode: string,
): CountryServiceMap | null {
  const code = countryCode.trim().toUpperCase() as SupportedCountryCode;
  return DEFAULT_SERVICE_MAP[code] ?? null;
}
