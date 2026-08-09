"use client";

import { useAuthState } from "@/hooks/useAuthState";

export function DashboardOverview() {
  const { user } = useAuthState();
  const displayName = user?.displayName?.trim() || "there";

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(12,35,64,0.04)] sm:p-7">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          Overview
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-brand sm:text-3xl">
          Welcome back, {displayName}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-muted sm:text-base">
          Manage your India warehouse address, parcels, and shipments from one
          place. Detailed locker data will appear here as you start receiving
          packages.
        </p>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(12,35,64,0.04)]">
          <h3 className="font-display text-sm font-semibold text-brand">
            My India Address
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-brand-muted">
            Your personal IndiRoute warehouse address will appear here after
            locker assignment.
          </p>
          <p className="mt-4 font-display text-xs font-semibold uppercase tracking-wide text-accent">
            Pending assignment
          </p>
        </article>

        <article className="rounded-xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(12,35,64,0.04)]">
          <h3 className="font-display text-sm font-semibold text-brand">
            Incoming Parcels
          </h3>
          <p className="mt-3 font-display text-3xl font-bold tracking-tight text-brand">
            —
          </p>
          <p className="mt-2 text-sm text-brand-muted">
            Parcels currently heading to your locker.
          </p>
        </article>

        <article className="rounded-xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(12,35,64,0.04)]">
          <h3 className="font-display text-sm font-semibold text-brand">
            Ready to Ship
          </h3>
          <p className="mt-3 font-display text-3xl font-bold tracking-tight text-brand">
            —
          </p>
          <p className="mt-2 text-sm text-brand-muted">
            Packages waiting for consolidation or dispatch.
          </p>
        </article>

        <article className="rounded-xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(12,35,64,0.04)]">
          <h3 className="font-display text-sm font-semibold text-brand">
            Active Shipments
          </h3>
          <p className="mt-3 font-display text-3xl font-bold tracking-tight text-brand">
            —
          </p>
          <p className="mt-2 text-sm text-brand-muted">
            International shipments currently in transit.
          </p>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <article className="rounded-xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(12,35,64,0.04)] sm:p-6">
          <h3 className="font-display text-lg font-semibold tracking-tight text-brand">
            Recent Activity
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-brand-muted">
            Parcel updates, shipment tracking, and account notices will show up
            here.
          </p>
          <ul className="mt-5 space-y-3">
            <li className="rounded-lg border border-dashed border-border bg-background px-4 py-3 text-sm text-brand-muted">
              No recent activity yet.
            </li>
          </ul>
        </article>

        <article className="rounded-xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(12,35,64,0.04)] sm:p-6">
          <h3 className="font-display text-lg font-semibold tracking-tight text-brand">
            Quick Actions
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-brand-muted">
            Shortcuts for shipping, consolidation, and pickup will become active
            as those tools go live.
          </p>
          <div className="mt-5 flex flex-col gap-2.5">
            <a
              href="/dashboard/shipping-calculator"
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-semibold text-brand transition-colors hover:border-brand/30"
            >
              Calculate Shipping
            </a>
            <a
              href="/dashboard/consolidation"
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-semibold text-brand transition-colors hover:border-brand/30"
            >
              Request Consolidation
            </a>
            <a
              href="/dashboard/locker"
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-accent/10 px-4 text-sm font-semibold text-accent transition-colors hover:bg-accent/15"
            >
              View India Address
            </a>
          </div>
        </article>
      </section>
    </div>
  );
}
