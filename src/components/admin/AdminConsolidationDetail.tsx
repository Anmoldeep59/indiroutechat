"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuthState } from "@/hooks/useAuthState";
import { SHIPPING_COUNTRIES } from "@/lib/shipping/countries";

type Detail = {
  id: string;
  status: string;
  customer_notes: string | null;
  packing_notes: string | null;
  final_weight_kg: number | null;
  final_length_cm: number | null;
  final_width_cm: number | null;
  final_height_cm: number | null;
  final_pieces: number | null;
  packing_fee_override: number | null;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
  lockers: { locker_code: string } | null;
  parcels: Array<{
    id: string;
    reference_code: string;
    description: string | null;
    sender_name: string | null;
    weight_kg: number | null;
    status: string;
  }>;
  quote: {
    id: string;
    options: Array<{
      tier: string;
      displayName: string;
      priceInr: number | null;
      estimatedDelivery: string | null;
      available: boolean;
    }>;
    internal?: {
      economySource?: { name?: string; id?: number; rate?: number };
      standardSource?: { name?: string; id?: number; rate?: number };
    };
  } | null;
};

const fieldClassName =
  "mt-1.5 min-h-11 w-full rounded-md border border-border bg-background px-3.5 text-sm text-brand outline-none focus:border-accent focus:ring-2 focus:ring-accent/25";

