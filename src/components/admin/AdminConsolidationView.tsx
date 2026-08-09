"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuthState } from "@/hooks/useAuthState";

type RequestRow = {
  id: string;
  status: string;
  createdAt: string;
  customerName: string;
  email: string | null;
  lockerCode: string | null;
  parcelCount: number;
};

export function AdminConsolidationView() {
  const { user } = useAuthState();
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/consolidation", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = (await response.json()) as {
        requests?: RequestRow[];
        error?: string;
      };
      if (!response.ok) {
        setError(payload.error || "Unable to load requests.");
        return;
      }
      setRequests(payload.requests ?? []);
      setError(null);
    } catch {
      setError("Unable to load requests.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          Admin
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-brand">
          Consolidation / Quote Requests
        </h1>
        <p className="mt-3 text-sm text-brand-muted">
          Review customer parcel selections, enter final packed measurements,
          and generate IndiRoute shipping quotes.
        </p>
      </section>

      {loading ? (
        <p className="text-sm text-brand-muted">Loading…</p>
      ) : error ? (
        <p className="text-sm text-red-700">{error}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-background/80">
              <tr>
                <th className="px-4 py-3 font-semibold">Request</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Locker</th>
                <th className="px-4 py-3 font-semibold">Parcels</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {requests.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">
                    {row.id.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-brand">
                      {row.customerName || "Customer"}
                    </div>
                    <div className="text-xs text-brand-muted">{row.email}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-accent">
                    {row.lockerCode || "—"}
                  </td>
                  <td className="px-4 py-3">{row.parcelCount}</td>
                  <td className="px-4 py-3 capitalize">{row.status.replaceAll("_", " ")}</td>
                  <td className="px-4 py-3 text-brand-muted">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/consolidation/${row.id}`}
                      className="text-sm font-semibold text-accent hover:text-accent-hover"
                    >
                      Open
                    </Link>
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
