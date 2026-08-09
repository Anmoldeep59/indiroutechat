import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth-server";
import { getCountryName, resolveCountry } from "@/lib/shipping/countries";
import { calculateCustomerPrice } from "@/lib/shipping/pricing";
import {
  loadIndiRouteFeeSlabs,
  loadMarginBrackets,
  loadShippingSettings,
} from "@/lib/shipping/settings";

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
  if (error) {
    return NextResponse.json(
      { error: "Unable to load Aramex base rates. Run migration 008." },
      { status: 500 },
    );
  }

  const settings = await loadShippingSettings(auth.db);
  const feeSlabs = await loadIndiRouteFeeSlabs(auth.db);
  const marginBrackets = await loadMarginBrackets(auth.db);

  const rates = (data ?? []).map((row) => {
    const base = Number(row.base_aramex_rate);
    const midWeight =
      row.max_weight_kg == null
        ? Number(row.min_weight_kg)
        : (Number(row.min_weight_kg) + Number(row.max_weight_kg)) / 2;

    let priced = null;
    if (row.active) {
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
      sourceSla: row.source_sla,
      weightSlabKg: midWeight,
      minWeightKg: row.min_weight_kg,
      maxWeightKg: row.max_weight_kg,
      sourceRate: base,
      baseAramexRate: base,
      fuelCharge: priced?.fuelCharge ?? null,
      aramexLandedCost: priced?.aramexLandedCost ?? null,
      shippingCharge: priced?.shippingSellingPrice ?? null,
      handlingFee: 0,
      serviceFee: 0,
      packingFee: priced?.indiRouteFee ?? null,
      indiRouteFee: priced?.indiRouteFee ?? null,
      gst: 0,
      finalCustomerPrice: priced?.finalPrice ?? null,
      blockedIndiaPost: false,
      active: row.active,
      updatedAt: row.updated_at,
    };
  });

  return NextResponse.json({ rates, settings });
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
      max_weight_kg:
        body.maxWeightKg == null || Number.isNaN(Number(body.maxWeightKg))
          ? null
          : Number(body.maxWeightKg),
      base_aramex_rate: base,
      currency: body.currency || "INR",
      source_sla: body.sourceSla?.trim() || null,
      active: body.active !== false,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Unable to save base rate." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}

export async function DELETE(request: Request) {
  const auth = await requireAdminUser(request);
  if (!auth.ok) return auth.response;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const { error } = await auth.db.from("aramex_base_rates").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
