"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthState } from "@/hooks/useAuthState";

type Shipment = {
  id: string;
  status: string;
  payment_status: string;
  selected_tier: string | null;
  service_type: string;
  shipping_cost: number | null;
  currency: string;
  delivery_city: string | null;
  delivery_country: string | null;
  created_at: string;
  consolidation_request_id: string | null;
};

export function ShipmentsList() {
  const { user } = useAuthState();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const token = await user.getIdToken();
      const response = await fetch("/api/shipments/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = (await response.json()) as {
        shipments?: Shipment[];
        error?: string;
      };
      if (!response.ok) {
        setError(payload.error || "Unable to load shipments.");
        return;
      }
      setShipments(payload.shipments ?? []);
    })();
  }, [user]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          Shipments
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-brand">
          Your international shipments
        </h1>
      </section>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <div className="space-y-3">
        {shipments.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-sm text-brand-muted">
            No shipments yet.
          </p>
        ) : (
          shipments.map((shipment) => (
            <Link
              key={shipment.id}
              href={
                shipment.consolidation_request_id
                  ? `/dashboard/consolidation/${shipment.consolidation_request_id}`
                  : `/dashboard/shipments/${shipment.id}`
              }
              className="block rounded-xl border border-border bg-surface p-5"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-semibold text-brand">
                  {shipment.id.slice(0, 8)}… · IndiRoute{" "}
                  {shipment.selected_tier || shipment.service_type}
                </p>
                <span className="text-xs font-semibold uppercase text-accent">
                  {shipment.payment_status === "paid"
                    ? "PAID — READY TO SHIP"
                    : shipment.payment_status}
                  {" / "}
                  {shipment.status.replaceAll("_", " ")}
                </span>
              </div>
              <p className="mt-2 text-sm text-brand-muted">
                {shipment.delivery_city}, {shipment.delivery_country} ·{" "}
                {shipment.currency} {shipment.shipping_cost}
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
