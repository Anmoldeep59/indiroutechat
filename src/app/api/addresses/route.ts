import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth-server";

export async function GET(request: Request) {
  const auth = await requireVerifiedUser(request);
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.db
    .from("addresses")
    .select("*")
    .eq("profile_id", auth.profile.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Unable to load addresses." },
      { status: 500 },
    );
  }

  return NextResponse.json({ addresses: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireVerifiedUser(request);
  if (!auth.ok) return auth.response;

  let body: {
    fullName?: string;
    phone?: string;
    email?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    deliveryInstructions?: string;
    saveToProfile?: boolean;
    isDefault?: boolean;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body.saveToProfile) {
    return NextResponse.json({
      address: {
        fullName: body.fullName?.trim(),
        phone: body.phone?.trim(),
        email: body.email?.trim(),
        line1: body.line1?.trim(),
        line2: body.line2?.trim() || null,
        city: body.city?.trim(),
        state: body.state?.trim() || null,
        postal_code: body.postalCode?.trim(),
        country: body.country?.trim(),
        deliveryInstructions: body.deliveryInstructions?.trim() || null,
      },
    });
  }

  if (
    !body.fullName?.trim() ||
    !body.line1?.trim() ||
    !body.city?.trim() ||
    !body.postalCode?.trim() ||
    !body.country?.trim()
  ) {
    return NextResponse.json(
      { error: "Name, address line 1, city, postcode, and country are required." },
      { status: 400 },
    );
  }

  if (body.isDefault) {
    await auth.db
      .from("addresses")
      .update({ is_default: false })
      .eq("profile_id", auth.profile.id);
  }

  const { data, error } = await auth.db
    .from("addresses")
    .insert({
      profile_id: auth.profile.id,
      label: body.fullName.trim(),
      line1: body.line1.trim(),
      line2: body.line2?.trim() || null,
      city: body.city.trim(),
      state: body.state?.trim() || null,
      postal_code: body.postalCode.trim(),
      country: body.country.trim(),
      is_default: Boolean(body.isDefault),
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Unable to save address." },
      { status: 500 },
    );
  }

  return NextResponse.json({ address: data }, { status: 201 });
}
