"use client";

import { useState } from "react";
import { BarcodeDecor } from "@/components/illustrations";
import type { CustomerLockerView } from "@/lib/locker-display";
import { formatCustomerLockerAddress } from "@/lib/locker-display";

type LockerAddressCardProps = {
  locker: CustomerLockerView;
  compact?: boolean;
};

export function LockerAddressCard({
  locker,
  compact = false,
}: LockerAddressCardProps) {
  const [copied, setCopied] = useState<"address" | "code" | null>(null);

  async function copyText(value: string, kind: "address" | "code") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  const cityLine = [locker.city, locker.state, locker.postcode]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_4px_20px_rgba(12,35,64,0.06)] ${
        compact ? "p-5" : "p-6 sm:p-8"
      }`}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-accent/70 to-transparent"
        aria-hidden="true"
      />
      <BarcodeDecor className="pointer-events-none absolute bottom-4 right-5 hidden h-8 w-auto text-brand/20 sm:block" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            My India Address
          </p>
          <p className="mt-2 font-display text-lg font-semibold tracking-tight text-brand">
            Locker {locker.lockerCode}
          </p>
        </div>
        <span className="rounded-md bg-brand/[0.06] px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
          {locker.status}
        </span>
      </div>

      <div className="mt-4 space-y-1 text-sm leading-relaxed text-brand">
        <p className="font-semibold">{locker.customerName}</p>
        <p>Locker: {locker.lockerCode}</p>
        <p>{locker.warehouseName}</p>
        {locker.line1 ? <p>{locker.line1}</p> : null}
        {locker.line2 ? <p>{locker.line2}</p> : null}
        {cityLine ? <p>{cityLine}</p> : null}
        <p>{locker.country}</p>
        {locker.phone ? <p>Phone: {locker.phone}</p> : null}
      </div>

      <div className={`mt-5 flex flex-col gap-2.5 ${compact ? "" : "sm:flex-row"}`}>
        <button
          type="button"
          onClick={() =>
            void copyText(formatCustomerLockerAddress(locker), "address")
          }
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(232,106,23,0.25)] transition-all duration-200 hover:bg-accent-hover hover:shadow-[0_6px_16px_rgba(232,106,23,0.32)] motion-safe:hover:-translate-y-0.5 active:scale-[0.98]"
        >
          {copied === "address" ? "Address copied" : "Copy Address"}
        </button>
        <button
          type="button"
          onClick={() => void copyText(locker.lockerCode, "code")}
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-semibold text-brand transition-all duration-200 hover:border-brand/30 hover:shadow-sm motion-safe:hover:-translate-y-0.5 active:scale-[0.98]"
        >
          {copied === "code" ? "Code copied" : "Copy Locker Code"}
        </button>
      </div>
    </div>
  );
}
