import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth-server";
import { INCOMING_PARCEL_STATUSES } from "@/lib/parcel-status";

export async function GET(request: Request) {
  const auth = await requireVerifiedUser(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const countOnly = searchParams.get("count") === "incoming";

  if (countOnly) {
    const { count, error } = await auth.db
      .from("parcels")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", auth.profile.id)
      .in("status", [...INCOMING_PARCEL_STATUSES]);

    if (error) {
      return NextResponse.json(
        { error: "Unable to load parcel count." },
        { status: 500 },
      );
    }

    return NextResponse.json({ count: count ?? 0 });
  }

  const { data, error } = await auth.db
    .from("parcels")
    .select(
      "id, reference_code, description, carrier, inbound_tracking_number, sender_name, weight_kg, length_cm, width_cm, height_cm, photo_url, received_at, status, created_at",
    )
    .eq("profile_id", auth.profile.id)
    .order("received_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Unable to load your parcels right now." },
      { status: 500 },
    );
  }

  return NextResponse.json({ parcels: data ?? [] });
}
