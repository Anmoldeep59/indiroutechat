import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

function loadEnvLocal() {
  const file = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const i = line.indexOf("=");
        return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
      }),
  );
}

const env = loadEnvLocal();
const url = process.env.DATABASE_URL || env.DATABASE_URL;
if (!url) {
  console.error("Missing DATABASE_URL in .env.local");
  process.exit(1);
}

const files = [
  "001_create_profiles.sql",
  "002_create_core_schema.sql",
  "003_rls_shipping_rates_and_profiles.sql",
  "004_locker_assignment.sql",
  "005_parcel_sender_name.sql",
  "006_shipping_calculator.sql",
  "007_consolidation_quote_payments.sql",
  "008_aramex_pricing_architecture.sql",
  "009_aramex_fees_and_margins.sql",
];

async function main() {
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log("Connected.");

  for (const file of files) {
    const full = path.join("supabase", "migrations", file);
    if (!fs.existsSync(full)) {
      console.log(`Skip missing ${file}`);
      continue;
    }
    const sql = fs.readFileSync(full, "utf8");
    process.stdout.write(`Applying ${file} ... `);
    try {
      await client.query(sql);
      console.log("OK");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log("ERR", message.split("\n")[0]);
    }
  }

  const after = await client.query(`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and (
        table_name like 'shipping%'
        or table_name like 'aramex%'
        or table_name in ('profiles', 'parcels', 'lockers')
      )
    order by 1
  `);
  console.log("tables:", after.rows.map((r) => r.table_name).join(", "));

  try {
    const rates = await client.query(
      "select count(*)::int as n from aramex_base_rates",
    );
    console.log("aramex_base_rates rows:", rates.rows[0].n);
  } catch {
    console.log("aramex_base_rates: missing");
  }

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
