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
const client = new Client({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
const sql = fs.readFileSync(
  path.join("supabase", "migrations", "011_profiles_firebase_uid_compat.sql"),
  "utf8",
);
await client.query(sql);
const cols = await client.query(
  `select column_name from information_schema.columns where table_name = 'profiles' order by 1`,
);
console.log(cols.rows.map((r) => r.column_name).join(", "));
await client.end();
