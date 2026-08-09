import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth-server";

export async function GET(request: Request) {
  const auth = await requireAdminUser(request);
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.db
    .from("shipments")
    .select(
      "id, status, payment_status, selected_tier, service_type, shipping_cost, currency, parcel_count, weight_kg, length_cm, width_cm, height_cm, delivery_full_name, delivery_line1, delivery_line2, delivery_city, delivery_state, delivery_postal_code, delivery_country, delivery_phone, paid_at, created_at, profile_id, consolidation_request_id, quote_id, profiles(first_name, last_name, email), shipment_parcels(parcel_id, parcels(reference_code))",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { error: "Unable to load shipments." },
      { status: 500 },
    );
  }

  const shipments = await Promise.all(
    (data ?? []).map(async (row) => {
      const profile = row.profiles as unknown as {
        first_name: string | null;
        last_name: string | null;
        email: string | null;
      } | null;
      const { data: locker } = await auth.db
        .from("lockers")
        .select("locker_code")
        .eq("profile_id", row.profile_id)
        .maybeSingle();

      return {
        id: row.id,
        status: row.status,
        paymentStatus: row.payment_status,
        selectedTier: row.selected_tier ?? row.service_type,
        shippingCost: row.shipping_cost,
        currency: row.currency,
        parcelCount: row.parcel_count,
        weightKg: row.weight_kg,
        lengthCm: row.length_cm,
        widthCm: row.width_cm,
        heightCm: row.height_cm,
        delivery: {
          fullName: row.delivery_full_name,
          line1: row.delivery_line1,
          line2: row.delivery_line2,
          city: row.delivery_city,
          state: row.delivery_state,
          postalCode: row.delivery_postal_code,
          country: row.delivery_country,
          phone: row.delivery_phone,
        },
        paidAt: row.paid_at,
        createdAt: row.created_at,
        customerName: [profile?.first_name, profile?.last_name]
          .filter(Boolean)
          .join(" ")
          .trim(),
        email: profile?.email ?? null,
        lockerCode: locker?.locker_code ?? null,
        parcelRefs: (
          (row.shipment_parcels as unknown as Array<{
            parcels: { reference_code: string } | null;
          }>) ?? []
        )
          .map((p) => p.parcels?.reference_code)
          .filter(Boolean),
      };
    }),
  );

  return NextResponse.json({ shipments });
}
