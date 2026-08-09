import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth-server";

/** Lightweight admin session check for AdminGate (service-role, not anon RLS). */
export async function GET(request: Request) {
  const auth = await requireAdminUser(request);
  if (!auth.ok) return auth.response;

  return NextResponse.json({
    ok: true,
    profile: {
      id: auth.profile.id,
      email: auth.profile.email,
      role: auth.profile.role,
      firstName: auth.profile.first_name,
      lastName: auth.profile.last_name,
    },
  });
}
