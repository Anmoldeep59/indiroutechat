/**
 * Creates/verifies the Firebase Auth user only.
 * Then print SQL to promote the profile after first login/sync.
 */
import fs from "node:fs";
import path from "node:path";

function loadEnvLocal() {
  const envPath = path.resolve(".env.local");
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env) || !process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || "";
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (!email || !password || !apiKey) {
  console.error("Need ADMIN_EMAIL, ADMIN_PASSWORD, NEXT_PUBLIC_FIREBASE_API_KEY");
  process.exit(1);
}

const signUpRes = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  },
);
const signUp = await signUpRes.json();

let uid = signUp.localId;
if (signUpRes.ok) {
  console.log("Created Firebase user.");
} else if (signUp.error?.message === "EMAIL_EXISTS") {
  const signInRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  const signIn = await signInRes.json();
  if (!signInRes.ok) {
    console.error(
      "User exists but password did not match:",
      signIn.error?.message,
    );
    process.exit(1);
  }
  uid = signIn.localId;
  console.log("Firebase user already exists; password verified.");
} else {
  console.error("Firebase error:", signUp.error?.message || signUp);
  process.exit(1);
}

console.log("Firebase UID:", uid);
console.log("");
console.log("Next: sign in once at /login so profile sync runs, then in Supabase SQL Editor run:");
console.log(`
update public.profiles
set role = 'admin',
    first_name = 'IndiRoute',
    last_name = 'Admin',
    email = '${email}'
where firebase_uid = '${uid}'
   or lower(email) = '${email}';

insert into public.admin_users (profile_id, notes)
select id, 'Primary IndiRoute admin'
from public.profiles
where firebase_uid = '${uid}' or lower(email) = '${email}'
on conflict (profile_id) do update
set notes = excluded.notes;
`);
