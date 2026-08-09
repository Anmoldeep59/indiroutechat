import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth-server";
import { createNotification, notifyAdmins } from "@/lib/notifications";
import { SELECTABLE_PARCEL_STATUSES } from "@/lib/parcel-status";

export async function GET(request: Request) {
  const auth = await requireVerifiedUser(request);
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.db
    .from("consolidation_requests")
    .select(
      "id, status, customer_notes, notes, created_at, updated_at, active_quote_id, final_weight_kg, final_pieces, consolidation_request_parcels(parcel_id)",
    )
    .eq("profile_id", auth.profile.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Unable to load consolidation requests." },
      { status: 500 },
    );
  }

  const requests = (data ?? []).map((row) => ({
    id: row.id,
    status: row.status,
    customerNotes: row.customer_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    activeQuoteId: row.active_quote_id,
    finalWeightKg: row.final_weight_kg,
    finalPieces: row.final_pieces,
    parcelCount: Array.isArray(row.consolidation_request_parcels)
      ? row.consolidation_request_parcels.length
      : 0,
  }));

  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const auth = await requireVerifiedUser(request);
  if (!auth.ok) return auth.response;

  let body: { parcelIds?: string[]; customerNotes?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parcelIds = Array.from(
    new Set((body.parcelIds ?? []).map((id) => id.trim()).filter(Boolean)),
  );

  if (parcelIds.length < 1) {
    return NextResponse.json(
      { error: "Select at least one parcel." },
      { status: 400 },
    );
  }

  const { data: parcels, error: parcelsError } = await auth.db
    .from("parcels")
    .select("id, status, locker_id, reference_code")
    .eq("profile_id", auth.profile.id)
    .in("id", parcelIds);

  if (parcelsError || !parcels || parcels.length !== parcelIds.length) {
    return NextResponse.json(
      { error: "One or more parcels were not found on your account." },
      { status: 400 },
    );
  }

  for (const parcel of parcels) {
    if (
      !(SELECTABLE_PARCEL_STATUSES as readonly string[]).includes(parcel.status)
    ) {
      return NextResponse.json(
        {
          error: `Parcel ${parcel.reference_code ?? parcel.id} is not available for a quote request.`,
        },
        { status: 400 },
      );
    }
  }

  // Block parcels already in open requests
  const { data: locked } = await auth.db
    .from("consolidation_request_parcels")
    .select(
      "parcel_id, consolidation_requests!inner(id, status)",
    )
    .in("parcel_id", parcelIds);

  const blocked = (locked ?? []).filter((row) => {
    const req = row.consolidation_requests as unknown as {
      status: string;
    };
    return ["requested", "processing", "quoted", "awaiting_payment"].includes(
      req.status,
    );
  });

  if (blocked.length > 0) {
    return NextResponse.json(
      {
        error:
          "One or more selected parcels are already part of an open quote request.",
      },
      { status: 409 },
    );
  }

  const { data: locker } = await auth.db
    .from("lockers")
    .select("id, locker_code")
    .eq("profile_id", auth.profile.id)
    .maybeSingle();

  const { data: created, error: createError } = await auth.db
    .from("consolidation_requests")
    .insert({
      profile_id: auth.profile.id,
      locker_id: locker?.id ?? null,
      status: "requested",
      customer_notes: body.customerNotes?.trim() || null,
      notes: body.customerNotes?.trim() || null,
    })
    .select("id, status, created_at")
    .single();

  if (createError || !created) {
    return NextResponse.json(
      { error: "Unable to create quote request." },
      { status: 500 },
    );
  }

  const { error: linkError } = await auth.db
    .from("consolidation_request_parcels")
    .insert(
      parcelIds.map((parcelId) => ({
        consolidation_request_id: created.id,
        parcel_id: parcelId,
      })),
    );

  if (linkError) {
    await auth.db.from("consolidation_requests").delete().eq("id", created.id);
    return NextResponse.json(
      { error: "Unable to attach parcels to the request." },
      { status: 500 },
    );
  }

  await createNotification(auth.db, {
    profileId: auth.profile.id,
    title: "Quote request submitted",
    body: `We received your request for ${parcelIds.length} parcel${parcelIds.length === 1 ? "" : "s"}. Warehouse will prepare your quote.`,
    type: "quote_request_submitted",
  });

  await notifyAdmins(auth.db, {
    title: "New consolidation / quote request",
    body: `Locker ${locker?.locker_code ?? "N/A"} — ${parcelIds.length} parcel(s). Request ${created.id.slice(0, 8)}…`,
    type: "admin_quote_request",
  });

  return NextResponse.json(
    {
      request: {
        id: created.id,
        status: created.status,
        createdAt: created.created_at,
        parcelCount: parcelIds.length,
      },
    },
    { status: 201 },
  );
}
