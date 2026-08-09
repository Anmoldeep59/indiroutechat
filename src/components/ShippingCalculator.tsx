"use client";

import { useState, type FormEvent } from "react";

const countries = [
  "Australia",
  "United States",
  "United Kingdom",
  "Canada",
  "New Zealand",
] as const;

const fieldClassName =
  "mt-1.5 min-h-11 w-full rounded-md border border-border bg-background px-3.5 text-sm text-brand outline-none transition-colors placeholder:text-brand-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/25";

const labelClassName =
  "block text-sm font-semibold tracking-tight text-brand";

export function ShippingCalculator() {
  const [showMessage, setShowMessage] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowMessage(true);
  }

  return (
    <section
      id="shipping-calculator"
      aria-labelledby="shipping-calculator-heading"
      className="scroll-mt-20 border-t border-border bg-background"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="shipping-calculator-heading"
            className="font-display text-3xl font-bold tracking-tight text-brand sm:text-4xl"
          >
            Estimate Your Shipping
          </h2>
          <p className="mt-4 text-base leading-relaxed text-brand-muted sm:text-lg">
            Get a quick estimate for shipping your parcel from India to your
            destination.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl sm:mt-14 lg:mt-16">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="rounded-xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(12,35,64,0.04)] sm:p-8"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="destination-country" className={labelClassName}>
                  Destination Country
                </label>
                <select
                  id="destination-country"
                  name="destinationCountry"
                  defaultValue=""
                  className={fieldClassName}
                >
                  <option value="" disabled>
                    Select a country
                  </option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="parcel-weight" className={labelClassName}>
                  Parcel Weight
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="parcel-weight"
                    name="parcelWeight"
                    type="number"
                    min="0"
                    step="0.1"
                    inputMode="decimal"
                    placeholder="0.0"
                    className={`${fieldClassName} mt-0 pr-12`}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm font-medium text-brand-muted">
                    kg
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="package-length" className={labelClassName}>
                  Package Length
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="package-length"
                    name="packageLength"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="decimal"
                    placeholder="0"
                    className={`${fieldClassName} mt-0 pr-12`}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm font-medium text-brand-muted">
                    cm
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="package-width" className={labelClassName}>
                  Package Width
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="package-width"
                    name="packageWidth"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="decimal"
                    placeholder="0"
                    className={`${fieldClassName} mt-0 pr-12`}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm font-medium text-brand-muted">
                    cm
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="package-height" className={labelClassName}>
                  Package Height
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="package-height"
                    name="packageHeight"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="decimal"
                    placeholder="0"
                    className={`${fieldClassName} mt-0 pr-12`}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm font-medium text-brand-muted">
                    cm
                  </span>
                </div>
              </div>

              <fieldset className="sm:col-span-2">
                <legend className={labelClassName}>Shipping Speed</legend>
                <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-border bg-background px-3.5 transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/25">
                    <input
                      type="radio"
                      name="shippingSpeed"
                      value="economy"
                      defaultChecked
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                    <span className="text-sm font-medium text-brand">
                      Economy
                    </span>
                  </label>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-border bg-background px-3.5 transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/25">
                    <input
                      type="radio"
                      name="shippingSpeed"
                      value="express"
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                    <span className="text-sm font-medium text-brand">
                      Express
                    </span>
                  </label>
                </div>
              </fieldset>
            </div>

            <button
              type="submit"
              className="mt-7 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-6 text-sm font-semibold text-white transition-colors hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-auto"
            >
              Calculate Shipping
            </button>

            {showMessage ? (
              <p
                role="status"
                className="mt-5 rounded-md border border-accent/25 bg-accent/5 px-4 py-3 text-sm leading-relaxed text-brand"
              >
                Shipping rates will be calculated here.
              </p>
            ) : null}
          </form>
        </div>
      </div>
    </section>
  );
}
