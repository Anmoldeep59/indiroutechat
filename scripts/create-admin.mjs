/**
 * Create (or update) a Firebase Auth user and mark their Supabase profile as admin.
 *
 * Usage (PowerShell):
 *   $env:ADMIN_EMAIL="admin@indiroute.co"
 *   $env:ADMIN_PASSWORD="your-password"
 *   $env:ADMIN_FIRST_NAME="IndiRoute"
 *   $env:ADMIN_LAST_NAME="Admin"
 *   node scripts/create-admin.mjs
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_FIREBASE_API_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 * Optional (better): Firebase Admin credentials to set emailVerified / reset password.
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

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
    value = value.replace(/\\n/g, "\n");
    if (!(key in process.env) || !process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || "";
const firstName = process.env.ADMIN_FIRST_NAME || "IndiRoute";
const lastName = process.env.ADMIN_LAST_NAME || "Admin";

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email || !password) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD env vars.");
  process.exit(1);
}

if (!apiKey) {
  console.error("Missing NEXT_PUBLIC_FIREBASE_API_KEY in .env.local");
  process.exit(1);
}

if (!supabaseUrl || !serviceRole) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

async function ensureFirebaseUser() {
  // Try sign-up first
  const signUpRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    },
  );
  const signUp = await signUpRes.json();

  if (signUpRes.ok && signUp.localId) {
    console.log("Created Firebase user:", signUp.localId);
    return { uid: signUp.localId, idToken: signUp.idToken };
  }

  if (signUp.error?.message === "EMAIL_EXISTS") {
    const signInRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      },
    );
    const signIn = await signInRes.json();
    if (!signInRes.ok) {
      throw new Error(
        `Firebase user exists but password sign-in failed: ${signIn.error?.message || "unknown"}`,
      );
    }
    console.log("Firebase user already exists:", signIn.localId);
    return { uid: signIn.localId, idToken: signIn.idToken };
  }

  throw new Error(
    `Firebase sign-up failed: ${signUp.error?.message || JSON.stringify(signUp)}`,
  );
}

async function upsertAdminProfile(uid) {
  const db = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existing, error: findError } = await db
    .from("profiles")
    .select("id, role, email")
    .eq("firebase_uid", uid)
    .maybeSingle();

  if (findError) {
    throw new Error(`Supabase profile lookup failed: ${findError.message}`);
  }

  if (existing) {
    const { error } = await db
      .from("profiles")
      .update({
        role: "admin",
        email,
        first_name: firstName,
        last_name: lastName,
      })
      .eq("id", existing.id);
    if (error) throw new Error(`Failed to promote profile: ${error.message}`);

    await db.from("admin_users").upsert(
      { profile_id: existing.id, notes: "Primary IndiRoute admin" },
      { onConflict: "profile_id" },
    );

    console.log("Updated existing profile to admin:", existing.id);
    return existing.id;
  }

  const { data: created, error: insertError } = await db
    .from("profiles")
    .insert({
      firebase_uid: uid,
      email,
      first_name: firstName,
      last_name: lastName,
      role: "admin",
    })
    .select("id")
    .single();

  if (insertError || !created) {
    throw new Error(
      `Failed to create admin profile: ${insertError?.message || "unknown"}`,
    );
  }

  await db.from("admin_users").upsert(
    { profile_id: created.id, notes: "Primary IndiRoute admin" },
    { onConflict: "profile_id" },
  );

  console.log("Created admin profile:", created.id);
  return created.id;
}

const { uid } = await ensureFirebaseUser();
await upsertAdminProfile(uid);
console.log(`Done. Sign in at /login with ${email} then open /admin`);
