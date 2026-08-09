import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth-server";

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: string;
  lockers: { id: string; locker_code: string }[] | null;
};

function mapCustomer(profile: ProfileRow) {
  const locker = profile.lockers?.[0] ?? null;
  return {
    profileId: profile.id,
    firstName: profile.first_name,
    lastName: profile.last_name,
    email: profile.email,
    lockerId: locker?.id ?? null,
    lockerCode: locker?.locker_code ?? null,
  };
}

export async function GET(request: Request) {
  const auth = await requireAdminUser(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (q.length < 2) {
    return NextResponse.json({ customers: [] });
  }

  const pattern = `%${q.replace(/[%_]/g, "\\$&")}%`;

  const { data: byProfile, error: profileError } = await auth.db
    .from("profiles")
    .select("id, first_name, last_name, email, role, lockers(id, locker_code)")
    .eq("role", "customer")
    .or(
      `email.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern}`,
    )
    .limit(20);

  if (profileError) {
    return NextResponse.json(
      { error: "Unable to search customers right now." },
      { status: 500 },
    );
  }

  const customers = new Map(
    ((byProfile as ProfileRow[] | null) ?? []).map((profile) => [
      profile.id,
      mapCustomer(profile),
    ]),
  );

  const { data: byLocker } = await auth.db
    .from("lockers")
    .select(
      "id, locker_code, profile_id, profiles!inner(id, first_name, last_name, email, role)",
    )
    .ilike("locker_code", pattern)
    .limit(20);

  for (const row of byLocker ?? []) {
    const profile = row.profiles as unknown as {
      id: string;
      first_name: string | null;
      last_name: string | null;
      email: string | null;
      role: string;
    };

    if (profile.role !== "customer") continue;

    customers.set(profile.id, {
      profileId: profile.id,
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: profile.email,
      lockerId: row.id,
      lockerCode: row.locker_code,
    });
  }

  return NextResponse.json({
    customers: Array.from(customers.values()),
  });
}
