import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdminUser } from "@/lib/auth-server";

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  lockers: { id: string; locker_code: string }[] | null;
};

type CustomerResult = {
  profileId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  lockerId: string | null;
  lockerCode: string | null;
  parcelCount: number;
};

function mapCustomer(
  profile: ProfileRow,
  parcelCount = 0,
): CustomerResult {
  const locker = profile.lockers?.[0] ?? null;
  return {
    profileId: profile.id,
    firstName: profile.first_name,
    lastName: profile.last_name,
    email: profile.email,
    phone: profile.phone,
    lockerId: locker?.id ?? null,
    lockerCode: locker?.locker_code ?? null,
    parcelCount,
  };
}

async function attachParcelCounts(
  db: SupabaseClient,
  customers: CustomerResult[],
): Promise<CustomerResult[]> {
  if (customers.length === 0) return customers;
  const ids = customers.map((c) => c.profileId);
  const { data } = await db
    .from("parcels")
    .select("profile_id")
    .in("profile_id", ids)
    .in("status", [
      "warehouse_received",
      "inspection",
      "ready_for_consolidation",
      "in_process",
      "packed",
      "payment_pending",
      "ready_to_ship",
    ]);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const id = String(row.profile_id);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return customers.map((customer) => ({
    ...customer,
    parcelCount: counts.get(customer.profileId) ?? 0,
  }));
}

export async function GET(request: Request) {
  const auth = await requireAdminUser(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (q.length < 2) {
    return NextResponse.json({ customers: [] });
  }

  const exactLocker = q.toUpperCase();
  const customers = new Map<string, CustomerResult>();

  // Fast path: exact / prefix locker ID match
  const { data: lockerHits } = await auth.db
    .from("lockers")
    .select(
      "id, locker_code, profile_id, profiles!inner(id, first_name, last_name, email, phone, role)",
    )
    .or(`locker_code.eq.${exactLocker},locker_code.ilike.${exactLocker}%`)
    .limit(20);

  for (const row of lockerHits ?? []) {
    const profile = row.profiles as unknown as ProfileRow;
    if (profile.role !== "customer") continue;
    customers.set(profile.id, {
      profileId: profile.id,
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: profile.email,
      phone: profile.phone,
      lockerId: row.id,
      lockerCode: row.locker_code,
      parcelCount: 0,
    });
  }

  const pattern = `%${q.replace(/[%_]/g, "\\$&")}%`;

  const { data: byProfile, error: profileError } = await auth.db
    .from("profiles")
    .select(
      "id, first_name, last_name, email, phone, role, lockers(id, locker_code)",
    )
    .eq("role", "customer")
    .or(
      `email.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern},phone.ilike.${pattern}`,
    )
    .limit(20);

  if (profileError) {
    return NextResponse.json(
      { error: "Unable to search customers right now." },
      { status: 500 },
    );
  }

  for (const profile of (byProfile as ProfileRow[] | null) ?? []) {
    if (!customers.has(profile.id)) {
      customers.set(profile.id, mapCustomer(profile));
    }
  }

  // Broader locker contains search
  const { data: byLocker } = await auth.db
    .from("lockers")
    .select(
      "id, locker_code, profile_id, profiles!inner(id, first_name, last_name, email, phone, role)",
    )
    .ilike("locker_code", pattern)
    .limit(20);

  for (const row of byLocker ?? []) {
    const profile = row.profiles as unknown as ProfileRow;
    if (profile.role !== "customer") continue;
    customers.set(profile.id, {
      profileId: profile.id,
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: profile.email,
      phone: profile.phone,
      lockerId: row.id,
      lockerCode: row.locker_code,
      parcelCount: 0,
    });
  }

  const withCounts = await attachParcelCounts(
    auth.db,
    Array.from(customers.values()),
  );

  // Exact locker ID first
  withCounts.sort((a, b) => {
    const aExact = a.lockerCode?.toUpperCase() === exactLocker ? 0 : 1;
    const bExact = b.lockerCode?.toUpperCase() === exactLocker ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;
    return (a.lockerCode ?? "").localeCompare(b.lockerCode ?? "");
  });

  return NextResponse.json({ customers: withCounts });
}
