import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  createShippingQuote,
  parseQuoteRequestBody,
  QuoteBuildError,
  toPublicQuote,
} from "@/lib/shipping/quote";

export async function POST(request: Request) {
  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json(
      { error: "Shipping service is temporarily unavailable." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const input = parseQuoteRequestBody(body);
    const quote = await createShippingQuote(db, input);
    return NextResponse.json({ quote: toPublicQuote(quote) });
  } catch (error) {
    if (error instanceof QuoteBuildError) {
      const status =
        error.code === "pricing_safety"
          ? 500
          : error.code === "missing_rates"
            ? 404
            : 400;
      if (error.code === "pricing_safety") {
        console.error("[shipping/quote] pricing safety failure", error.message);
      }
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status },
      );
    }

    console.error("[shipping/quote] unexpected error", error);
    return NextResponse.json(
      { error: "Unable to calculate shipping." },
      { status: 500 },
    );
  }
}
