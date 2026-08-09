import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth-server";
import { getCountryName, resolveCountry } from "@/lib/shipping/countries";
import { calculateCustomerPrice } from "@/lib/shipping/pricing";
import {
  deleteAramexBaseRatePg,
  hasDatabaseUrl,
  insertAramexBaseRatePg,
  listAramexBaseRatesPg,
  loadQuoteContextFromPg,
} from "@/lib/shipping/pg-store";
import {
  loadFeeSlabSets,
  loadMarginBrackets,
  loadShippingSettings,
} from "@/lib/shipping/settings";

function mapPricedRows(
  data: Array<Record<string, unknown>>,
  settings: Awaited<ReturnType<typeof loadShippingSettings>>,
  feeSlabs: Awaited<ReturnType<typeof loadFeeSlabSets>>,
  marginBrackets: Awaited<ReturnType<typeof loadMarginBrackets>>,
) {
  return data.map((row) => {
    const base = Number(row.base_aramex_rate);
    const minWeightKg = Number(row.min_weight_kg);
    const maxWeightKg =
      row.max_weight_kg == null ? null : Number(row.max_weight_kg);
    const midWeight =
      maxWeightKg == null ? minWeightKg : (minWeightKg + maxWeightKg) / 2;

    let priced = null;
    if (row.active !== false) {
      try {
        priced = calculateCustomerPrice(
          base,
          midWeight,
          settings,
          feeSlabs,
          marginBrackets,
        );
      } catch {
        priced = null;
      }
    }

    return {
      id: row.id,
      countryCode: row.country_code,
      countryName: row.country_name,
      customerServiceTier: row.service_tier,
      sourceServiceName: "Aramex base (admin table)",
      sourceServiceId: null,
      sourceSla: row.source_sla ?? null,
      weightSlabKg: midWeight,
      minWeightKg,
      maxWeightKg,
      sourceRate: base,
      baseAramexRate: base,
      fuelCharge: priced?.aramexFuelSurcharge ?? null,
      aramexTransportCost: priced?.aramexTransportCost ?? null,
      shippingCharge: priced?.indiRouteTransportPrice ?? null,
      handlingFee: priced?.handlingFee ?? null,
      serviceFee: priced?.serviceFee ?? null,
      packingFee: priced?.packingFee ?? null,
      finalCustomerPrice: priced?.finalPrice ?? null,
      blockedIndiaPost: false,
      active: Boolean(row.active),
      updatedAt: row.updated_at ?? null,
    };
  });
}

export async function GET(request: Request) {
  const auth = await requireAdminUser(request);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const countryCode = url.searchParams.get("countryCode")?.toUpperCase() ?? "";
  const tier = url.searchParams.get("tier") ?? "";
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 200), 500);

  let query = auth.db
    .from("aramex_base_rates")
    .select(
      "id, country_code, country_name, service_tier, min_weight_kg, max_weight_kg, base_aramex_rate, currency, source_sla, active, updated_at",
    )
    .order("country_code", { ascending: true })
    .order("service_tier", { ascending: true })
    .order("min_weight_kg", { ascending: true })
    .limit(limit);

  if (countryCode) query = query.eq("country_code", countryCode);
  if (tier === "economy" || tier === "standard") {
    query = query.eq("service_tier", tier);
  }

  const { data, error } = await query;

  if (!error) {
    const settings = await loadShippingSettings(auth.db);
    const feeSlabs = await loadFeeSlabSets(auth.db);
    const marginBrackets = await loadMarginBrackets(auth.db);
    return NextResponse.json({
      rates: mapPricedRows(data ?? [], settings, feeSlabs, marginBrackets),
      settings,
    });
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json(
      { error: "Unable to load Aramex base rates. Run migration 008/010." },
      { status: 500 },
    );
  }

  try {
    const rows = await listAramexBaseRatesPg({
      countryCode: countryCode || undefined,
      tier,
      limit,
    });
    const context = await loadQuoteContextFromPg(countryCode || "AU");
    return NextResponse.json({
      rates: mapPricedRows(
        rows as Array<Record<string, unknown>>,
        context.settings,
        context.feeSlabs,
        context.marginBrackets,
      ),
      settings: context.settings,
    });
  } catch (pgError) {
    console.error("[admin/shipping/rates] pg fallback failed", pgError);
    return NextResponse.json(
      { error: "Unable to load Aramex base rates." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminUser(request);
  if (!auth.ok) return auth.response;

  let body: {
    countryCode?: string;
    countryName?: string;
    serviceTier?: string;
    minWeightKg?: number;
    maxWeightKg?: number | null;
    baseAramexRate?: number;
    currency?: string;
    sourceSla?: string | null;
    active?: boolean;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const country = resolveCountry(String(body.countryCode ?? ""));
  const countryCode =
    country?.code ?? String(body.countryCode ?? "").trim().toUpperCase();
  const countryName =
    country?.name ??
    body.countryName?.trim() ??
    getCountryName(countryCode) ??
    countryCode;
  const tier = body.serviceTier === "economy" ? "economy" : "standard";
  const base = Number(body.baseAramexRate);
  const minWeight = Number(body.minWeightKg);
  const maxWeight =
    body.maxWeightKg == null || Number.isNaN(Number(body.maxWeightKg))
      ? null
      : Number(body.maxWeightKg);

  if (!countryCode || !Number.isFinite(base) || base < 0 || !Number.isFinite(minWeight)) {
    return NextResponse.json(
      { error: "Country, weight from, and base Aramex rate are required." },
      { status: 400 },
    );
  }

  const { data, error } = await auth.db
    .from("aramex_base_rates")
    .insert({
      country_code: countryCode,
      country_name: countryName,
      service_tier: tier,
      min_weight_kg: minWeight,
      max_weight_kg: maxWeight,
      base_aramex_rate: base,
      currency: body.currency || "INR",
      source_sla: body.sourceSla?.trim() || null,
      active: body.active !== false,
    })
    .select("id")
    .single();

  if (!error && data) {
    return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json(
      { error: error?.message || "Unable to save base rate." },
      { status: 500 },
    );
  }

  try {
    const id = await insertAramexBaseRatePg({
      countryCode,
      countryName,
      serviceTier: tier,
      minWeightKg: minWeight,
      maxWeightKg: maxWeight,
      baseAramexRate: base,
      currency: body.currency || "INR",
      sourceSla: body.sourceSla?.trim() || null,
      active: body.active !== false,
    });
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (pgError) {
    console.error("[admin/shipping/rates] pg insert failed", pgError);
    return NextResponse.json(
      { error: "Unable to save base rate." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdminUser(request);
  if (!auth.ok) return auth.response;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const { error } = await auth.db.from("aramex_base_rates").delete().eq("id", id);
  if (!error) {
    return NextResponse.json({ ok: true });
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    await deleteAramexBaseRatePg(id);
    return NextResponse.json({ ok: true });
  } catch (pgError) {
    console.error("[admin/shipping/rates] pg delete failed", pgError);
    return NextResponse.json({ error: "Unable to delete base rate." }, { status: 500 });
  }
}
