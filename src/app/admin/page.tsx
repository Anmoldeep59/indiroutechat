export default function AdminOverviewPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(12,35,64,0.04)] sm:p-8">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          Admin Overview
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-brand sm:text-3xl">
          Operations console
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-muted sm:text-base">
          Manage customers, lockers, parcels, shipments, payments, and shipping
          rates. Live operational metrics will appear here as data flows in.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {["Customers", "Parcels", "Shipments", "Payments"].map((label) => (
          <article
            key={label}
            className="rounded-xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(12,35,64,0.04)]"
          >
            <h2 className="font-display text-sm font-semibold text-brand">
              {label}
            </h2>
            <p className="mt-3 font-display text-3xl font-bold text-brand">—</p>
            <p className="mt-2 text-sm text-brand-muted">Awaiting live data</p>
          </article>
        ))}
      </div>
    </section>
  );
}
