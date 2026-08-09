import { NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type SyncBody = {
  idToken?: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  country?: string | null;
  avatarUrl?: string | null;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SyncBody;
    const idToken = body.idToken?.trim();

    if (!idToken) {
      return NextResponse.json(
        { error: "Missing authentication token." },
        { status: 401 },
      );
    }

    const adminAuth = getFirebaseAdminAuth();
    if (!adminAuth) {
      return NextResponse.json(
        {
          error:
            "Server authentication is not configured yet. Add Firebase Admin credentials to continue profile sync.",
        },
        { status: 503 },
      );
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const db = getSupabaseAdmin();

    if (!db) {
      return NextResponse.json(
        {
          error:
            "Supabase service role is not configured. Add SUPABASE_SERVICE_ROLE_KEY to continue profile sync.",
        },
        { status: 503 },
      );
    }

    const payload = {
      firebase_uid: decoded.uid,
      email: decoded.email ?? null,
      first_name: body.firstName ?? null,
      last_name: body.lastName ?? null,
      phone: body.phone ?? null,
      country: body.country ?? null,
      avatar_url: body.avatarUrl ?? decoded.picture ?? null,
    };

    const { data, error } = await db
      .from("profiles")
      .upsert(payload, { onConflict: "firebase_uid" })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to sync profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
