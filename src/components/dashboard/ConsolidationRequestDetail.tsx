"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuthState } from "@/hooks/useAuthState";
import { SHIPPING_COUNTRIES } from "@/lib/shipping/countries";

type QuoteOption = {
  tier: "economy" | "standard" | "express";
  displayName: string;
  available: boolean;
  comingSoon?: boolean;
  priceInr: number | null;
  estimatedDelivery: string | null;
  badge: string | null;
};

type RequestDetail = {
  id: string;
  status: string;
  finalWeightKg: number | null;
  finalLengthCm: number | null;
  finalWidthCm: number | null;
  finalHeightCm: number | null;
  finalPieces: number | null;
  parcels: Array<{
    reference_code?: string;
    description?: string | null;
  } | null>;
  quote: {
    id: string;
    expired: boolean;
    expiresAt: string;
    chargeableWeightKg: number;
    options: QuoteOption[];
  } | null;
  shipment: {
    id: string;
    status: string;
    payment_status: string;
  } | null;
};

const fieldClassName =
  "mt-1.5 min-h-11 w-full rounded-md border border-border bg-background px-3.5 text-sm text-brand outline-none focus:border-accent focus:ring-2 focus:ring-accent/25";

const steps = [
  "Requested",
  "Warehouse preparing",
  "Quote ready",
  "Address & pay",
  "Paid / ready to ship",
];

