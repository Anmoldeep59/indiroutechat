"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

const countries = [
  "Australia",
  "United States",
  "United Kingdom",
  "Canada",
  "New Zealand",
] as const;

type ShippingRate = {
  id: string;
  destination_country: string;
  service_type: string;
  min_weight_kg: number;
  max_weight_kg: number | null;
  base_rate: number;
  per_kg_rate: number;
  currency: string;
};

const fieldClassName =
  "mt-1.5 min-h-11 w-full rounded-md border border-border bg-background px-3.5 text-sm text-brand outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25";

const labelClassName = "block text-sm font-semibold tracking-tight text-brand";

export function DashboardShippingCalculator() {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<string | null>(null);
  const [loadingRates, setLoadingRates] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadRates() {
      setLoadingRates(true);
      const { data, error } = await supabase
        .from("shipping_rates")
        .select(
          "id, destination_country, service_type, min_weight_kg, max_weight_kg, base_rate, per_kg_rate, currency",
        )
        .eq("is_active", true);

      if (cancelled) return;

      if (error) {
        setLoadError(
          "Shipping rates could not be loaded yet. Add Supabase credentials and run the schema migration.",
        );
        setRates([]);
      } else {
        setLoadError(null);
        setRates((data as ShippingRate[]) ?? []);
      }
      setLoadingRates(false);
    }

    void loadRates();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const country = String(formData.get("destinationCountry") ?? "");
    const weight = Number(formData.get("weight") ?? 0);
    const serviceType = String(formData.get("shippingSpeed") ?? "economy");

    const match = rates.find(
      (rate) =>
        rate.destination_country === country &&
        rate.service_type === serviceType &&
        weight >= Number(rate.min_weight_kg) &&
        (rate.max_weight_kg == null || weight <= Number(rate.max_weight_kg)),
    );

    if (!match) {
      setEstimate(
        "No configured rate matched this destination, weight, and service type yet.",
      );
      return;
    }

    const billableWeight = Math.max(weight, 0);
    const total =
      Number(match.base_rate) + billableWeight * Number(match.per_kg_rate);
    setEstimate(
      `Estimated shipping: ${match.currency} ${total.toFixed(2)} (${match.service_type})`,
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(12,35,64,0.04)] sm:p-8">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          Shipping Calculator
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-brand sm:text-3xl">
          Estimate Your Shipping
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-brand-muted sm:text-base">
          Rates are loaded from Supabase configuration, not hardcoded into the
          UI.
        </p>
      </section>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(12,35,64,0.04)] sm:p-8"
      >
        {loadError ? (
          <p className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {loadError}
          </p>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="destination-country" className={labelClassName}>
              Destination Country
            </label>
            <select
              id="destination-country"
              name="destinationCountry"
              defaultValue="Australia"
              className={fieldClassName}
            >
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="weight" className={labelClassName}>
              Parcel Weight (kg)
            </label>
            <input
              id="weight"
              name="weight"
              type="number"
              min="0"
              step="0.1"
              defaultValue="1"
              className={fieldClassName}
            />
          </div>
          <div>
            <label htmlFor="length" className={labelClassName}>
              Length (cm)
            </label>
            <input id="length" name="length" type="number" min="0" className={fieldClassName} />
          </div>
          <div>
            <label htmlFor="width" className={labelClassName}>
              Width (cm)
            </label>
            <input id="width" name="width" type="number" min="0" className={fieldClassName} />
          </div>
          <div>
            <label htmlFor="height" className={labelClassName}>
              Height (cm)
            </label>
            <input id="height" name="height" type="number" min="0" className={fieldClassName} />
          </div>
          <fieldset className="sm:col-span-2">
            <legend className={labelClassName}>Shipping Speed</legend>
            <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
              <label className="flex min-h-11 items-center gap-3 rounded-md border border-border bg-background px-3.5">
                <input
                  type="radio"
                  name="shippingSpeed"
                  value="economy"
                  defaultChecked
                />
                <span className="text-sm font-medium text-brand">Economy</span>
              </label>
              <label className="flex min-h-11 items-center gap-3 rounded-md border border-border bg-background px-3.5">
                <input type="radio" name="shippingSpeed" value="express" />
                <span className="text-sm font-medium text-brand">Express</span>
              </label>
            </div>
          </fieldset>
        </div>

        <button
          type="submit"
          disabled={loadingRates}
          className="mt-7 inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-6 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          Calculate Shipping
        </button>

        {estimate ? (
          <p className="mt-5 rounded-md border border-accent/25 bg-accent/5 px-4 py-3 text-sm text-brand">
            {estimate}
          </p>
        ) : null}
      </form>
    </div>
  );
}
