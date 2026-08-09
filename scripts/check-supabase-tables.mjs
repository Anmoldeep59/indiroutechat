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
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing Supabase URL or service role key");
  process.exit(1);
}

const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const tables = [
  "aramex_base_rates",
  "shipping_settings",
  "shipping_countries",
  "shipping_margin_brackets",
  "shipping_handling_fee_slabs",
  "shipping_service_fee_slabs",
  "shipping_repacking_fee_slabs",
  "profiles",
];

for (const table of tables) {
  const { error, count } = await db
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) {
    console.log(`${table}: MISSING/ERROR — ${error.message}`);
  } else {
    console.log(`${table}: ok (count≈${count ?? 0})`);
  }
}
