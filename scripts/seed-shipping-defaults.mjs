import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const file = path.join(process.cwd(), ".env.local");
  return Object.fromEntries(
    fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const i = line.indexOf("=");
        let value = line.slice(i + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        return [line.slice(0, i).trim(), value];
      }),
  );
}

const env = loadEnvLocal();
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const countries = [
  ["AU", "Australia"],
  ["US", "United States"],
  ["GB", "United Kingdom"],
  ["CA", "Canada"],
  ["NZ", "New Zealand"],
  ["AE", "United Arab Emirates"],
  ["DE", "Germany"],
  ["MY", "Malaysia"],
  ["IT", "Italy"],
  ["FR", "France"],
  ["JP", "Japan"],
  ["CH", "Switzerland"],
  ["SG", "Singapore"],
  ["SA", "Saudi Arabia"],
];

const margins = [
  [0, 1000, 12, 1],
  [1001, 2500, 10, 2],
  [2501, 5000, 8, 3],
  [5000.01, null, 6, 4],
];

const handling = [
  [0, 0.5, 49],
  [0.5, 1, 69],
  [1, 2, 89],
  [2, 5, 129],
  [5, 10, 199],
  [10, 20, 299],
  [20, 30, 399],
];

const service = [
  [0, 0.5, 79],
  [0.5, 1, 99],
  [1, 2, 129],
  [2, 5, 179],
  [5, 10, 249],
  [10, 20, 349],
  [20, 30, 499],
];

const repacking = [
  [0, 0.5, 49],
  [0.5, 1, 69],
  [1, 2, 99],
  [2, 5, 149],
  [5, 10, 249],
  [10, 20, 399],
  [20, 30, 599],
];

async function clear(table) {
  const { error } = await db.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
  // settings uses integer id
  if (error && table !== "shipping_settings") {
    const { error: e2 } = await db.from(table).delete().gte("created_at", "1970-01-01");
    if (e2) console.log(`clear ${table}:`, e2.message);
  }
}

const { error: settingsError } = await db.from("shipping_settings").upsert({
  id: 1,
  shipping_markup_percent: 0,
  handling_fee_inr: 0,
  service_fee_inr: 0,
  gst_rate: 0,
  volumetric_divisor: 5000,
  tax_mode: "gst_none",
  economy_enabled: true,
  standard_enabled: true,
  express_enabled: false,
  final_price_round_to_inr: 10,
  currency: "INR",
  quote_validity_hours: 24,
  aramex_fuel_surcharge_percent: 23.25,
  base_rate_source: "admin_table",
});
console.log("settings:", settingsError?.message || "ok");

await clear("shipping_countries");
{
  const { error } = await db.from("shipping_countries").upsert(
    countries.map(([code, name]) => ({
      country_code: code,
      country_name: name,
      enabled: true,
    })),
  );
  console.log("countries:", error?.message || "ok");
}

await clear("shipping_margin_brackets");
{
  const { error } = await db.from("shipping_margin_brackets").insert(
    margins.map(([min, max, pct, sort]) => ({
      min_amount_inr: min,
      max_amount_inr: max,
      margin_percent: pct,
      sort_order: sort,
      active: true,
    })),
  );
  console.log("margins:", error?.message || "ok");
}

async function seedSlabs(table, rows) {
  await clear(table);
  const { error } = await db.from(table).insert(
    rows.map(([min, max, fee]) => ({
      min_kg: min,
      max_kg: max,
      fee_inr: fee,
      active: true,
    })),
  );
  console.log(`${table}:`, error?.message || "ok");
}

await seedSlabs("shipping_handling_fee_slabs", handling);
await seedSlabs("shipping_service_fee_slabs", service);
await seedSlabs("shipping_repacking_fee_slabs", repacking);

const { count: rates } = await db
  .from("aramex_base_rates")
  .select("*", { count: "exact", head: true });
console.log("aramex_base_rates still empty (by design):", rates ?? 0);
