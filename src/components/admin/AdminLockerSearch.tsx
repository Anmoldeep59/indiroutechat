"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthState } from "@/hooks/useAuthState";

type CustomerResult = {
  profileId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  lockerId: string | null;
  lockerCode: string | null;
  parcelCount: number;
};

function customerName(c: CustomerResult) {
  return [c.firstName, c.lastName].filter(Boolean).join(" ").trim() || "Customer";
}

export function AdminLockerSearch() {
  const { user } = useAuthState();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || query.trim().length < 2) {
      queueMicrotask(() => setResults([]));
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const idToken = await user.getIdToken();
        const response = await fetch(
          `/api/admin/customers/search?q=${encodeURIComponent(query.trim())}`,
          { headers: { Authorization: `Bearer ${idToken}` } },
        );
        const payload = (await response.json()) as {
          customers?: CustomerResult[];
          error?: string;
        };
        if (cancelled) return;
        if (!response.ok) {
          setError(payload.error || "Search failed.");
          setResults([]);
          return;
        }
        setError(null);
        setResults(payload.customers ?? []);
      } catch {
        if (!cancelled) setError("Search failed.");
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, user]);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          Warehouse
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-brand">
          Locker search
        </h1>
        <p className="mt-3 text-sm text-brand-muted">
          Search by locker ID (fast), customer name, email, or phone.
        </p>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. IR-100001"
          className="mt-5 min-h-11 w-full max-w-xl rounded-md border border-border bg-background px-3.5 text-sm text-brand outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
        />
        {searching ? (
          <p className="mt-2 text-sm text-brand-muted">Searching…</p>
        ) : null}
        {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      </section>

      <div className="space-y-3">
        {results.map((customer) => (
          <article
            key={customer.profileId}
            className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-display text-lg font-bold text-brand">
                {customerName(customer)}
              </p>
              <p className="mt-1 text-sm font-semibold text-accent">
                {customer.lockerCode || "No locker"}
              </p>
              <p className="mt-1 text-sm text-brand-muted">
                {customer.email || "No email"}
                {customer.phone ? ` · ${customer.phone}` : ""}
              </p>
              <p className="mt-1 text-sm text-brand">
                Current parcels: {customer.parcelCount}
              </p>
            </div>
            <Link
              href={`/admin/parcels?profileId=${customer.profileId}&lockerId=${customer.lockerId ?? ""}&lockerCode=${encodeURIComponent(customer.lockerCode ?? "")}&name=${encodeURIComponent(customerName(customer))}&email=${encodeURIComponent(customer.email ?? "")}`}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-hover"
            >
              Add Package
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