export function AdminConsolidationDetail({ requestId }: { requestId: string }) {
  const { user } = useAuthState();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const token = await user.getIdToken();
    const response = await fetch(`/api/admin/consolidation/${requestId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = (await response.json()) as { request?: Detail; error?: string };
    if (!response.ok) {
      setError(payload.error || "Unable to load request.");
      return;
    }
    setDetail(payload.request ?? null);
  }, [requestId, user]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function markProcessing() {
    if (!user) return;
    setBusy(true);
    try {
      const token = await user.getIdToken();
      await fetch(`/api/admin/consolidation/${requestId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "mark_processing" }),
      });
      await load();
      setMessage("Marked as processing.");
    } finally {
      setBusy(false);
    }
  }

  async function generateQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    try {
      const token = await user.getIdToken();
      const response = await fetch(
        `/api/admin/consolidation/${requestId}/generate-quote`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            destinationCountryCode: String(form.get("country") ?? "AU"),
            finalWeightKg: Number(form.get("finalWeightKg")),
            finalLengthCm: Number(form.get("finalLengthCm")),
            finalWidthCm: Number(form.get("finalWidthCm")),
            finalHeightCm: Number(form.get("finalHeightCm")),
            finalPieces: Number(form.get("finalPieces") ?? 1),
            packingNotes: String(form.get("packingNotes") ?? ""),
            packingFeeOverride: form.get("packingFeeOverride")
              ? Number(form.get("packingFeeOverride"))
              : null,
          }),
        },
      );
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error || "Unable to generate quote.");
        return;
      }
      setMessage("Shipping quote generated. Customer notified.");
      await load();
    } catch {
      setError("Unable to generate quote.");
    } finally {
      setBusy(false);
    }
  }

  if (!detail) {
    return <p className="text-sm text-brand-muted">{error || "Loading…"}</p>;
  }

  const customerName = [detail.profiles?.first_name, detail.profiles?.last_name]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          Quote request
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-brand">
          {customerName || "Customer"} · {detail.lockers?.locker_code}
        </h1>
        <p className="mt-2 text-sm text-brand-muted">
          Status: <span className="font-semibold capitalize text-brand">{detail.status.replaceAll("_", " ")}</span>
        </p>
        {detail.customer_notes ? (
          <p className="mt-2 text-sm text-brand-muted">
            Customer notes: {detail.customer_notes}
          </p>
        ) : null}
        <button
          type="button"
          disabled={busy || detail.status === "processing"}
          onClick={() => void markProcessing()}
          className="mt-4 min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-brand disabled:opacity-50"
        >
          Mark Processing
        </button>
      </section>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-800">{message}</p> : null}

      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-bold text-brand">
          Selected parcels ({detail.parcels?.length ?? 0})
        </h2>
        <ul className="mt-4 space-y-2 text-sm">
          {(detail.parcels ?? []).map((parcel) => (
            <li key={parcel.id} className="rounded-md border border-border px-3 py-2">
              <span className="font-semibold text-brand">{parcel.reference_code}</span>
              {" — "}
              {parcel.description || "Parcel"} · {parcel.sender_name || "—"} ·{" "}
              {parcel.weight_kg != null ? `${parcel.weight_kg} kg` : "no weight"}
            </li>
          ))}
        </ul>
      </section>

      <form onSubmit={generateQuote} className="space-y-4 rounded-xl border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-bold text-brand">
          Final packed shipment
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="text-sm font-semibold text-brand">Destination country</label>
            <select
              name="country"
              defaultValue="AU"
              className={fieldClassName}
            >
              {SHIPPING_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-brand">Final weight (kg)</label>
            <input name="finalWeightKg" type="number" step="0.01" min="0.01" required defaultValue={detail.final_weight_kg ?? ""} className={fieldClassName} />
          </div>
          <div>
            <label className="text-sm font-semibold text-brand">Pieces</label>
            <input name="finalPieces" type="number" min="1" defaultValue={detail.final_pieces ?? 1} className={fieldClassName} />
          </div>
          <div>
            <label className="text-sm font-semibold text-brand">Length (cm)</label>
            <input name="finalLengthCm" type="number" step="0.1" min="0" required defaultValue={detail.final_length_cm ?? ""} className={fieldClassName} />
          </div>
          <div>
            <label className="text-sm font-semibold text-brand">Width (cm)</label>
            <input name="finalWidthCm" type="number" step="0.1" min="0" required defaultValue={detail.final_width_cm ?? ""} className={fieldClassName} />
          </div>
          <div>
            <label className="text-sm font-semibold text-brand">Height (cm)</label>
            <input name="finalHeightCm" type="number" step="0.1" min="0" required defaultValue={detail.final_height_cm ?? ""} className={fieldClassName} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-semibold text-brand">Packing notes</label>
            <input name="packingNotes" defaultValue={detail.packing_notes ?? ""} className={fieldClassName} />
          </div>
          <div>
            <label className="text-sm font-semibold text-brand">Repacking fee override (₹)</label>
            <input name="packingFeeOverride" type="number" step="1" defaultValue={detail.packing_fee_override ?? ""} className={fieldClassName} />
            <p className="text-xs text-brand-muted">Overrides repacking only. Handling and service fees still apply from weight slabs.</p>
          </div>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="min-h-11 rounded-md bg-accent px-5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Generating…" : "Generate Shipping Quote"}
        </button>
      </form>

      {detail.quote ? (
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="font-display text-lg font-bold text-brand">
            Generated quote (admin view)
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {detail.quote.options
              .filter((o) => o.tier !== "express")
              .map((option) => (
                <div key={option.tier} className="rounded-md border border-border p-4 text-sm">
                  <p className="font-semibold text-brand">{option.displayName}</p>
                  <p>₹{option.priceInr ?? "—"}</p>
                  <p className="text-brand-muted">{option.estimatedDelivery}</p>
                </div>
              ))}
          </div>
          {detail.quote.internal ? (
            <div className="mt-4 space-y-1 text-xs text-brand-muted">
              <p>
                Economy source: {detail.quote.internal.economySource?.name} (
                {detail.quote.internal.economySource?.id}) ₹
                {detail.quote.internal.economySource?.rate}
              </p>
              <p>
                Standard source: {detail.quote.internal.standardSource?.name} (
                {detail.quote.internal.standardSource?.id}) ₹
                {detail.quote.internal.standardSource?.rate}
              </p>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
