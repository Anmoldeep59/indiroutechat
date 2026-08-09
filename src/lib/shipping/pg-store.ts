import { Client } from "pg";
import {
  DEFAULT_HANDLING_FEE_SLABS,
  DEFAULT_MARGIN_BRACKETS,
  DEFAULT_REPACKING_FEE_SLABS,
  DEFAULT_SERVICE_FEE_SLABS,
  DEFAULT_SHIPPING_SETTINGS,
} from "./defaults";
import type { FeeSlabSets } from "./pricing";
import type {
  AramexBaseRateRow,
  CustomerServiceTier,
  MarginBracket,
  ShippingSettings,
  WeightFeeSlab,
} from "./types";

function getDatabaseUrl(): string | null {
  const url = process.env.DATABASE_URL?.trim();
  return url || null;
}

export function hasDatabaseUrl(): boolean {
  return Boolean(getDatabaseUrl());
}

async function withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

function mapFeeRows(
  rows: Array<{ min_kg: unknown; max_kg: unknown; fee_inr: unknown }>,
  fallback: WeightFeeSlab[],
): WeightFeeSlab[] {
  if (!rows.length) return fallback.map((s) => ({ ...s }));
  return rows.map((row) => ({
    min_kg: Number(row.min_kg),
    max_kg: row.max_kg == null ? null : Number(row.max_kg),
    fee_inr: Number(row.fee_inr),
  }));
}

