import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth-server";
import { getCountryName, resolveCountry } from "@/lib/shipping/countries";
import { isIndiaPostService } from "@/lib/shipping/india-post";
import { computeSafeSourceRate } from "@/lib/shipping/money";
import { generateSeedRates } from "@/lib/shipping/seed-rates";

type ImportRow = {
  countryCode?: string;
  country_code?: string;
  "Country Code"?: string;
  countryName?: string;
  country_name?: string;
  "Country-Name"?: string;
  weight?: number | string;
  weight_kg?: number | string;
  Weight?: number | string;
  sourceServiceName?: string;
  source_service_name?: string;
  Service?: string;
  sourceServiceId?: number | string;
  source_service_id?: number | string;
  "Service-Courier ID"?: number | string;
  sourceSla?: string;
  source_sla?: string;
  "Updated Service SLA"?: string;
  lite?: number | string | null;
  Lite?: number | string | null;
  lite_rate?: number | string | null;
  basic?: number | string | null;
  Basic?: number | string | null;
  basic_rate?: number | string | null;
  advanced?: number | string | null;
  Advanced?: number | string | null;
  advanced_rate?: number | string | null;
  pro?: number | string | null;
  Pro?: number | string | null;
  pro_rate?: number | string | null;
  enterprise?: number | string | null;
  Enterprise?: number | string | null;
  enterprise_rate?: number | string | null;
  diamond?: number | string | null;
  Diamond?: number | string | null;
  diamond_rate?: number | string | null;
  customerServiceTier?: string | null;
  customer_service_tier?: string | null;
};

function num(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeRow(row: ImportRow) {
  const countryRaw = String(
    row.countryCode ?? row.country_code ?? row["Country Code"] ?? "",
  ).trim();
  const country = resolveCountry(countryRaw);
  const countryCode = country?.code ?? countryRaw.toUpperCase();
  const countryName =
    country?.name ??
    String(row.countryName ?? row.country_name ?? row["Country-Name"] ?? "").trim() ??
    getCountryName(countryCode) ??
    countryCode;

  const weight = num(row.weight ?? row.weight_kg ?? row.Weight);
  const sourceServiceId = num(
    row.sourceServiceId ?? row.source_service_id ?? row["Service-Courier ID"],
  );
  const sourceServiceName = String(
    row.sourceServiceName ?? row.source_service_name ?? row.Service ?? "",
  ).trim();
  const sourceSla = String(
    row.sourceSla ?? row.source_sla ?? row["Updated Service SLA"] ?? "",
  ).trim();

  const lite = num(row.lite ?? row.Lite ?? row.lite_rate);
  const basic = num(row.basic ?? row.Basic ?? row.basic_rate);
  const advanced = num(row.advanced ?? row.Advanced ?? row.advanced_rate);
  const pro = num(row.pro ?? row.Pro ?? row.pro_rate);
  const enterprise = num(row.enterprise ?? row.Enterprise ?? row.enterprise_rate);
  const diamond = num(row.diamond ?? row.Diamond ?? row.diamond_rate);
  const safe = computeSafeSourceRate({
    lite,
    basic,
    advanced,
    pro,
    enterprise,
    diamond,
  });

  const tierRaw = String(
    row.customerServiceTier ?? row.customer_service_tier ?? "",
  ).toLowerCase();
  const tier =
    tierRaw === "economy" || tierRaw === "standard" ? tierRaw : null;

  return {
    countryCode,
    countryName,
    weight,
    sourceServiceId,
    sourceServiceName,
    sourceSla,
    lite,
    basic,
    advanced,
    pro,
    enterprise,
    diamond,
    safe,
    tier,
  };
}

export async function POST(request: Request) {
  const auth = await requireAdminUser(request);
  if (!auth.ok) return auth.response;

  let body: {
    mode?: "replace" | "upsert" | "seed";
    rows?: ImportRow[];
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const mode = body.mode ?? "upsert";

  if (mode === "seed") {
    const seedRows = generateSeedRates();
    await auth.db
      .from("shipping_rates")
      .delete()
      .gte("created_at", "1970-01-01");

    const chunkSize = 200;
    for (let i = 0; i < seedRows.length; i += chunkSize) {
      const chunk = seedRows.slice(i, i + chunkSize).map((row) => ({
        country_code: row.country_code,
        country_name: row.country_name,
        weight_kg: row.weight_kg,
        source_service_name: row.source_service_name,
        source_service_id: row.source_service_id,
        source_sla: row.source_sla,
        lite_rate: row.lite_rate,
        basic_rate: row.basic_rate,
        advanced_rate: row.advanced_rate,
        pro_rate: row.pro_rate,
        enterprise_rate: row.enterprise_rate,
        diamond_rate: row.diamond_rate,
        safe_source_rate: row.safe_source_rate,
        customer_service_tier: row.customer_service_tier,
        active: true,
      }));
      const { error } = await auth.db.from("shipping_rates").insert(chunk);
      if (error) {
        return NextResponse.json(
          { error: "Failed while seeding rates.", detail: error.message },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      ok: true,
      imported: seedRows.length,
      skippedIndiaPost: 0,
      mode: "seed",
    });
  }

  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No rate rows provided." },
      { status: 400 },
    );
  }

  let skippedIndiaPost = 0;
  const prepared = [];

  for (const raw of rows) {
    const row = normalizeRow(raw);
    if (
      !row.countryCode ||
      row.weight == null ||
      row.weight <= 0 ||
      row.sourceServiceId == null ||
      !row.sourceServiceName ||
      row.safe == null
    ) {
      continue;
    }

    if (isIndiaPostService(row.sourceServiceId, row.sourceServiceName)) {
      skippedIndiaPost += 1;
      continue;
    }

    prepared.push({
      country_code: row.countryCode,
      country_name: row.countryName,
      weight_kg: row.weight,
      source_service_name: row.sourceServiceName,
      source_service_id: row.sourceServiceId,
      source_sla: row.sourceSla || null,
      lite_rate: row.lite,
      basic_rate: row.basic,
      advanced_rate: row.advanced,
      pro_rate: row.pro,
      enterprise_rate: row.enterprise,
      diamond_rate: row.diamond,
      safe_source_rate: row.safe,
      customer_service_tier: row.tier,
      active: true,
    });
  }

  if (prepared.length === 0) {
    return NextResponse.json(
      {
        error: "No valid non-India-Post rows to import.",
        skippedIndiaPost,
      },
      { status: 400 },
    );
  }

  if (mode === "replace") {
    await auth.db
      .from("shipping_rates")
      .delete()
      .gte("created_at", "1970-01-01");
  }

  const chunkSize = 200;
  for (let i = 0; i < prepared.length; i += chunkSize) {
    const chunk = prepared.slice(i, i + chunkSize);
    const { error } = await auth.db.from("shipping_rates").upsert(chunk, {
      onConflict: "country_code,source_service_id,weight_kg",
    });
    if (error) {
      return NextResponse.json(
        { error: "Failed while importing rates.", detail: error.message },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    ok: true,
    imported: prepared.length,
    skippedIndiaPost,
    mode,
  });
}
