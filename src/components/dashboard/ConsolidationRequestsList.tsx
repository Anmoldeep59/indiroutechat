"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthState } from "@/hooks/useAuthState";

type RequestRow = {
  id: string;
  status: string;
  createdAt: string;
  parcelCount: number;
};

export function ConsolidationRequestsList() {
  const { user } = useAuthState();
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/consolidation/requests", {
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
      } catch {
        setError("Unable to load requests.");
      }
    })();
  }, [user]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          Consolidation
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-brand">
          Quote requests
        </h1>
        <p className="mt-3 text-sm text-brand-muted">
          Select parcels under My Parcels, then track warehouse packing and
          shipping quotes here.
        </p>
      </section>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="space-y-3">
        {requests.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-surface p-6 text-sm text-brand-muted">
            No quote requests yet.
          </p>
        ) : (
          requests.map((row) => (
            <Link
              key={row.id}
              href={`/dashboard/consolidation/${row.id}`}
              className="block rounded-xl border border-border bg-surface p-5 transition-colors hover:border-brand/30"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-brand">
                  Request {row.id.slice(0, 8)}…
                </p>
                <span className="text-xs font-semibold uppercase tracking-wide text-accent">
                  {row.status.replaceAll("_", " ")}
                </span>
              </div>
              <p className="mt-2 text-sm text-brand-muted">
                {row.parcelCount} parcel{row.parcelCount === 1 ? "" : "s"} ·{" "}
                {new Date(row.createdAt).toLocaleString()}
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