export async function loadQuoteContextFromPg(countryCode: string): Promise<{
  settings: ShippingSettings;
  feeSlabs: FeeSlabSets;
  marginBrackets: MarginBracket[];
  enabledCountryCodes: Set<string>;
  baseRates: AramexBaseRateRow[];
}> {
  return withClient(async (client) => {
    const settingsResult = await client.query(
      `select *
       from shipping_settings
       where id = 1
       limit 1`,
    );

    const settingsRow = settingsResult.rows[0] as
      | Record<string, unknown>
      | undefined;
    const settings: ShippingSettings = settingsRow
      ? {
          ...DEFAULT_SHIPPING_SETTINGS,
          shipping_markup_percent: Number(
            settingsRow.shipping_markup_percent ?? 0,
          ),
          handling_fee_inr: Number(settingsRow.handling_fee_inr ?? 0),
          service_fee_inr: Number(settingsRow.service_fee_inr ?? 0),
          gst_rate: Number(settingsRow.gst_rate ?? 0),
          volumetric_divisor: Number(
            settingsRow.volumetric_divisor ??
              DEFAULT_SHIPPING_SETTINGS.volumetric_divisor,
          ),
          tax_mode:
            (settingsRow.tax_mode as ShippingSettings["tax_mode"]) ??
            DEFAULT_SHIPPING_SETTINGS.tax_mode,
          economy_enabled: Boolean(settingsRow.economy_enabled ?? true),
          standard_enabled: Boolean(settingsRow.standard_enabled ?? true),
          express_enabled: Boolean(settingsRow.express_enabled ?? false),
          final_price_round_to_inr: Number(
            settingsRow.final_price_round_to_inr ?? 10,
          ),
          currency: String(settingsRow.currency ?? "INR"),
          quote_validity_hours: Number(
            settingsRow.quote_validity_hours ?? 24,
          ),
          aramex_fuel_surcharge_percent: Number(
            settingsRow.aramex_fuel_surcharge_percent ?? 23.25,
          ),
          base_rate_source:
            settingsRow.base_rate_source === "aramex_api"
              ? "aramex_api"
              : "admin_table",
        }
      : { ...DEFAULT_SHIPPING_SETTINGS };

    const handling = await client.query(
      `select min_kg, max_kg, fee_inr from shipping_handling_fee_slabs where active = true order by min_kg`,
    );
    const service = await client.query(
      `select min_kg, max_kg, fee_inr from shipping_service_fee_slabs where active = true order by min_kg`,
    );
    const repacking = await client.query(
      `select min_kg, max_kg, fee_inr from shipping_repacking_fee_slabs where active = true order by min_kg`,
    );
    const margins = await client.query(
      `select min_amount_inr, max_amount_inr, margin_percent from shipping_margin_brackets where active = true order by sort_order`,
    );
    const countries = await client.query(
      `select country_code from shipping_countries where enabled = true`,
    );
    const rates = await client.query(
      `select id, country_code, country_name, service_tier, min_weight_kg, max_weight_kg, base_aramex_rate, currency, source_sla, active
       from aramex_base_rates
       where active = true and upper(country_code) = upper($1)`,
      [countryCode],
    );

    const marginBrackets: MarginBracket[] =
      margins.rows.length > 0
        ? margins.rows.map((row) => ({
            min_amount_inr: Number(row.min_amount_inr),
            max_amount_inr:
              row.max_amount_inr == null ? null : Number(row.max_amount_inr),
            margin_percent: Number(row.margin_percent),
          }))
        : DEFAULT_MARGIN_BRACKETS.map((b) => ({ ...b }));

    const enabledCountryCodes = new Set(
      countries.rows.map((row) => String(row.country_code).toUpperCase()),
    );

    const baseRates: AramexBaseRateRow[] = rates.rows.map((row) => ({
      id: String(row.id),
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

    return {
      settings,
      feeSlabs: {
        handling: mapFeeRows(handling.rows, DEFAULT_HANDLING_FEE_SLABS),
        service: mapFeeRows(service.rows, DEFAULT_SERVICE_FEE_SLABS),
        repacking: mapFeeRows(repacking.rows, DEFAULT_REPACKING_FEE_SLABS),
      },
      marginBrackets,
      enabledCountryCodes:
        enabledCountryCodes.size > 0
          ? enabledCountryCodes
          : new Set(
              [
                "AU",
                "US",
                "GB",
                "CA",
                "NZ",
                "AE",
                "DE",
                "MY",
                "IT",
                "FR",
                "JP",
                "CH",
                "SG",
                "SA",
              ],
            ),
      baseRates,
    };
  });
}

export async function insertAramexBaseRatePg(input: {
  countryCode: string;
  countryName: string;
  serviceTier: CustomerServiceTier;
  minWeightKg: number;
  maxWeightKg: number | null;
  baseAramexRate: number;
  currency: string;
  sourceSla: string | null;
  active: boolean;
}): Promise<string> {
  return withClient(async (client) => {
    const result = await client.query(
      `insert into aramex_base_rates (
         country_code, country_name, service_tier, min_weight_kg, max_weight_kg,
         base_aramex_rate, currency, source_sla, active
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       returning id`,
      [
        input.countryCode,
        input.countryName,
        input.serviceTier,
        input.minWeightKg,
        input.maxWeightKg,
        input.baseAramexRate,
        input.currency,
        input.sourceSla,
        input.active,
      ],
    );
    return String(result.rows[0].id);
  });
}

export async function listAramexBaseRatesPg(options?: {
  countryCode?: string;
  tier?: string;
  limit?: number;
}) {
  return withClient(async (client) => {
    const params: unknown[] = [];
    const where: string[] = [];
    if (options?.countryCode) {
      params.push(options.countryCode.toUpperCase());
      where.push(`upper(country_code) = $${params.length}`);
    }
    if (options?.tier === "economy" || options?.tier === "standard") {
      params.push(options.tier);
      where.push(`service_tier = $${params.length}`);
    }
    params.push(Math.min(options?.limit ?? 250, 500));
    const sql = `
      select *
      from aramex_base_rates
      ${where.length ? `where ${where.join(" and ")}` : ""}
      order by country_code, service_tier, min_weight_kg
      limit $${params.length}
    `;
    const result = await client.query(sql, params);
    return result.rows;
  });
}

export async function deleteAramexBaseRatePg(id: string) {
  return withClient(async (client) => {
    await client.query(`delete from aramex_base_rates where id = $1`, [id]);
  });
}
