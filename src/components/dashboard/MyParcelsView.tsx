"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthState } from "@/hooks/useAuthState";
import {
  getParcelStatusLabel,
  type CustomerParcel,
} from "@/lib/parcel-status";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

/** Visual-only styling per status; labels/logic stay in parcel-status. */
const STATUS_BADGE_CLASSES: Record<string, string> = {
  in_process: "bg-brand/[0.06] text-brand",
  warehouse_received: "bg-brand/[0.08] text-brand",
  inspection: "bg-brand/[0.08] text-brand",
  ready_for_consolidation: "bg-accent/10 text-accent-hover",
  packed: "bg-accent/10 text-accent-hover",
  payment_pending: "bg-accent/15 text-accent-hover",
  ready_to_ship: "bg-accent/15 text-accent-hover",
  shipped: "bg-brand/[0.08] text-brand",
  in_transit: "bg-brand/[0.08] text-brand",
  delivered: "bg-success/10 text-success",
};

const journeySteps = [
  {
    label: "Received",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 8.25L12 3l7.5 5.25v12H4.5v-12z" />
      </svg>
    ),
  },
  {
    label: "Inspection",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
      </svg>
    ),
  },
  {
    label: "Packed",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    label: "Ready to Ship",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375A1.125 1.125 0 012.25 17.625V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25h17.25M3.375 14.25V6.375c0-.621.504-1.125 1.125-1.125h6.75c.621 0 1.125.504 1.125 1.125v7.875" />
      </svg>
    ),
  },
  {
    label: "In Transit",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
      </svg>
    ),
  },
  {
    label: "Delivered",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    ),
  },
] as const;

function ParcelJourneyLegend() {
  return (
    <div
      className="overflow-x-auto rounded-2xl border border-border bg-surface px-5 py-4 shadow-[0_1px_3px_rgba(12,35,64,0.05)]"
      aria-hidden="true"
    >
      <div className="flex min-w-[36rem] items-center">
        {journeySteps.map((step, index) => (
          <div key={step.label} className="flex flex-1 items-center">
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  index === journeySteps.length - 1
                    ? "bg-success/10 text-success"
                    : "bg-brand/[0.06] text-brand"
                }`}
              >
                {step.icon}
              </span>
              <span className="text-xs font-semibold text-brand-muted">
                {step.label}
              </span>
            </div>
            {index < journeySteps.length - 1 ? (
              <span className="mx-3 h-px flex-1 border-t border-dashed border-border" />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MyParcelsView() {
  const { user, loading: authLoading } = useAuthState();
  const [parcels, setParcels] = useState<CustomerParcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => {
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      queueMicrotask(() => {
        setParcels([]);
        setLoading(false);
        setError(null);
      });
      return;
    }

    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
    });

    async function load() {
      try {
        const idToken = await user!.getIdToken();
        const response = await fetch("/api/parcels/me", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const payload = (await response.json().catch(() => null)) as {
          parcels?: CustomerParcel[];
          error?: string;
        } | null;

        if (cancelled) return;

        if (!response.ok) {
          setParcels([]);
          setError(payload?.error || "Unable to load your parcels.");
          return;
        }

        setParcels(payload?.parcels ?? []);
      } catch {
        if (!cancelled) {
          setParcels([]);
          setError("Unable to load your parcels.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, reloadKey]);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_3px_rgba(12,35,64,0.05)] sm:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-accent/[0.06] blur-2xl"
          aria-hidden="true"
        />
        <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          My Parcels
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-brand sm:text-3xl">
          Parcels in your locker
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-muted sm:text-base">
          Packages received at the IndiRoute warehouse for your account.
        </p>
      </section>

      <ParcelJourneyLegend />

      {loading || authLoading ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <div
            className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-brand/20 border-t-accent"
            aria-hidden="true"
          />
          <p className="mt-4 text-sm font-semibold text-brand">
            Loading your parcels...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-border bg-surface p-6">
          <p className="text-sm text-brand-muted">{error}</p>
          <button
            type="button"
            onClick={refresh}
            className="mt-4 text-sm font-semibold text-accent hover:text-accent-hover"
          >
            Try again
          </button>
        </div>
      ) : parcels.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface px-4 py-10 text-center">
          <p className="text-sm font-medium text-brand">
            No parcels have been received yet.
          </p>
          <p className="mt-2 text-sm text-brand-muted">
            When a package arrives at the warehouse, it will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-[0_4px_20px_rgba(12,35,64,0.06)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-background/80">
              <tr>
                <th className="px-4 py-3 font-semibold text-brand">Reference</th>
                <th className="px-4 py-3 font-semibold text-brand">Courier</th>
                <th className="px-4 py-3 font-semibold text-brand">Tracking</th>
                <th className="px-4 py-3 font-semibold text-brand">Sender</th>
                <th className="px-4 py-3 font-semibold text-brand">Weight</th>
                <th className="px-4 py-3 font-semibold text-brand">Received</th>
                <th className="px-4 py-3 font-semibold text-brand">Status</th>
              </tr>
            </thead>
            <tbody>
              {parcels.map((parcel) => (
                <tr key={parcel.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3 font-mono text-xs text-brand">
                    {parcel.id.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3 text-brand-muted">
                    {parcel.carrier || "—"}
                  </td>
                  <td className="px-4 py-3 text-brand-muted">
                    {parcel.inbound_tracking_number || "—"}
                  </td>
                  <td className="px-4 py-3 text-brand-muted">
                    {parcel.sender_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-brand-muted">
                    {parcel.weight_kg != null ? `${parcel.weight_kg} kg` : "—"}
                  </td>
                  <td className="px-4 py-3 text-brand-muted">
                    {formatDate(parcel.received_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${
                        STATUS_BADGE_CLASSES[parcel.status] ??
                        "bg-brand/[0.06] text-brand"
                      }`}
                    >
                      <span
                        className={`inline-block h-1.5 w-1.5 rounded-full ${
                          parcel.status === "delivered"
                            ? "bg-success"
                            : "bg-current opacity-60"
                        }`}
                        aria-hidden="true"
                      />
                      {getParcelStatusLabel(parcel.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
