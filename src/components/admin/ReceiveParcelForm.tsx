"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuthState } from "@/hooks/useAuthState";

type CustomerOption = {
  profileId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  lockerId: string | null;
  lockerCode: string | null;
};

const fieldClassName =
  "mt-1.5 min-h-11 w-full rounded-md border border-border bg-background px-3.5 text-sm text-brand outline-none transition-colors placeholder:text-brand-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/25 disabled:opacity-60";

const labelClassName = "block text-sm font-semibold tracking-tight text-brand";

function customerLabel(customer: CustomerOption) {
  const name = [customer.firstName, customer.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || customer.email || "Customer";
}

export function ReceiveParcelForm() {
  const { user } = useAuthState();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerOption[]>([]);
  const [selected, setSelected] = useState<CustomerOption | null>(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user || selected) return;
    if (query.trim().length < 2) {
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
          {
            headers: { Authorization: `Bearer ${idToken}` },
          },
        );
        const payload = (await response.json().catch(() => null)) as {
          customers?: CustomerOption[];
          error?: string;
        } | null;

        if (cancelled) return;

        if (!response.ok) {
          setResults([]);
          setFormError(payload?.error || "Unable to search customers.");
          return;
        }

        setFormError(null);
        setResults(payload?.customers ?? []);
      } catch {
        if (!cancelled) {
          setResults([]);
          setFormError("Unable to search customers.");
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, selected, user]);

  const selectedSummary = useMemo(() => {
    if (!selected) return null;
    return {
      name: customerLabel(selected),
      email: selected.email,
      locker: selected.lockerCode,
    };
  }, [selected]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || submitting) return;

    if (!selected) {
      setFormError("Please select a customer.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    setSubmitting(true);
    setFormError(null);
    setSuccess(null);

    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/admin/parcels", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileId: selected.profileId,
          lockerId: selected.lockerId,
          carrier: String(formData.get("carrier") ?? ""),
          trackingNumber: String(formData.get("trackingNumber") ?? ""),
          senderName: String(formData.get("senderName") ?? ""),
          weightKg: formData.get("weightKg"),
          lengthCm: formData.get("lengthCm"),
          widthCm: formData.get("widthCm"),
          heightCm: formData.get("heightCm"),
          notes: String(formData.get("notes") ?? ""),
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        parcel?: { id: string };
      } | null;

      if (!response.ok) {
        setFormError(payload?.error || "Unable to create parcel.");
        return;
      }

      setSuccess(
        `Parcel received successfully${payload?.parcel?.id ? ` (${payload.parcel.id.slice(0, 8)}…)` : ""}.`,
      );
      event.currentTarget.reset();
      setSelected(null);
      setQuery("");
      setResults([]);
    } catch {
      setFormError("Unable to create parcel.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(12,35,64,0.04)] sm:p-8"
    >
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight text-brand">
          Receive Parcel
        </h2>
        <p className="mt-2 text-sm text-brand-muted">
          Create a warehouse-received parcel for a customer locker.
        </p>
      </div>

      {formError ? (
        <p
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {formError}
        </p>
      ) : null}

      {success ? (
        <p
          className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          {success}
        </p>
      ) : null}

      <div>
        <label htmlFor="customer-search" className={labelClassName}>
          Customer
        </label>
        {selected ? (
          <div className="mt-1.5 rounded-md border border-border bg-background px-4 py-3">
            <p className="font-semibold text-brand">{selectedSummary?.name}</p>
            <p className="text-sm text-brand-muted">{selectedSummary?.email}</p>
            <p className="mt-1 text-sm text-brand">
              Locker: {selectedSummary?.locker || "No locker assigned"}
            </p>
            <button
              type="button"
              className="mt-3 text-sm font-semibold text-accent hover:text-accent-hover"
              onClick={() => {
                setSelected(null);
                setQuery("");
              }}
            >
              Change customer
            </button>
          </div>
        ) : (
          <>
            <input
              id="customer-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, email, or locker code"
              className={fieldClassName}
              disabled={submitting}
            />
            {searching ? (
              <p className="mt-2 text-sm text-brand-muted">Searching...</p>
            ) : null}
            {results.length > 0 ? (
              <ul className="mt-2 max-h-56 overflow-y-auto rounded-md border border-border bg-background">
                {results.map((customer) => (
                  <li key={customer.profileId}>
                    <button
                      type="button"
                      className="flex w-full flex-col items-start gap-0.5 border-b border-border px-3 py-2.5 text-left last:border-b-0 hover:bg-brand/[0.03]"
                      onClick={() => {
                        setSelected(customer);
                        setResults([]);
                        setQuery("");
                      }}
                    >
                      <span className="text-sm font-semibold text-brand">
                        {customerLabel(customer)}
                      </span>
                      <span className="text-xs text-brand-muted">
                        {customer.email || "No email"} · Locker{" "}
                        {customer.lockerCode || "N/A"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="carrier" className={labelClassName}>
            Courier Name
          </label>
          <input
            id="carrier"
            name="carrier"
            className={fieldClassName}
            placeholder="e.g. Delhivery"
            disabled={submitting}
          />
        </div>
        <div>
          <label htmlFor="trackingNumber" className={labelClassName}>
            Tracking Number
          </label>
          <input
            id="trackingNumber"
            name="trackingNumber"
            className={fieldClassName}
            disabled={submitting}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="senderName" className={labelClassName}>
            Sender / Store Name
          </label>
          <input
            id="senderName"
            name="senderName"
            className={fieldClassName}
            placeholder="e.g. Amazon.in"
            disabled={submitting}
          />
        </div>
        <div>
          <label htmlFor="weightKg" className={labelClassName}>
            Weight (kg)
          </label>
          <input
            id="weightKg"
            name="weightKg"
            type="number"
            min="0"
            step="0.01"
            className={fieldClassName}
            disabled={submitting}
          />
        </div>
        <div>
          <label htmlFor="lengthCm" className={labelClassName}>
            Length (cm)
          </label>
          <input
            id="lengthCm"
            name="lengthCm"
            type="number"
            min="0"
            step="0.1"
            className={fieldClassName}
            disabled={submitting}
          />
        </div>
        <div>
          <label htmlFor="widthCm" className={labelClassName}>
            Width (cm)
          </label>
          <input
            id="widthCm"
            name="widthCm"
            type="number"
            min="0"
            step="0.1"
            className={fieldClassName}
            disabled={submitting}
          />
        </div>
        <div>
          <label htmlFor="heightCm" className={labelClassName}>
            Height (cm)
          </label>
          <input
            id="heightCm"
            name="heightCm"
            type="number"
            min="0"
            step="0.1"
            className={fieldClassName}
            disabled={submitting}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="notes" className={labelClassName}>
            Short Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className={`${fieldClassName} min-h-24 py-3`}
            disabled={submitting}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting || !selected}
        className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Saving parcel..." : "Receive Parcel"}
      </button>
    </form>
  );
}
