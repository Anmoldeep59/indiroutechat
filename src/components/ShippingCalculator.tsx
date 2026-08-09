"use client";

import { useEffect, useState, type FormEvent } from "react";
import { WeightScale } from "./illustrations";
import { MotionReveal } from "./Motion";
import { QuoteResults } from "@/components/shipping/QuoteResults";
import { COUNTRY_FLAGS } from "@/lib/shipping/countries";
import type { QuoteResult } from "@/lib/shipping/types";

type CountryOption = {
  code: string;
  name: string;
  flag: string;
};

const fieldClassName =
  "mt-1.5 min-h-11 w-full rounded-md border border-border bg-background px-3.5 text-sm text-brand outline-none transition-colors placeholder:text-brand-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/25";

const labelClassName =
  "block text-sm font-semibold tracking-tight text-brand";

export function ShippingCalculator() {
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadCountries() {
      try {
        const response = await fetch("/api/shipping/countries");
        const payload = (await response.json()) as {
          countries?: CountryOption[];
        };
        if (!cancelled) {
          setCountries(payload.countries ?? []);
        }
      } catch {
        if (!cancelled) setCountries([]);
      }
    }
    void loadCountries();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setQuote(null);
    setSelectedTier(null);

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/shipping/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryCode: String(form.get("destinationCountry") ?? ""),
          city: String(form.get("destinationCity") ?? ""),
          postcode: String(form.get("postcode") ?? ""),
          actualWeightKg: Number(form.get("parcelWeight") ?? 0),
          lengthCm: Number(form.get("packageLength") ?? 0),
          widthCm: Number(form.get("packageWidth") ?? 0),
          heightCm: Number(form.get("packageHeight") ?? 0),
          pieces: Number(form.get("pieces") ?? 1),
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        quote?: QuoteResult;
        error?: string;
      } | null;

      if (!response.ok || !payload?.quote) {
        setError(payload?.error || "Unable to calculate shipping.");
        return;
      }

      setQuote(payload.quote);
    } catch {
      setError("Unable to calculate shipping.");
    } finally {
      setLoading(false);
    }
  }

  const selectedCountry = countries.find((c) => c.code === destination);

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
              Get an IndiRoute quote for shipping your parcel from India to your
              destination.
            </p>
            <div className="mt-5 flex justify-center">
              <WeightScale className="h-14 w-auto opacity-80" />
            </div>
          </div>
        </MotionReveal>

        <MotionReveal className="mx-auto mt-12 max-w-5xl sm:mt-14 lg:mt-16" delay={100}>
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.35fr]">
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
                    <p className="text-xs text-white/60">Origin (fixed)</p>
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
                  <span className="animate-scale-in flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-xl">
                    {selectedCountry
                      ? selectedCountry.flag
                      : destination
                        ? COUNTRY_FLAGS[destination] ?? "🌏"
                        : "🌏"}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {selectedCountry?.name || "Your destination"}
                    </p>
                    <p className="text-xs text-white/60">
                      {selectedCountry ? "Door-to-door delivery" : "Select a country"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative mt-8 border-t border-white/10 pt-5">
                <p className="text-xs leading-relaxed text-white/70">
                  Ships from India. Final warehouse measurements may adjust the
                  chargeable weight before you approve payment.
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
                  <label htmlFor="origin-country" className={labelClassName}>
                    Origin
                  </label>
                  <input
                    id="origin-country"
                    value="India"
                    readOnly
                    className={`${fieldClassName} cursor-not-allowed bg-background/70 text-brand-muted`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="destination-country" className={labelClassName}>
                    Destination Country
                  </label>
                  <select
                    id="destination-country"
                    name="destinationCountry"
                    value={destination}
                    required
                    onChange={(event) => setDestination(event.target.value)}
                    className={fieldClassName}
                  >
                    <option value="" disabled>
                      Select a country
                    </option>
                    {countries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="destination-city" className={labelClassName}>
                    Destination City
                  </label>
                  <input
                    id="destination-city"
                    name="destinationCity"
                    type="text"
                    placeholder="City"
                    className={fieldClassName}
                  />
                </div>

                <div>
                  <label htmlFor="postcode" className={labelClassName}>
                    Postcode
                  </label>
                  <input
                    id="postcode"
                    name="postcode"
                    type="text"
                    placeholder="Postcode"
                    className={fieldClassName}
                  />
                </div>

                <div>
                  <label htmlFor="parcel-weight" className={labelClassName}>
                    Actual Weight
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="parcel-weight"
                      name="parcelWeight"
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      inputMode="decimal"
                      placeholder="0.00"
                      className={`${fieldClassName} mt-0 pr-12`}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm font-medium text-brand-muted">
                      kg
                    </span>
                  </div>
                </div>

                <div>
                  <label htmlFor="pieces" className={labelClassName}>
                    Number of Parcels
                  </label>
                  <input
                    id="pieces"
                    name="pieces"
                    type="number"
                    min="1"
                    step="1"
                    defaultValue={1}
                    className={fieldClassName}
                  />
                </div>

                <div>
                  <label htmlFor="package-length" className={labelClassName}>
                    Length
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="package-length"
                      name="packageLength"
                      type="number"
                      min="0"
                      step="0.1"
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
                    Width
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="package-width"
                      name="packageWidth"
                      type="number"
                      min="0"
                      step="0.1"
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
                    Height
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="package-height"
                      name="packageHeight"
                      type="number"
                      min="0"
                      step="0.1"
                      inputMode="decimal"
                      placeholder="0"
                      className={`${fieldClassName} mt-0 pr-12`}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm font-medium text-brand-muted">
                      cm
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-7 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-6 text-sm font-semibold text-white shadow-[0_2px_10px_rgba(232,106,23,0.28)] transition-all duration-200 hover:bg-accent-hover hover:shadow-[0_8px_22px_rgba(232,106,23,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-safe:hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 sm:w-auto"
              >
                {loading ? "Calculating…" : "Calculate Shipping"}
              </button>

              {error ? (
                <p
                  role="alert"
                  className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
                >
                  {error}
                </p>
              ) : null}

              {quote ? (
                <div className="animate-fade-up mt-6">
                  <QuoteResults
                    quote={quote}
                    selectedTier={selectedTier}
                    onSelect={setSelectedTier}
                  />
                </div>
              ) : null}
            </form>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}
