import { NextResponse } from "next/server";
import { SHIPPING_COUNTRIES, COUNTRY_FLAGS } from "@/lib/shipping/countries";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const db = getSupabaseAdmin();

  if (!db) {
    return NextResponse.json({
      countries: SHIPPING_COUNTRIES.filter((c) => c.enabledByDefault).map(
        (country) => ({
          code: country.code,
          name: country.name,
          flag: COUNTRY_FLAGS[country.code] ?? "🌏",
        }),
      ),
    });
  }

  const { data, error } = await db
    .from("shipping_countries")
    .select("country_code, country_name, enabled")
    .eq("enabled", true)
    .order("country_name", { ascending: true });

  if (error || !data) {
    return NextResponse.json({
      countries: SHIPPING_COUNTRIES.map((country) => ({
        code: country.code,
        name: country.name,
        flag: COUNTRY_FLAGS[country.code] ?? "🌏",
      })),
    });
  }

  return NextResponse.json({
    countries: data.map((row) => ({
      code: String(row.country_code).toUpperCase(),
      name: String(row.country_name),
      flag: COUNTRY_FLAGS[String(row.country_code).toUpperCase()] ?? "🌏",
    })),
  });
}
