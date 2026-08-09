import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  return Object.fromEntries(
    fs
      .readFileSync(".env.local", "utf8")
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
console.log("url", env.NEXT_PUBLIC_SUPABASE_URL);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

for (const table of [
  "aramex_base_rates",
  "shipping_settings",
  "shipping_countries",
  "profiles",
]) {
  const result = await db.from(table).select("*").limit(1);
  console.log(
    table,
    result.error
      ? `ERROR ${result.error.code || ""} ${result.error.message}`
      : `OK rows=${result.data?.length ?? 0}`,
  );
}
