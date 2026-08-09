import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth-server";
import {
  DEFAULT_INDIROUTE_FEE_SLABS,
  DEFAULT_MARGIN_BRACKETS,
} from "@/lib/shipping/defaults";
import {
  loadEnabledCountryCodes,
  loadIndiRouteFeeSlabs,
  loadMarginBrackets,
  loadShippingSettings,
} from "@/lib/shipping/settings";
import type {
  MarginBracket,
  ShippingSettings,
  WeightFeeSlab,
} from "@/lib/shipping/types";

export async function GET(request: Request) {
  const auth = await requireAdminUser(request);
  if (!auth.ok) return auth.response;

  const [settings, feeSlabs, marginBrackets, enabled] = await Promise.all([
    loadShippingSettings(auth.db),
    loadIndiRouteFeeSlabs(auth.db),
    loadMarginBrackets(auth.db),
    loadEnabledCountryCodes(auth.db),
  ]);

  const { data: countries } = await auth.db
    .from("shipping_countries")
    .select("country_code, country_name, enabled")
    .order("country_name", { ascending: true });

  const { data: mappings } = await auth.db
    .from("shipping_service_mappings")
    .select(
      "id, country_code, country_name, customer_tier, source_service_id, source_service_name, source_sla, role, sort_order, active",
    )
    .order("country_code", { ascending: true })
    .order("customer_tier", { ascending: true })
    .order("sort_order", { ascending: true });

  return NextResponse.json({
    settings,
    packingSlabs: feeSlabs,
    feeSlabs,
    marginBrackets,
    enabledCountryCodes: [...enabled],
    countries: countries ?? [],
    mappings: mappings ?? [],
  });
}

type PatchBody = {
  settings?: Partial<ShippingSettings>;
  packingSlabs?: WeightFeeSlab[];
  feeSlabs?: WeightFeeSlab[];
  marginBrackets?: MarginBracket[];
  countries?: Array<{ country_code: string; enabled: boolean }>;
};

export async function PATCH(request: Request) {
  const auth = await requireAdminUser(request);
  if (!auth.ok) return auth.response;

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (body.settings) {
    const current = await loadShippingSettings(auth.db);
    const next = { ...current, ...body.settings };
    const { error } = await auth.db.from("shipping_settings").upsert({
      id: 1,
      shipping_markup_percent: next.shipping_markup_percent,
      handling_fee_inr: next.handling_fee_inr,
      service_fee_inr: next.service_fee_inr,
      gst_rate: next.gst_rate,
      volumetric_divisor: next.volumetric_divisor,
      tax_mode: next.tax_mode,
      economy_enabled: next.economy_enabled,
      standard_enabled: next.standard_enabled,
      express_enabled: next.express_enabled,
      final_price_round_to_inr: next.final_price_round_to_inr,
      currency: next.currency,
      quote_validity_hours: next.quote_validity_hours,
      aramex_fuel_surcharge_percent: next.aramex_fuel_surcharge_percent,
      base_rate_source: next.base_rate_source,
    });
    if (error) {
      return NextResponse.json(
        { error: "Unable to update shipping settings." },
        { status: 500 },
      );
    }
  }

  const feeSlabs = body.feeSlabs ?? body.packingSlabs;
  if (feeSlabs) {
    const slabs =
      feeSlabs.length > 0 ? feeSlabs : DEFAULT_INDIROUTE_FEE_SLABS;

    await auth.db
      .from("shipping_indiroute_fee_slabs")
      .delete()
      .gte("created_at", "1970-01-01");

    const { error } = await auth.db.from("shipping_indiroute_fee_slabs").insert(
      slabs.map((slab) => ({
        min_kg: slab.min_kg,
        max_kg: slab.max_kg,
        fee_inr: slab.fee_inr,
        active: true,
      })),
    );

    if (error) {
      return NextResponse.json(
        { error: "Unable to update IndiRoute fee slabs." },
        { status: 500 },
      );
    }
  }

  if (body.marginBrackets) {
    const brackets =
      body.marginBrackets.length > 0
        ? body.marginBrackets
        : DEFAULT_MARGIN_BRACKETS;

    await auth.db
      .from("shipping_margin_brackets")
      .delete()
      .gte("created_at", "1970-01-01");

    const { error } = await auth.db.from("shipping_margin_brackets").insert(
      brackets.map((bracket, index) => ({
        min_amount_inr: bracket.min_amount_inr,
        max_amount_inr: bracket.max_amount_inr,
        margin_percent: bracket.margin_percent,
        sort_order: index + 1,
        active: true,
      })),
    );

    if (error) {
      return NextResponse.json(
        { error: "Unable to update margin brackets." },
        { status: 500 },
      );
    }
  }

  if (body.countries) {
    for (const country of body.countries) {
      await auth.db
        .from("shipping_countries")
        .update({ enabled: Boolean(country.enabled) })
        .eq("country_code", country.country_code.toUpperCase());
    }
  }

  const settings = await loadShippingSettings(auth.db);
  const nextFeeSlabs = await loadIndiRouteFeeSlabs(auth.db);
  const marginBrackets = await loadMarginBrackets(auth.db);
  return NextResponse.json({
    settings,
    packingSlabs: nextFeeSlabs,
    feeSlabs: nextFeeSlabs,
    marginBrackets,
    ok: true,
  });
}
