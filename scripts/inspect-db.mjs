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
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

async function main() {
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const cols = await client.query(`
    select table_name, column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name in ('profiles', 'shipping_rates', 'shipping_quotes', 'lockers')
    order by table_name, ordinal_position
  `);
  console.log("--- columns ---");
  for (const row of cols.rows) {
    console.log(`${row.table_name}.${row.column_name}`);
  }

  const fns = await client.query(`
    select proname
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and proname like '%updated%'
  `);
  console.log("--- functions ---", fns.rows);

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
