import { NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";
import {
  ensureLockerForProfile,
  toCustomerLockerView,
  type LockerRecord,
} from "@/lib/lockers";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const idToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : null;

    if (!idToken) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const adminAuth = getFirebaseAdminAuth();
    if (!adminAuth) {
      return NextResponse.json(
        { error: "Authentication service is temporarily unavailable." },
        { status: 503 },
      );
    }

    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const db = getSupabaseAdmin();
    if (!db) {
      return NextResponse.json(
        { error: "Locker service is temporarily unavailable." },
        { status: 503 },
      );
    }

    const { data: profile, error: profileError } = await db
      .from("profiles")
      .select("id, first_name, last_name, email")
      .eq("firebase_uid", decoded.uid)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { error: "Unable to load your locker right now." },
        { status: 500 },
      );
    }

    if (!profile) {
      return NextResponse.json(
        {
          error:
            "Your profile is not ready yet. Please sign out and sign in again.",
        },
        { status: 404 },
      );
    }

    const { locker, error: lockerError } = await ensureLockerForProfile(
      db,
      profile.id,
    );

    if (lockerError || !locker) {
      return NextResponse.json(
        { error: "Unable to load your locker right now." },
        { status: 500 },
      );
    }

    const customerName =
      [profile.first_name, profile.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      profile.email ||
      "IndiRoute Customer";

    return NextResponse.json({
      locker: toCustomerLockerView(locker as LockerRecord, customerName),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load your locker right now." },
      { status: 500 },
    );
  }
}
