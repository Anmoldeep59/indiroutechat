import fs from "node:fs";

const t = fs.readFileSync(".env.local", "utf8");
const keys = [
  "FIREBASE_ADMIN_PRIVATE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "FIREBASE_ADMIN_CLIENT_EMAIL",
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
];

for (const key of keys) {
  const re = new RegExp(`^${key}=(.*)$`, "m");
  const m = t.match(re);
  const v = m?.[1] ?? "";
  const empty = !v.trim() || v.trim() === '""' || v.trim() === "''";
  console.log(
    `${key}: ${empty ? "EMPTY" : `SET (len=${v.length}${v.includes("BEGIN") ? ", pem" : ""})`}`,
  );
}
