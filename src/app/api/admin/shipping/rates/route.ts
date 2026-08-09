import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth-server";
import { calculateCustomerPrice } from "@/lib/shipping/pricing";
import {
  loadPackingFeeSlabs,
  loadShippingSettings,
} from "@/lib/shipping/settings";
import { isIndiaPostService } from "@/lib/shipping/india-post";

export async function GET(request: Request) {
  const auth = await requireAdminUser(request);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const countryCode = url.searchParams.get("countryCode")?.toUpperCase() ?? "";
  const tier = url.searchParams.get("tier") ?? "";
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 200), 500);

  let query = auth.db
    .from("shipping_rates")
    .select(
      "id, country_code, country_name, weight_kg, source_service_name, source_service_id, source_sla, lite_rate, basic_rate, advanced_rate, pro_rate, enterprise_rate, diamond_rate, safe_source_rate, customer_service_tier, active, updated_at",
    )
    .order("country_code", { ascending: true })
    .order("source_service_id", { ascending: true })
    .order("weight_kg", { ascending: true })
    .limit(limit);

  if (countryCode) {
    query = query.eq("country_code", countryCode);
  }
  if (tier === "economy" || tier === "standard") {
    query = query.eq("customer_service_tier", tier);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { error: "Unable to load shipping rates." },
      { status: 500 },
    );
  }

  const settings = await loadShippingSettings(auth.db);
  const packingSlabs = await loadPackingFeeSlabs(auth.db);

  const rates = (data ?? []).map((row) => {
    const sourceRate = Number(row.safe_source_rate);
    const weightKg = Number(row.weight_kg);
    const blocked = isIndiaPostService(
      Number(row.source_service_id),
      String(row.source_service_name),
    );

    let priced = null;
    if (!blocked && row.active) {
      try {
        priced = calculateCustomerPrice(sourceRate, weightKg, settings, packingSlabs);
      } catch {
        priced = null;
      }
    }

    return {
      id: row.id,
      countryCode: row.country_code,
      countryName: row.country_name,
      customerServiceTier: row.customer_service_tier,
      sourceServiceName: row.source_service_name,
      sourceServiceId: row.source_service_id,
      sourceSla: row.source_sla,
      weightSlabKg: weightKg,
      planRates: {
        lite: row.lite_rate,
        basic: row.basic_rate,
        advanced: row.advanced_rate,
        pro: row.pro_rate,
        enterprise: row.enterprise_rate,
        diamond: row.diamond_rate,
      },
      sourceRate,
      shippingCharge: priced?.shippingCharge ?? null,
      handlingFee: priced?.handlingFee ?? null,
      serviceFee: priced?.serviceFee ?? null,
      packingFee: priced?.packingFee ?? null,
      gst: priced?.gst ?? null,
      finalCustomerPrice: priced?.finalPrice ?? null,
      blockedIndiaPost: blocked,
      active: row.active,
      updatedAt: row.updated_at,
    };
  });

  return NextResponse.json({ rates, settings });
}
