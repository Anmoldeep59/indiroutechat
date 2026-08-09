"use client";

import { useEffect, useState, type FormEvent } from "react";
import { QuoteResults } from "@/components/shipping/QuoteResults";
import type { QuoteResult } from "@/lib/shipping/types";

type CountryOption = {
  code: string;
  name: string;
  flag: string;
};

const fieldClassName =
  "mt-1.5 min-h-11 w-full rounded-md border border-border bg-background px-3.5 text-sm text-brand outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25";

const labelClassName = "block text-sm font-semibold tracking-tight text-brand";

export function DashboardShippingCalculator() {
  const [countries, setCountries] = useState<CountryOption[]>([]);
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
        if (!cancelled) setCountries(payload.countries ?? []);
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
          actualWeightKg: Number(form.get("weight") ?? 0),
          lengthCm: Number(form.get("length") ?? 0),
          widthCm: Number(form.get("width") ?? 0),
          heightCm: Number(form.get("height") ?? 0),
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

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(12,35,64,0.04)] sm:p-8">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          Shipping Calculator
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-brand sm:text-3xl">
          Estimate Your Shipping
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-brand-muted sm:text-base">
          Prices are calculated server-side from IndiRoute shipping settings.
          Source courier brands are never shown.
        </p>
      </section>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(12,35,64,0.04)] sm:p-8"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="origin" className={labelClassName}>
              Origin
            </label>
            <input
              id="origin"
              value="India"
              readOnly
              className={`${fieldClassName} cursor-not-allowed text-brand-muted`}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="destination-country" className={labelClassName}>
              Destination Country
            </label>
            <select
              id="destination-country"
              name="destinationCountry"
              required
              defaultValue={countries[0]?.code ?? ""}
              className={fieldClassName}
            >
              {countries.length === 0 ? (
                <option value="" disabled>
                  Loading countries…
                </option>
              ) : null}
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
              className={fieldClassName}
            />
          </div>

          <div>
            <label htmlFor="postcode" className={labelClassName}>
              Postcode
            </label>
            <input id="postcode" name="postcode" className={fieldClassName} />
          </div>

          <div>
            <label htmlFor="weight" className={labelClassName}>
              Actual Weight (kg)
            </label>
            <input
              id="weight"
              name="weight"
              type="number"
              min="0.01"
              step="0.01"
              defaultValue="1"
              required
              className={fieldClassName}
            />
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
              defaultValue="1"
              className={fieldClassName}
            />
          </div>

          <div>
            <label htmlFor="length" className={labelClassName}>
              Length (cm)
            </label>
            <input
              id="length"
              name="length"
              type="number"
              min="0"
              step="0.1"
              className={fieldClassName}
            />
          </div>
          <div>
            <label htmlFor="width" className={labelClassName}>
              Width (cm)
            </label>
            <input
              id="width"
              name="width"
              type="number"
              min="0"
              step="0.1"
              className={fieldClassName}
            />
          </div>
          <div>
            <label htmlFor="height" className={labelClassName}>
              Height (cm)
            </label>
            <input
              id="height"
              name="height"
              type="number"
              min="0"
              step="0.1"
              className={fieldClassName}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-7 inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-6 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {loading ? "Calculating…" : "Calculate Shipping"}
        </button>

        {error ? (
          <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {error}
          </p>
        ) : null}

        {quote ? (
          <div className="mt-6">
            <QuoteResults
              quote={quote}
              selectedTier={selectedTier}
              onSelect={setSelectedTier}
            />
          </div>
        ) : null}
      </form>
    </div>
  );
}
