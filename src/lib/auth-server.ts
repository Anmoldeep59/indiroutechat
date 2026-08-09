import { NextResponse } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type AuthProfile = {
  id: string;
  firebase_uid: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: string;
};

function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

export async function requireVerifiedUser(request: Request): Promise<
  | {
      ok: true;
      db: SupabaseClient;
      decoded: DecodedIdToken;
      profile: AuthProfile;
    }
  | { ok: false; response: NextResponse }
> {
  const idToken = getBearerToken(request);
  if (!idToken) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  const adminAuth = getFirebaseAdminAuth();
  if (!adminAuth) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Authentication service is temporarily unavailable." },
        { status: 503 },
      ),
    };
  }

  let decoded: DecodedIdToken;
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  const db = getSupabaseAdmin();
  if (!db) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Service temporarily unavailable." },
        { status: 503 },
      ),
    };
  }

  const { data: profile, error } = await db
    .from("profiles")
    .select("id, firebase_uid, first_name, last_name, email, role")
    .eq("firebase_uid", decoded.uid)
    .maybeSingle();

  if (error || !profile) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Profile not found." },
        { status: 404 },
      ),
    };
  }

  return {
    ok: true,
    db,
    decoded,
    profile: profile as AuthProfile,
  };
}

export async function requireAdminUser(request: Request) {
  const result = await requireVerifiedUser(request);
  if (!result.ok) return result;

  if (result.profile.role !== "admin") {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden." }, { status: 403 }),
    };
  }

  return result;
}
