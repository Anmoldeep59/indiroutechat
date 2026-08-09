"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LockerAddressCard } from "@/components/dashboard/LockerAddressCard";
import { useAuthState } from "@/hooks/useAuthState";
import { useMyLocker } from "@/hooks/useMyLocker";

export function DashboardOverview() {
  const { user, loading: authLoading } = useAuthState();
  const { locker, loading: lockerLoading, error: lockerError } = useMyLocker();
  const [incomingCount, setIncomingCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(true);
  const displayName = user?.displayName?.trim() || "there";

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      queueMicrotask(() => {
        setIncomingCount(null);
        setCountLoading(false);
      });
      return;
    }

    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) setCountLoading(true);
    });

    async function loadCount() {
      try {
        const idToken = await user!.getIdToken();
        const response = await fetch("/api/parcels/me?count=incoming", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const payload = (await response.json().catch(() => null)) as {
          count?: number;
        } | null;

        if (!cancelled) {
          setIncomingCount(response.ok ? (payload?.count ?? 0) : null);
        }
      } catch {
        if (!cancelled) setIncomingCount(null);
      } finally {
        if (!cancelled) setCountLoading(false);
      }
    }

    void loadCount();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

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
          place.
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          {lockerLoading ? (
            <div className="rounded-xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(12,35,64,0.04)]">
              <div
                className="h-8 w-8 animate-spin rounded-full border-2 border-brand/20 border-t-accent"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm font-semibold text-brand">
                Loading your India address...
              </p>
            </div>
          ) : locker ? (
            <LockerAddressCard locker={locker} compact />
          ) : (
            <article className="rounded-xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(12,35,64,0.04)]">
              <h3 className="font-display text-sm font-semibold text-brand">
                My India Address
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-brand-muted">
                {lockerError ||
                  "Your locker is not ready yet. Please refresh or open My Locker."}
              </p>
              <Link
                href="/dashboard/locker"
                className="mt-4 inline-flex text-sm font-semibold text-accent hover:text-accent-hover"
              >
                Go to My Locker
              </Link>
            </article>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-3 lg:grid-cols-1">
          <article className="rounded-xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(12,35,64,0.04)]">
            <h3 className="font-display text-sm font-semibold text-brand">
              Incoming Parcels
            </h3>
            <p className="mt-3 font-display text-3xl font-bold tracking-tight text-brand">
              {countLoading ? "…" : incomingCount == null ? "—" : incomingCount}
            </p>
            <p className="mt-2 text-sm text-brand-muted">
              Parcels currently at the warehouse.
            </p>
            <Link
              href="/dashboard/parcels"
              className="mt-3 inline-flex text-sm font-semibold text-accent hover:text-accent-hover"
            >
              View parcels
            </Link>
          </article>
          <article className="rounded-xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(12,35,64,0.04)]">
            <h3 className="font-display text-sm font-semibold text-brand">
              Ready to Ship
            </h3>
            <p className="mt-3 font-display text-3xl font-bold tracking-tight text-brand">
              —
            </p>
            <p className="mt-2 text-sm text-brand-muted">
              Packages waiting to dispatch.
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
              Shipments currently in transit.
            </p>
          </article>
        </div>
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
            Common shortcuts for your IndiRoute account.
          </p>
          <div className="mt-5 flex flex-col gap-2.5">
            <Link
              href="/dashboard/shipping-calculator"
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-semibold text-brand transition-colors hover:border-brand/30"
            >
              Calculate Shipping
            </Link>
            <Link
              href="/dashboard/consolidation"
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-semibold text-brand transition-colors hover:border-brand/30"
            >
              Request Consolidation
            </Link>
            <Link
              href="/dashboard/locker"
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-accent/10 px-4 text-sm font-semibold text-accent transition-colors hover:bg-accent/15"
            >
              View India Address
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
