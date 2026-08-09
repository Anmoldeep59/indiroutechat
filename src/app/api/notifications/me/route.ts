import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth-server";

export async function GET(request: Request) {
  const auth = await requireVerifiedUser(request);
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.db
    .from("notifications")
    .select("id, title, body, type, read_at, created_at")
    .eq("profile_id", auth.profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { error: "Unable to load notifications." },
      { status: 500 },
    );
  }

  return NextResponse.json({ notifications: data ?? [] });
}

export async function PATCH(request: Request) {
  const auth = await requireVerifiedUser(request);
  if (!auth.ok) return auth.response;

  let body: { ids?: string[]; markAllRead?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const now = new Date().toISOString();

  if (body.markAllRead) {
    await auth.db
      .from("notifications")
      .update({ read_at: now })
      .eq("profile_id", auth.profile.id)
      .is("read_at", null);
  } else if (body.ids?.length) {
    await auth.db
      .from("notifications")
      .update({ read_at: now })
      .eq("profile_id", auth.profile.id)
      .in("id", body.ids);
  }

  return NextResponse.json({ ok: true });
}
