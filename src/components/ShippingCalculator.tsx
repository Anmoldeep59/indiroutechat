"use client";

import { useState, type FormEvent } from "react";
import { WeightScale } from "./illustrations";
import { MotionReveal } from "./Motion";

const countries = [
  "Australia",
  "United States",
  "United Kingdom",
  "Canada",
  "New Zealand",
] as const;

const countryFlags: Record<string, string> = {
  Australia: "🇦🇺",
  "United States": "🇺🇸",
  "United Kingdom": "🇬🇧",
  Canada: "🇨🇦",
  "New Zealand": "🇳🇿",
};

const fieldClassName =
  "mt-1.5 min-h-11 w-full rounded-md border border-border bg-background px-3.5 text-sm text-brand outline-none transition-colors placeholder:text-brand-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/25";

const labelClassName =
  "block text-sm font-semibold tracking-tight text-brand";

export function ShippingCalculator() {
  const [showMessage, setShowMessage] = useState(false);
  const [destination, setDestination] = useState("");

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
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <MotionReveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Instant estimate
            </p>
            <h2
              id="shipping-calculator-heading"
              className="mt-3 font-display text-3xl font-bold tracking-tight text-brand sm:text-4xl"
            >
              Estimate Your Shipping
            </h2>
            <p className="mt-4 text-base leading-relaxed text-brand-muted sm:text-lg">
              Get a quick estimate for shipping your parcel from India to your
              destination.
            </p>
            <div className="mt-5 flex justify-center">
              <WeightScale className="h-14 w-auto opacity-80" />
            </div>
          </div>
        </MotionReveal>

        <MotionReveal className="mx-auto mt-12 max-w-5xl sm:mt-14 lg:mt-16" delay={100}>
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.35fr]">
            {/* route visual */}
            <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-brand-deep p-6 shadow-[0_16px_40px_rgba(12,35,64,0.3)] sm:p-7">
              <div className="pattern-jaali pointer-events-none absolute inset-0" aria-hidden="true" />

              <div className="relative">
                <p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                  Route preview
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-xl">
                    🇮🇳
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">India</p>
                    <p className="text-xs text-white/60">IndiRoute warehouse</p>
                  </div>
                </div>

                <svg viewBox="0 0 60 84" className="ml-5 h-20 w-auto" aria-hidden="true">
                  <path
                    d="M6 2c24 18 24 62 0 80"
                    fill="none"
                    stroke="#e86a17"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="route-line"
                  />
                  <g className="motion-only">
                    <circle r="3.5" fill="#ffffff">
                      <animateMotion
                        dur="3.2s"
                        repeatCount="indefinite"
                        path="M6 2c24 18 24 62 0 80"
                      />
                    </circle>
                  </g>
                </svg>

                <div className="flex items-center gap-3">
                  <span
                    key={destination || "none"}
                    className="animate-scale-in flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-xl"
                  >
                    {destination ? countryFlags[destination] : "🌏"}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {destination || "Your destination"}
                    </p>
                    <p className="text-xs text-white/60">
                      {destination ? "Door-to-door delivery" : "Select a country"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative mt-8 flex items-center gap-4 border-t border-white/10 pt-5">
                <svg viewBox="0 0 40 40" className="h-9 w-9" aria-hidden="true">
                  <rect x="6" y="10" width="22" height="18" rx="3" fill="none" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="2" />
                  <line x1="17" y1="10" x2="17" y2="28" stroke="#e86a17" strokeWidth="2.5" />
                  <path d="M4 34h28" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
                  <path d="M13 34l4-6 4 6" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.75" fill="none" />
                </svg>
                <p className="text-xs leading-relaxed text-white/70">
                  Weighed and measured at the warehouse — you approve the final
                  quote before anything ships.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              noValidate
              className="rounded-2xl border border-border bg-surface p-6 shadow-[0_8px_32px_rgba(12,35,64,0.07)] sm:p-8"
            >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="destination-country" className={labelClassName}>
                  Destination Country
                </label>
                <select
                  id="destination-country"
                  name="destinationCountry"
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
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
              className="mt-7 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-6 text-sm font-semibold text-white shadow-[0_2px_10px_rgba(232,106,23,0.28)] transition-all duration-200 hover:bg-accent-hover hover:shadow-[0_8px_22px_rgba(232,106,23,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-safe:hover:-translate-y-0.5 active:scale-[0.98] sm:w-auto"
            >
              Calculate Shipping
            </button>

            {showMessage ? (
              <p
                role="status"
                className="animate-fade-up mt-5 rounded-md border border-accent/25 bg-accent/5 px-4 py-3 text-sm leading-relaxed text-brand"
              >
                Shipping rates will be calculated here.
              </p>
            ) : null}
            </form>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}
