"use client";

import { useState } from "react";
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
      className={`rounded-xl border border-border bg-surface shadow-[0_1px_2px_rgba(12,35,64,0.04)] ${
        compact ? "p-5" : "p-6 sm:p-8"
      }`}
    >
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
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          {copied === "address" ? "Address copied" : "Copy Address"}
        </button>
        <button
          type="button"
          onClick={() => void copyText(locker.lockerCode, "code")}
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-semibold text-brand transition-colors hover:border-brand/30"
        >
          {copied === "code" ? "Code copied" : "Copy Locker Code"}
        </button>
      </div>
    </div>
  );
}
