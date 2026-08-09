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

async function main() {
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const sql = fs.readFileSync(
    path.join(
      "supabase",
      "migrations",
      "010_bootstrap_aramex_pricing_on_legacy_db.sql",
    ),
    "utf8",
  );

  await client.query(sql);
  console.log("Bootstrap pricing schema applied.");

  const check = await client.query(`
    select
      (select count(*) from shipping_settings) as settings,
      (select count(*) from shipping_countries) as countries,
      (select count(*) from shipping_margin_brackets) as margins,
      (select count(*) from shipping_handling_fee_slabs) as handling,
      (select count(*) from shipping_service_fee_slabs) as service,
      (select count(*) from shipping_repacking_fee_slabs) as repacking,
      (select count(*) from aramex_base_rates) as aramex_rates
  `);
  console.log(check.rows[0]);
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
