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
      <section className="rounded-xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(12,35,64,0.04)] sm:p-8">
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
        <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-[0_1px_2px_rgba(12,35,64,0.04)]">
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
                    <span className="inline-flex rounded-md bg-brand/[0.06] px-2 py-1 text-xs font-semibold text-brand">
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