export function ConsolidationRequestDetail({ requestId }: { requestId: string }) {
  const { user } = useAuthState();
  const [detail, setDetail] = useState<RequestDetail | null>(null);
  const [showRates, setShowRates] = useState(false);
  const [selectedTier, setSelectedTier] = useState<"economy" | "standard" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<
    Array<{
      id: string;
      label: string | null;
      line1: string;
      line2: string | null;
      city: string;
      state: string | null;
      postal_code: string | null;
      country: string;
    }>
  >([]);

  const load = useCallback(async () => {
    if (!user) return;
    const token = await user.getIdToken();
    const response = await fetch(`/api/consolidation/requests/${requestId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = (await response.json()) as {
      request?: RequestDetail;
      error?: string;
    };
    if (!response.ok) {
      setError(payload.error || "Unable to load request.");
      return;
    }
    setDetail(payload.request ?? null);
    if (payload.request?.quote && !payload.request.quote.expired) {
      setShowRates(false);
    }
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

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    queueMicrotask(() => {
      void (async () => {
        const token = await user.getIdToken();
        const response = await fetch("/api/addresses", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = (await response.json()) as {
          addresses?: typeof savedAddresses;
        };
        if (!cancelled) setSavedAddresses(payload.addresses ?? []);
      })();
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function pay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !detail || !selectedTier) return;
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);

    try {
      const token = await user.getIdToken();
      const orderResponse = await fetch(
        `/api/consolidation/requests/${requestId}/create-order`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tier: selectedTier,
            fullName: String(form.get("fullName") ?? ""),
            phone: String(form.get("phone") ?? ""),
            email: String(form.get("email") ?? ""),
            line1: String(form.get("line1") ?? ""),
            line2: String(form.get("line2") ?? ""),
            city: String(form.get("city") ?? ""),
            state: String(form.get("state") ?? ""),
            postalCode: String(form.get("postalCode") ?? ""),
            country: String(form.get("country") ?? ""),
            deliveryInstructions: String(form.get("instructions") ?? ""),
            saveAddress: form.get("saveAddress") === "on",
          }),
        },
      );
      const orderPayload = (await orderResponse.json()) as {
        shipmentOrderId?: string;
        error?: string;
      };
      if (!orderResponse.ok || !orderPayload.shipmentOrderId) {
        setError(orderPayload.error || "Unable to create order.");
        return;
      }

      const checkoutResponse = await fetch(
        "/api/payments/stripe/create-checkout",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            shipmentOrderId: orderPayload.shipmentOrderId,
          }),
        },
      );
      const checkoutPayload = (await checkoutResponse.json()) as {
        url?: string;
        error?: string;
      };
      if (!checkoutResponse.ok || !checkoutPayload.url) {
        setError(checkoutPayload.error || "Unable to start Stripe Checkout.");
        return;
      }
      window.location.href = checkoutPayload.url;
    } catch {
      setError("Unable to start payment.");
    } finally {
      setBusy(false);
    }
  }

  if (!detail) {
    return <p className="text-sm text-brand-muted">{error || "Loading…"}</p>;
  }

  const activeStep =
    detail.shipment?.payment_status === "paid"
      ? 4
      : detail.quote && !detail.quote.expired
        ? 3
        : detail.status === "processing"
          ? 1
          : detail.status === "quoted"
            ? 2
            : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          Shipping request
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-brand">
          Combine & quote
        </h1>
        <ol className="mt-5 flex flex-wrap gap-2">
          {steps.map((step, index) => (
            <li
              key={step}
              className={[
                "rounded-md px-2.5 py-1 text-xs font-semibold",
                index <= activeStep
                  ? "bg-brand text-white"
                  : "bg-brand/[0.06] text-brand-muted",
              ].join(" ")}
            >
              {step}
            </li>
          ))}
        </ol>
      </section>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-bold text-brand">
          Selected parcels ({detail.parcels?.length ?? 0})
        </h2>
        <ul className="mt-3 space-y-1 text-sm text-brand-muted">
          {(detail.parcels ?? []).map((parcel, index) => (
            <li key={index}>
              {parcel?.reference_code || "Parcel"} — {parcel?.description || "Item"}
            </li>
          ))}
        </ul>
      </section>

      {!detail.quote ? (
        <section className="rounded-xl border border-dashed border-border bg-surface p-6 text-sm text-brand-muted">
          Warehouse is preparing your quote. You’ll be notified when rates are ready.
        </section>
      ) : detail.quote.expired ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
          This shipping quote has expired. Please request a new quote.
        </section>
      ) : (
        <>
          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="font-display text-lg font-bold text-brand">
              Final package
            </h2>
            <p className="mt-2 text-sm text-brand-muted">
              Weight: {detail.finalWeightKg} kg · Dimensions:{" "}
              {detail.finalLengthCm}×{detail.finalWidthCm}×{detail.finalHeightCm} cm ·
              Pieces: {detail.finalPieces ?? 1}
            </p>
            <p className="mt-1 text-sm text-brand-muted">
              Chargeable weight: {detail.quote.chargeableWeightKg} kg
            </p>
            <button
              type="button"
              onClick={() => setShowRates(true)}
              className="mt-4 min-h-11 rounded-md bg-brand px-5 text-sm font-semibold text-white"
            >
              Show Shipping Rates
            </button>
          </section>

          {showRates ? (
            <section className="grid gap-4">
              {detail.quote.options.map((option) => {
                const isExpress = option.tier === "express" || option.comingSoon;
                const selected = selectedTier === option.tier;
                return (
                  <article
                    key={option.tier}
                    className={[
                      "rounded-xl border p-5",
                      option.tier === "standard"
                        ? "border-accent bg-accent/5"
                        : "border-border bg-surface",
                      selected ? "ring-2 ring-brand/30" : "",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-lg font-bold text-brand">
                        {option.displayName}
                      </h3>
                      {option.badge ? (
                        <span className="rounded-md bg-accent px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                          {option.badge}
                        </span>
                      ) : null}
                    </div>
                    {isExpress ? (
                      <p className="mt-3 text-sm text-brand-muted">Coming Soon</p>
                    ) : option.available ? (
                      <>
                        <p className="mt-3 text-2xl font-bold text-brand">
                          ₹{option.priceInr?.toLocaleString("en-IN")}
                        </p>
                        <p className="mt-1 text-sm text-brand-muted">
                          Estimated delivery: {option.estimatedDelivery}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedTier(
                              option.tier === "economy" || option.tier === "standard"
                                ? option.tier
                                : null,
                            )
                          }
                          className="mt-4 min-h-10 rounded-md bg-brand px-4 text-sm font-semibold text-white"
                        >
                          {selected ? "Selected" : "Select"}
                        </button>
                      </>
                    ) : (
                      <p className="mt-3 text-sm text-brand-muted">Unavailable</p>
                    )}
                  </article>
                );
              })}
            </section>
          ) : null}

          {selectedTier && showRates ? (
            <form onSubmit={pay} className="space-y-4 rounded-xl border border-border bg-surface p-6">
              <h2 className="font-display text-lg font-bold text-brand">
                International delivery address
              </h2>

              {savedAddresses.length > 0 ? (
                <div>
                  <label className="text-sm font-semibold text-brand">
                    Saved address
                  </label>
                  <select
                    className={fieldClassName}
                    defaultValue=""
                    onChange={(event) => {
                      const address = savedAddresses.find(
                        (a) => a.id === event.target.value,
                      );
                      if (!address) return;
                      const form = event.currentTarget.form;
                      if (!form) return;
                      (form.elements.namedItem("fullName") as HTMLInputElement).value =
                        address.label || "";
                      (form.elements.namedItem("line1") as HTMLInputElement).value =
                        address.line1;
                      (form.elements.namedItem("line2") as HTMLInputElement).value =
                        address.line2 || "";
                      (form.elements.namedItem("city") as HTMLInputElement).value =
                        address.city;
                      (form.elements.namedItem("state") as HTMLInputElement).value =
                        address.state || "";
                      (form.elements.namedItem("postalCode") as HTMLInputElement).value =
                        address.postal_code || "";
                      (form.elements.namedItem("country") as HTMLSelectElement).value =
                        address.country;
                    }}
                  >
                    <option value="">Enter a new address</option>
                    {savedAddresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.label || address.line1} — {address.city}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold text-brand">Full name</label>
                  <input name="fullName" required className={fieldClassName} />
                </div>
                <div>
                  <label className="text-sm font-semibold text-brand">Phone</label>
                  <input name="phone" required className={fieldClassName} />
                </div>
                <div>
                  <label className="text-sm font-semibold text-brand">Email</label>
                  <input name="email" type="email" className={fieldClassName} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold text-brand">Address line 1</label>
                  <input name="line1" required className={fieldClassName} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold text-brand">Address line 2</label>
                  <input name="line2" className={fieldClassName} />
                </div>
                <div>
                  <label className="text-sm font-semibold text-brand">City</label>
                  <input name="city" required className={fieldClassName} />
                </div>
                <div>
                  <label className="text-sm font-semibold text-brand">State / Province</label>
                  <input name="state" className={fieldClassName} />
                </div>
                <div>
                  <label className="text-sm font-semibold text-brand">Postal / ZIP</label>
                  <input name="postalCode" required className={fieldClassName} />
                </div>
                <div>
                  <label className="text-sm font-semibold text-brand">Country</label>
                  <select name="country" required className={fieldClassName} defaultValue="AU">
                    {SHIPPING_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold text-brand">
                    Delivery instructions
                  </label>
                  <input name="instructions" className={fieldClassName} />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-brand">
                <input type="checkbox" name="saveAddress" />
                Save this address to my profile
              </label>

              <div className="rounded-md border border-border bg-background px-4 py-3 text-sm text-brand">
                <p>
                  Service:{" "}
                  <strong>
                    IndiRoute {selectedTier === "standard" ? "Standard" : "Economy"}
                  </strong>
                </p>
                <p>
                  Parcels: <strong>{detail.parcels?.length ?? 0}</strong>
                </p>
                <p>
                  Final weight: <strong>{detail.finalWeightKg} kg</strong>
                </p>
                <p>
                  Total:{" "}
                  <strong>
                    ₹
                    {detail.quote.options
                      .find((o) => o.tier === selectedTier)
                      ?.priceInr?.toLocaleString("en-IN")}
                  </strong>
                </p>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="min-h-11 w-full rounded-md bg-accent px-5 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
              >
                {busy ? "Redirecting to Stripe…" : "Pay Now"}
              </button>
            </form>
          ) : null}
        </>
      )}
    </div>
  );
}
