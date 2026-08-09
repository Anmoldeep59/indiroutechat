import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth-server";
import { createNotification } from "@/lib/notifications";

type RouteContext = { params: Promise<{ id: string }> };

const ALLOWED = [
  "ready_to_ship",
  "shipped",
  "in_transit",
  "delivered",
  "cancelled",
] as const;

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminUser(request);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  let body: { status?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body.status || !(ALLOWED as readonly string[]).includes(body.status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const { data: shipment } = await auth.db
    .from("shipments")
    .select("id, profile_id, payment_status, status")
    .eq("id", id)
    .maybeSingle();

  if (!shipment) {
    return NextResponse.json({ error: "Shipment not found." }, { status: 404 });
  }

  if (
    shipment.payment_status !== "paid" &&
    body.status !== "cancelled"
  ) {
    return NextResponse.json(
      { error: "Shipment must be paid before status updates." },
      { status: 400 },
    );
  }

  const update: Record<string, unknown> = { status: body.status };
  if (body.status === "shipped") update.shipped_at = new Date().toISOString();
  if (body.status === "delivered") {
    update.delivered_at = new Date().toISOString();
  }

  const { error } = await auth.db
    .from("shipments")
    .update(update)
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Unable to update shipment." },
      { status: 500 },
    );
  }

  if (body.status === "shipped") {
    await createNotification(auth.db, {
      profileId: shipment.profile_id,
      title: "Shipment shipped",
      body: `Shipment ${id.slice(0, 8)}… is on its way.`,
      type: "shipment_shipped",
    });
  }

  if (body.status === "delivered") {
    await createNotification(auth.db, {
      profileId: shipment.profile_id,
      title: "Shipment delivered",
      body: `Shipment ${id.slice(0, 8)}… has been delivered.`,
      type: "shipment_delivered",
    });
  }

  if (body.status === "in_transit") {
    await createNotification(auth.db, {
      profileId: shipment.profile_id,
      title: "Shipment in transit",
      body: `Shipment ${id.slice(0, 8)}… is in transit.`,
      type: "shipment_in_transit",
    });
  }

  return NextResponse.json({ ok: true, status: body.status });
}
