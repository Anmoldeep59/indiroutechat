import type { SupportedCountryCode } from "./types";

export type ShippingCountry = {
  code: SupportedCountryCode;
  name: string;
  enabledByDefault: boolean;
};

export const SHIPPING_COUNTRIES: readonly ShippingCountry[] = [
  { code: "AU", name: "Australia", enabledByDefault: true },
  { code: "US", name: "United States", enabledByDefault: true },
  { code: "GB", name: "United Kingdom", enabledByDefault: true },
  { code: "CA", name: "Canada", enabledByDefault: true },
  { code: "NZ", name: "New Zealand", enabledByDefault: true },
  { code: "AE", name: "United Arab Emirates", enabledByDefault: true },
  { code: "DE", name: "Germany", enabledByDefault: true },
  { code: "MY", name: "Malaysia", enabledByDefault: true },
  { code: "IT", name: "Italy", enabledByDefault: true },
  { code: "FR", name: "France", enabledByDefault: true },
  { code: "JP", name: "Japan", enabledByDefault: true },
  { code: "CH", name: "Switzerland", enabledByDefault: true },
  { code: "SG", name: "Singapore", enabledByDefault: true },
  { code: "SA", name: "Saudi Arabia", enabledByDefault: true },
] as const;

const byCode = new Map(
  SHIPPING_COUNTRIES.map((country) => [country.code, country]),
);

const byName = new Map(
  SHIPPING_COUNTRIES.map((country) => [
    country.name.toLowerCase(),
    country,
  ]),
);

export function normalizeCountryCode(input: string): string {
  return input.trim().toUpperCase();
}

export function resolveCountry(
  input: string,
): ShippingCountry | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const byCodeHit = byCode.get(normalizeCountryCode(trimmed) as SupportedCountryCode);
  if (byCodeHit) return byCodeHit;

  return byName.get(trimmed.toLowerCase()) ?? null;
}

export function getCountryName(code: string): string | null {
  return byCode.get(normalizeCountryCode(code) as SupportedCountryCode)?.name ?? null;
}

export const COUNTRY_FLAGS: Record<string, string> = {
  AU: "🇦🇺",
  US: "🇺🇸",
  GB: "🇬🇧",
  CA: "🇨🇦",
  NZ: "🇳🇿",
  AE: "🇦🇪",
  DE: "🇩🇪",
  MY: "🇲🇾",
  IT: "🇮🇹",
  FR: "🇫🇷",
  JP: "🇯🇵",
  CH: "🇨🇭",
  SG: "🇸🇬",
  SA: "🇸🇦",
};
