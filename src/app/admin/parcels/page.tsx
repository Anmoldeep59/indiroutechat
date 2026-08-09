import { Suspense } from "react";
import { ReceiveParcelForm } from "@/components/admin/ReceiveParcelForm";

export default function AdminParcelsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(12,35,64,0.04)] sm:p-8">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          Admin
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-brand">
          Parcels
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-muted">
          Receive inbound packages into customer lockers when they arrive at the
          IndiRoute warehouse.
        </p>
      </section>

      <Suspense fallback={<p className="text-sm text-brand-muted">Loading form…</p>}>
        <ReceiveParcelForm />
      </Suspense>
    </div>
  );
}
