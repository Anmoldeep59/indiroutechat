"use client";

import { useState, type FormEvent } from "react";

const fieldClassName =
  "mt-1.5 min-h-11 w-full rounded-md border border-border bg-background px-3.5 text-sm text-brand outline-none transition-colors placeholder:text-brand-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/25";

const labelClassName = "block text-sm font-semibold tracking-tight text-brand";

export function PickupRequestForm() {
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(
      "Pickup requests will be saved to Supabase in the next integration step.",
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(12,35,64,0.04)] sm:p-8">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          Pickup Request
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-brand sm:text-3xl">
          Request India pickup
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-muted sm:text-base">
          Ask IndiRoute to collect a parcel from an eligible address in India and
          deliver it to your warehouse locker.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(12,35,64,0.04)]">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClassName} htmlFor="contact-name">
              Contact name
            </label>
            <input id="contact-name" name="contactName" className={fieldClassName} />
          </div>
          <div>
            <label className={labelClassName} htmlFor="phone">
              Phone
            </label>
            <input id="phone" name="phone" type="tel" className={fieldClassName} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClassName} htmlFor="line1">
              Pickup address
            </label>
            <input id="line1" name="line1" className={fieldClassName} />
          </div>
          <div>
            <label className={labelClassName} htmlFor="city">
              City
            </label>
            <input id="city" name="city" className={fieldClassName} />
          </div>
          <div>
            <label className={labelClassName} htmlFor="state">
              State
            </label>
            <input id="state" name="state" className={fieldClassName} />
          </div>
          <div>
            <label className={labelClassName} htmlFor="postal">
              Postal code
            </label>
            <input id="postal" name="postal" className={fieldClassName} />
          </div>
          <div>
            <label className={labelClassName} htmlFor="preferred-date">
              Preferred date
            </label>
            <input
              id="preferred-date"
              name="preferredDate"
              type="date"
              className={fieldClassName}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClassName} htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className={`${fieldClassName} min-h-24 py-3`}
            />
          </div>
        </div>

        <button
          type="submit"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Submit Pickup Request
        </button>
        {message ? (
          <p className="mt-4 text-sm text-brand-muted" role="status">
            {message}
          </p>
        ) : null}
      </section>
    </form>
  );
}
