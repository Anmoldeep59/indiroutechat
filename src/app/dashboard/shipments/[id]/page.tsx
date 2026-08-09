"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

function ShipmentDetailInner() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const cancelled = searchParams.get("payment") === "cancelled";

  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-8">
      <h1 className="font-display text-2xl font-bold text-brand">
        Shipment {String(params.id).slice(0, 8)}…
      </h1>
      {cancelled ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Stripe Checkout was cancelled. Your order is still unpaid — you can
          return to the quote and try Pay Now again.
        </p>
      ) : (
        <p className="mt-4 text-sm text-brand-muted">
          Open your consolidation request for full quote and payment details.
        </p>
      )}
      <Link
        href="/dashboard/shipments"
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-brand px-5 text-sm font-semibold text-white"
      >
        All shipments
      </Link>
    </section>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-brand-muted">Loading…</p>}>
      <ShipmentDetailInner />
    </Suspense>
  );
}
