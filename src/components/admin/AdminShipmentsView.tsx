"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthState } from "@/hooks/useAuthState";

type AdminShipment = {
  id: string;
  status: string;
  paymentStatus: string;
  selectedTier: string;
  shippingCost: number | null;
  currency: string;
  parcelCount: number | null;
  weightKg: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  delivery: {
    fullName: string | null;
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
    phone: string | null;
  };
  customerName: string;
  email: string | null;
  lockerCode: string | null;
  parcelRefs: string[];
};

export function AdminShipmentsView() {
  const { user } = useAuthState();
  const [shipments, setShipments] = useState<AdminShipment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const token = await user.getIdToken();
    const response = await fetch("/api/admin/shipments", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = (await response.json()) as {
      shipments?: AdminShipment[];
      error?: string;
    };
    if (!response.ok) {
      setError(payload.error || "Unable to load shipments.");
      return;
    }
    setShipments(payload.shipments ?? []);
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

  async function updateStatus(id: string, status: string) {
    if (!user) return;
    const token = await user.getIdToken();
    await fetch(`/api/admin/shipments/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <h1 className="font-display text-2xl font-bold text-brand">Shipments</h1>
        <p className="mt-2 text-sm text-brand-muted">
          Paid orders ready for dispatch and tracking updates.
        </p>
      </section>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <div className="space-y-4">
        {shipments.map((shipment) => (
          <article
            key={shipment.id}
            className="rounded-xl border border-border bg-surface p-5 text-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg font-bold text-brand">
                  {shipment.customerName || "Customer"} · {shipment.lockerCode}
                </p>
                <p className="text-brand-muted">{shipment.email}</p>
              </div>
              <span className="rounded-md bg-brand px-2 py-1 text-xs font-semibold uppercase text-white">
                {shipment.paymentStatus === "paid"
                  ? "PAID — READY TO SHIP"
                  : `${shipment.paymentStatus} / ${shipment.status}`}
              </span>
            </div>
            <dl className="mt-4 grid gap-2 sm:grid-cols-2">
              <div>Order: {shipment.id.slice(0, 8)}…</div>
              <div>Service: IndiRoute {shipment.selectedTier}</div>
              <div>
                Amount: {shipment.currency} {shipment.shippingCost}
              </div>
              <div>Parcels: {shipment.parcelRefs.join(", ") || shipment.parcelCount}</div>
              <div>
                Packed: {shipment.weightKg} kg · {shipment.lengthCm}×
                {shipment.widthCm}×{shipment.heightCm} cm
              </div>
              <div>
                Deliver to: {shipment.delivery.fullName}, {shipment.delivery.line1}
                {shipment.delivery.line2 ? `, ${shipment.delivery.line2}` : ""},{" "}
                {shipment.delivery.city}, {shipment.delivery.state}{" "}
                {shipment.delivery.postalCode}, {shipment.delivery.country}
              </div>
            </dl>
            {shipment.paymentStatus === "paid" ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {["ready_to_ship", "shipped", "in_transit", "delivered"].map(
                  (status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => void updateStatus(shipment.id, status)}
                      className="min-h-9 rounded-md border border-border px-3 text-xs font-semibold capitalize text-brand"
                    >
                      {status.replaceAll("_", " ")}
                    </button>
                  ),
                )}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
