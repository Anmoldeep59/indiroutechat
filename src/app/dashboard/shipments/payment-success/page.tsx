"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function PaymentSuccessInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const note = sessionId
    ? "If payment succeeded, your shipment will show as paid once Stripe confirms via webhook."
    : "Payment session missing. If you paid, check Shipments shortly.";

  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-8 text-center">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-accent">
        Payment
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold text-brand">
        Payment Successful
      </h1>
      <p className="mt-4 text-base text-brand-muted">
        Your shipment is being prepared for dispatch.
      </p>
      <p className="mt-3 text-sm text-brand-muted">{note}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/dashboard/shipments"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-5 text-sm font-semibold text-white"
        >
          View shipments
        </Link>
        <Link
          href="/dashboard/parcels"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-5 text-sm font-semibold text-brand"
        >
          Back to parcels
        </Link>
      </div>
    </section>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-brand-muted">Loading…</p>}>
      <PaymentSuccessInner />
    </Suspense>
  );
}
