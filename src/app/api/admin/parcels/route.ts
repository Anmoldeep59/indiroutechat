import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth-server";
import { createNotification } from "@/lib/notifications";

type CreateParcelBody = {
  profileId?: string;
  lockerId?: string | null;
  referenceCode?: string | null;
  carrier?: string | null;
  trackingNumber?: string | null;
  senderName?: string | null;
  description?: string | null;
  weightKg?: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  receivedAt?: string | null;
  notes?: string | null;
  photoUrl?: string | null;
};

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export async function POST(request: Request) {
  const auth = await requireAdminUser(request);
  if (!auth.ok) return auth.response;

  let body: CreateParcelBody;
  try {
    body = (await request.json()) as CreateParcelBody;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const profileId = body.profileId?.trim();
  if (!profileId) {
    return NextResponse.json(
      { error: "Please select a customer." },
      { status: 400 },
    );
  }

  const { data: profile, error: profileError } = await auth.db
    .from("profiles")
    .select("id, role, first_name, last_name")
    .eq("id", profileId)
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Selected customer was not found." },
      { status: 400 },
    );
  }

  if (profile.role !== "customer") {
    return NextResponse.json(
      { error: "Parcels can only be assigned to customer accounts." },
      { status: 400 },
    );
  }

  let lockerId = body.lockerId?.trim() || null;

  if (lockerId) {
    const { data: locker, error: lockerError } = await auth.db
      .from("lockers")
      .select("id, profile_id")
      .eq("id", lockerId)
      .maybeSingle();

    if (lockerError || !locker || locker.profile_id !== profileId) {
      return NextResponse.json(
        { error: "Selected locker does not belong to this customer." },
        { status: 400 },
      );
    }
  } else {
    const { data: locker } = await auth.db
      .from("lockers")
      .select("id")
      .eq("profile_id", profileId)
      .maybeSingle();
    lockerId = locker?.id ?? null;
  }

  const { data: referenceCode, error: refError } = await auth.db.rpc(
    "next_parcel_reference",
  );

  if (refError || !referenceCode) {
    return NextResponse.json(
      { error: "Unable to allocate a parcel reference." },
      { status: 500 },
    );
  }

  const receivedAt = body.receivedAt
    ? new Date(body.receivedAt)
    : new Date();
  if (Number.isNaN(receivedAt.getTime())) {
    return NextResponse.json(
      { error: "Invalid received date." },
      { status: 400 },
    );
  }

  const freeStorageEnds = new Date(receivedAt);
  freeStorageEnds.setDate(freeStorageEnds.getDate() + 20);

  const insertPayload = {
    profile_id: profileId,
    locker_id: lockerId,
    reference_code: String(referenceCode),
    carrier: body.carrier?.trim() || null,
    inbound_tracking_number: body.trackingNumber?.trim() || null,
    sender_name: body.senderName?.trim() || null,
    description: body.description?.trim() || null,
    weight_kg: toNullableNumber(body.weightKg),
    length_cm: toNullableNumber(body.lengthCm),
    width_cm: toNullableNumber(body.widthCm),
    height_cm: toNullableNumber(body.heightCm),
    notes: body.notes?.trim() || null,
    photo_url: body.photoUrl?.trim() || null,
    status: "warehouse_received",
    received_at: receivedAt.toISOString(),
    free_storage_ends_at: freeStorageEnds.toISOString(),
  };

  const { data: parcel, error } = await auth.db
    .from("parcels")
    .insert(insertPayload)
    .select(
      "id, reference_code, status, received_at, inbound_tracking_number, description, sender_name",
    )
    .single();

  if (error || !parcel) {
    return NextResponse.json(
      { error: "Unable to create the parcel record right now." },
      { status: 500 },
    );
  }

  await auth.db.from("audit_logs").insert({
    actor_profile_id: auth.profile.id,
    action: "parcel.received",
    entity_type: "parcel",
    entity_id: parcel.id,
    metadata: {
      profile_id: profileId,
      locker_id: lockerId,
      tracking_number: insertPayload.inbound_tracking_number,
      reference_code: insertPayload.reference_code,
    },
  });

  await createNotification(auth.db, {
    profileId,
    title: "Parcel received at IndiRoute",
    body: `${parcel.reference_code}${
      parcel.description ? ` — ${parcel.description}` : ""
    } is now in your locker.`,
    type: "parcel_received",
  });

  return NextResponse.json({ parcel }, { status: 201 });
}
