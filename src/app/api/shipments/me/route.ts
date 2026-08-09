import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth-server";

export async function GET(request: Request) {
  const auth = await requireVerifiedUser(request);
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.db
    .from("shipments")
    .select(
      "id, status, payment_status, selected_tier, service_type, shipping_cost, currency, parcel_count, weight_kg, delivery_full_name, delivery_city, delivery_country, paid_at, created_at, consolidation_request_id",
    )
    .eq("profile_id", auth.profile.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Unable to load shipments." },
      { status: 500 },
    );
  }

  return NextResponse.json({ shipments: data ?? [] });
}
