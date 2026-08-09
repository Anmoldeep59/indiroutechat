"use client";

import { LockerAddressCard } from "@/components/dashboard/LockerAddressCard";
import { LockerRack, WarehouseIllustration } from "@/components/illustrations";
import { useMyLocker } from "@/hooks/useMyLocker";

export function MyLockerView() {
  const { locker, loading, error, refresh } = useMyLocker();

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center shadow-[0_1px_2px_rgba(12,35,64,0.04)]">
        <div
          className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-brand/20 border-t-accent"
          aria-hidden="true"
        />
        <p className="mt-4 font-display text-sm font-semibold text-brand">
          Loading your locker...
        </p>
      </div>
    );
  }

  if (error || !locker) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(12,35,64,0.04)] sm:p-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-brand">
          My Locker
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-brand-muted">
          {error ||
            "Your India locker is not available yet. Please try again in a moment."}
        </p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-semibold text-brand transition-colors hover:border-brand/30"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_3px_rgba(12,35,64,0.05)] sm:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-accent/[0.06] blur-2xl"
          aria-hidden="true"
        />
        <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          My Locker
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-brand sm:text-3xl">
          Your India warehouse address
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-muted sm:text-base">
          Use this address when shopping from Indian websites. Always include
          your locker code so we can match parcels to your account.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <LockerAddressCard locker={locker} />

        <section
          className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_3px_rgba(12,35,64,0.05)]"
          aria-hidden="true"
        >
          <LockerRack className="h-40 w-auto" />
          <p className="mt-4 text-center text-xs font-medium text-brand-muted">
            Your locker is your personal shelf at the IndiRoute warehouse —
            every parcel with your code lands here.
          </p>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_3px_rgba(12,35,64,0.05)]">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="font-display text-lg font-semibold text-brand">
              How to use your locker
            </h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-brand-muted">
              <li>Copy your full India delivery address.</li>
              <li>
                Paste it as the shipping address on Indian store checkouts.
              </li>
              <li>
                Make sure your locker code ({locker.lockerCode}) appears in the
                address or recipient name field.
              </li>
              <li>
                After your parcel arrives at IndiRoute, it will show up under My
                Parcels.
              </li>
            </ol>
          </div>
          <WarehouseIllustration className="mx-auto hidden h-36 w-auto lg:block" />
        </div>
      </section>
    </div>
  );
}
