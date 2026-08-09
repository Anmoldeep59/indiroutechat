import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth-server";

export async function GET(request: Request) {
  const auth = await requireAdminUser(request);
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.db
    .from("consolidation_requests")
    .select(
      "id, status, created_at, updated_at, customer_notes, final_weight_kg, final_pieces, active_quote_id, profile_id, locker_id, profiles(first_name, last_name, email), lockers(locker_code), consolidation_request_parcels(parcel_id)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { error: "Unable to load consolidation requests." },
      { status: 500 },
    );
  }

  const requests = (data ?? []).map((row) => {
    const profile = row.profiles as unknown as {
      first_name: string | null;
      last_name: string | null;
      email: string | null;
    } | null;
    const locker = row.lockers as unknown as { locker_code: string } | null;
    return {
      id: row.id,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      customerNotes: row.customer_notes,
      finalWeightKg: row.final_weight_kg,
      finalPieces: row.final_pieces,
      activeQuoteId: row.active_quote_id,
      parcelCount: Array.isArray(row.consolidation_request_parcels)
        ? row.consolidation_request_parcels.length
        : 0,
      customerName: [profile?.first_name, profile?.last_name]
        .filter(Boolean)
        .join(" ")
        .trim(),
      email: profile?.email ?? null,
      lockerCode: locker?.locker_code ?? null,
    };
  });

  return NextResponse.json({ requests });
}
