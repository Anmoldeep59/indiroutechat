"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "@/hooks/useAuthState";
import {
  getParcelStatusLabel,
  isParcelSelectable,
  type CustomerParcel,
} from "@/lib/parcel-status";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(value));
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
  warehouse_received: "bg-brand/[0.08] text-brand",
  inspection: "bg-brand/[0.08] text-brand",
  ready_for_consolidation: "bg-accent/10 text-accent-hover",
  consolidated: "bg-brand/[0.08] text-brand",
  assigned_to_shipment: "bg-success/10 text-success",
  shipped: "bg-brand/[0.08] text-brand",
  delivered: "bg-success/10 text-success",
};

export function MyParcelsView() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthState();
  const [parcels, setParcels] = useState<CustomerParcel[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const selectable = useMemo(
    () => parcels.filter((p) => isParcelSelectable(p.status)),
    [parcels],
  );

  const refresh = useCallback(() => {
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      queueMicrotask(() => {
        setParcels([]);
        setLoading(false);
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
          setError(payload?.error || "Unable to load your parcels.");
          setParcels([]);
          return;
        }
        setParcels(payload?.parcels ?? []);
      } catch {
        if (!cancelled) setError("Unable to load your parcels.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, reloadKey]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(selectable.map((p) => p.id)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function requestQuote() {
    if (!user || selected.size < 1 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/consolidation/requests", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ parcelIds: [...selected] }),
      });
      const payload = (await response.json().catch(() => null)) as {
        request?: { id: string };
        error?: string;
      } | null;
      if (!response.ok || !payload?.request?.id) {
        setError(payload?.error || "Unable to create quote request.");
        return;
      }
      router.push(`/dashboard/consolidation/${payload.request.id}`);
    } catch {
      setError("Unable to create quote request.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedCount = selected.size;
  const ctaLabel =
    selectedCount <= 1 ? "Get Shipping Quote" : "Combine & Get Quote";

  return (
    <div className="space-y-6 pb-28">
      <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          My Parcels
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-brand sm:text-3xl">
          Parcels in your locker
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-brand-muted sm:text-base">
          Select one or more parcels, then request a shipping quote. Combining
          parcels means warehouse staff will pack them before pricing.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={selectAll}
            disabled={selectable.length === 0}
            className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-brand disabled:opacity-50"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={clearSelection}
            disabled={selectedCount === 0}
            className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-brand disabled:opacity-50"
          >
            Clear Selection
          </button>
          <span className="inline-flex min-h-10 items-center text-sm font-semibold text-brand">
            {selectedCount} parcel{selectedCount === 1 ? "" : "s"} selected
          </span>
        </div>
      </section>

      {loading || authLoading ? (
        <p className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-brand-muted">
          Loading your parcels...
        </p>
      ) : error ? (
        <div className="rounded-xl border border-border bg-surface p-6">
          <p className="text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={refresh}
            className="mt-3 text-sm font-semibold text-accent"
          >
            Try again
          </button>
        </div>
      ) : parcels.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface px-4 py-10 text-center">
          <p className="text-sm font-medium text-brand">
            No parcels have been received yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {parcels.map((parcel) => {
            const canSelect = isParcelSelectable(parcel.status);
            const isSelected = selected.has(parcel.id);
            return (
              <article
                key={parcel.id}
                className={[
                  "relative rounded-xl border bg-surface p-5 transition-colors",
                  isSelected
                    ? "border-brand bg-brand/[0.03] shadow-[0_0_0_1px_var(--brand)]"
                    : "border-border",
                  canSelect ? "cursor-pointer" : "opacity-70",
                ].join(" ")}
                onClick={() => {
                  if (canSelect) toggle(parcel.id);
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand/[0.06] text-brand">
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  {canSelect ? (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(parcel.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 h-5 w-5 accent-[var(--brand)]"
                      aria-label={`Select ${parcel.reference_code}`}
                    />
                  ) : null}
                </div>
                {isSelected ? (
                  <span className="absolute right-4 top-4 text-accent" aria-hidden="true">
                    ✓
                  </span>
                ) : null}
                <h2 className="mt-4 font-display text-lg font-bold text-brand">
                  {parcel.reference_code || parcel.id.slice(0, 8)}
                </h2>
                <p className="mt-1 text-sm font-medium text-brand">
                  {parcel.description || "Parcel"}
                </p>
                <dl className="mt-3 space-y-1 text-sm text-brand-muted">
                  <div>Store/Sender: {parcel.sender_name || "—"}</div>
                  <div>Courier: {parcel.carrier || "—"}</div>
                  <div>Tracking: {parcel.inbound_tracking_number || "—"}</div>
                  <div>
                    Weight:{" "}
                    {parcel.weight_kg != null ? `${parcel.weight_kg} kg` : "—"}
                  </div>
                  <div>Received: {formatDate(parcel.received_at)}</div>
                </dl>
                <span
                  className={`mt-4 inline-flex rounded-md px-2 py-1 text-xs font-semibold ${
                    STATUS_BADGE_CLASSES[parcel.status] ??
                    "bg-brand/[0.06] text-brand"
                  }`}
                >
                  {getParcelStatusLabel(parcel.status)}
                </span>
              </article>
            );
          })}
        </div>
      )}

      {selectedCount > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 py-3 shadow-[0_-8px_30px_rgba(12,35,64,0.12)] backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-brand">
              Selected parcels: {selectedCount}
            </p>
            <button
              type="button"
              disabled={submitting}
              onClick={() => void requestQuote()}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-6 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
            >
              {submitting ? "Submitting…" : ctaLabel}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
