"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuthState } from "@/hooks/useAuthState";
import type {
  MarginBracket,
  ShippingSettings,
  WeightFeeSlab,
} from "@/lib/shipping/types";

type AdminRate = {
  id: string;
  countryCode: string;
  countryName: string;
  customerServiceTier: string | null;
  sourceServiceName: string;
  sourceSla: string | null;
  minWeightKg: number;
  maxWeightKg: number | null;
  weightSlabKg: number;
  baseAramexRate: number;
  sourceRate: number;
  fuelCharge: number | null;
  aramexLandedCost: number | null;
  shippingCharge: number | null;
  indiRouteFee: number | null;
  packingFee: number | null;
  finalCustomerPrice: number | null;
  active: boolean;
};

type CountryRow = {
  country_code: string;
  country_name: string;
  enabled: boolean;
};

type MappingRow = {
  id: string;
  country_code: string;
  country_name: string;
  customer_tier: string;
  source_service_id: number;
  source_service_name: string;
  source_sla: string;
  role: string;
  sort_order: number;
  active: boolean;
};

type NewBaseRateForm = {
  countryCode: string;
  serviceTier: "economy" | "standard";
  minWeightKg: string;
  maxWeightKg: string;
  baseAramexRate: string;
  currency: string;
  sourceSla: string;
  active: boolean;
};

const fieldClassName =
  "mt-1.5 min-h-11 w-full rounded-md border border-border bg-background px-3.5 text-sm text-brand outline-none focus:border-accent focus:ring-2 focus:ring-accent/25";

const labelClassName = "block text-sm font-semibold tracking-tight text-brand";

const emptyBaseRateForm = (countryCode = "AU"): NewBaseRateForm => ({
  countryCode,
  serviceTier: "standard",
  minWeightKg: "0",
  maxWeightKg: "0.5",
  baseAramexRate: "",
  currency: "INR",
  sourceSla: "",
  active: true,
});

export function ShippingRatesAdmin() {
  const { user } = useAuthState();
  const [tab, setTab] = useState<"rates" | "settings" | "mappings">("rates");
  const [rates, setRates] = useState<AdminRate[]>([]);
  const [settings, setSettings] = useState<ShippingSettings | null>(null);
  const [feeSlabs, setFeeSlabs] = useState<WeightFeeSlab[]>([]);
  const [marginBrackets, setMarginBrackets] = useState<MarginBracket[]>([]);
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [mappings, setMappings] = useState<MappingRow[]>([]);
  const [countryFilter, setCountryFilter] = useState("");
  const [newRate, setNewRate] = useState<NewBaseRateForm>(emptyBaseRateForm());
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const withAuth = useCallback(async () => {
    if (!user) throw new Error("Not signed in");
    return user.getIdToken();
  }, [user]);

  const loadRates = useCallback(async () => {
    const token = await withAuth();
    const params = new URLSearchParams({ limit: "250" });
    if (countryFilter) params.set("countryCode", countryFilter);
    const response = await fetch(`/api/admin/shipping/rates?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = (await response.json()) as {
      rates?: AdminRate[];
      error?: string;
    };
    if (!response.ok) throw new Error(payload.error || "Unable to load rates.");
    setRates(payload.rates ?? []);
  }, [countryFilter, withAuth]);

  const loadSettings = useCallback(async () => {
    const token = await withAuth();
    const response = await fetch("/api/admin/shipping/settings", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = (await response.json()) as {
      settings?: ShippingSettings;
      feeSlabs?: WeightFeeSlab[];
      packingSlabs?: WeightFeeSlab[];
      marginBrackets?: MarginBracket[];
      countries?: CountryRow[];
      mappings?: MappingRow[];
      error?: string;
    };
    if (!response.ok) {
      throw new Error(payload.error || "Unable to load settings.");
    }
    setSettings(payload.settings ?? null);
    setFeeSlabs(payload.feeSlabs ?? payload.packingSlabs ?? []);
    setMarginBrackets(payload.marginBrackets ?? []);
    setCountries(payload.countries ?? []);
    setMappings(payload.mappings ?? []);
  }, [withAuth]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([loadSettings(), loadRates()]);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [user, loadRates, loadSettings]);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings || !user) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const token = await withAuth();
      const response = await fetch("/api/admin/shipping/settings", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          settings,
          feeSlabs,
          marginBrackets,
          countries: countries.map((c) => ({
            country_code: c.country_code,
            enabled: c.enabled,
          })),
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to save settings.");
      }
      setMessage("Shipping settings saved.");
      await loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save.");
    } finally {
      setSaving(false);
    }
  }

  async function addBaseRate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const token = await withAuth();
      const response = await fetch("/api/admin/shipping/rates", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          countryCode: newRate.countryCode,
          serviceTier: newRate.serviceTier,
          minWeightKg: Number(newRate.minWeightKg),
          maxWeightKg:
            newRate.maxWeightKg.trim() === ""
              ? null
              : Number(newRate.maxWeightKg),
          baseAramexRate: Number(newRate.baseAramexRate),
          currency: newRate.currency || "INR",
          sourceSla: newRate.sourceSla || null,
          active: newRate.active,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to save base rate.");
      }
      setMessage("Aramex base rate saved. No invented rates were auto-filled.");
      setNewRate(emptyBaseRateForm(newRate.countryCode));
      await loadRates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save base rate.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBaseRate(id: string) {
    if (!user) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const token = await withAuth();
      const response = await fetch(
        `/api/admin/shipping/rates?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to delete base rate.");
      }
      setMessage("Base rate removed.");
      await loadRates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="rounded-xl border border-border bg-surface p-6 text-sm text-brand-muted">
        Loading shipping configuration…
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          Admin
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-brand">
          Shipping Rates & Settings
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-brand-muted">
          Aramex-style pricing: enter Base Aramex rates manually until the live
          API is connected. Customers never see fuel, margin, or supplier cost.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {(
            [
              ["rates", "Base Aramex rates"],
              ["settings", "Pricing settings"],
              ["mappings", "Service mapping"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={[
                "min-h-10 rounded-md px-4 text-sm font-semibold",
                tab === id
                  ? "bg-brand text-white"
                  : "border border-border bg-background text-brand",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {message}
        </p>
      ) : null}

      {tab === "rates" ? (
        <section className="space-y-6 rounded-xl border border-border bg-surface p-6 sm:p-8">
          <form
            onSubmit={addBaseRate}
            className="space-y-4 rounded-md border border-border bg-background p-4"
          >
            <h2 className="font-display text-lg font-bold text-brand">
              Add Aramex base rate
            </h2>
            <p className="text-sm text-brand-muted">
              Enter real Aramex rates only. This table stays empty until you add
              rows — nothing is invented.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className={labelClassName} htmlFor="new-country">
                  Country
                </label>
                <select
                  id="new-country"
                  className={fieldClassName}
                  value={newRate.countryCode}
                  onChange={(event) =>
                    setNewRate({ ...newRate, countryCode: event.target.value })
                  }
                >
                  {countries.map((country) => (
                    <option
                      key={country.country_code}
                      value={country.country_code}
                    >
                      {country.country_name} ({country.country_code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClassName} htmlFor="new-tier">
                  Service tier
                </label>
                <select
                  id="new-tier"
                  className={fieldClassName}
                  value={newRate.serviceTier}
                  onChange={(event) =>
                    setNewRate({
                      ...newRate,
                      serviceTier: event.target.value as "economy" | "standard",
                    })
                  }
                >
                  <option value="economy">Economy</option>
                  <option value="standard">Standard</option>
                </select>
              </div>
              <div>
                <label className={labelClassName} htmlFor="new-min-kg">
                  Weight from (kg)
                </label>
                <input
                  id="new-min-kg"
                  type="number"
                  step="any"
                  min="0"
                  required
                  className={fieldClassName}
                  value={newRate.minWeightKg}
                  onChange={(event) =>
                    setNewRate({ ...newRate, minWeightKg: event.target.value })
                  }
                />
              </div>
              <div>
                <label className={labelClassName} htmlFor="new-max-kg">
                  Weight to (kg)
                </label>
                <input
                  id="new-max-kg"
                  type="number"
                  step="any"
                  min="0"
                  className={fieldClassName}
                  value={newRate.maxWeightKg}
                  placeholder="No max"
                  onChange={(event) =>
                    setNewRate({ ...newRate, maxWeightKg: event.target.value })
                  }
                />
              </div>
              <div>
                <label className={labelClassName} htmlFor="new-base">
                  Base Aramex rate (₹)
                </label>
                <input
                  id="new-base"
                  type="number"
                  step="any"
                  min="0"
                  required
                  className={fieldClassName}
                  value={newRate.baseAramexRate}
                  onChange={(event) =>
                    setNewRate({
                      ...newRate,
                      baseAramexRate: event.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className={labelClassName} htmlFor="new-currency">
                  Currency
                </label>
                <input
                  id="new-currency"
                  className={fieldClassName}
                  value={newRate.currency}
                  onChange={(event) =>
                    setNewRate({ ...newRate, currency: event.target.value })
                  }
                />
              </div>
              <div>
                <label className={labelClassName} htmlFor="new-sla">
                  Estimated delivery (optional)
                </label>
                <input
                  id="new-sla"
                  className={fieldClassName}
                  value={newRate.sourceSla}
                  placeholder="e.g. 10–15 Business Days"
                  onChange={(event) =>
                    setNewRate({ ...newRate, sourceSla: event.target.value })
                  }
                />
              </div>
              <div className="flex items-end">
                <label className="inline-flex min-h-11 items-center gap-2 text-sm text-brand">
                  <input
                    type="checkbox"
                    checked={newRate.active}
                    onChange={(event) =>
                      setNewRate({ ...newRate, active: event.target.checked })
                    }
                  />
                  Active
                </label>
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="min-h-11 rounded-md bg-brand px-5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save base rate"}
            </button>
          </form>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="country-filter" className={labelClassName}>
                Filter country
              </label>
              <select
                id="country-filter"
                value={countryFilter}
                onChange={(event) => setCountryFilter(event.target.value)}
                className={fieldClassName}
              >
                <option value="">All</option>
                {countries.map((country) => (
                  <option
                    key={country.country_code}
                    value={country.country_code}
                  >
                    {country.country_name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => void loadRates()}
              className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-brand"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-border text-brand-muted">
                <tr>
                  <th className="px-2 py-2 font-semibold">Country</th>
                  <th className="px-2 py-2 font-semibold">Tier</th>
                  <th className="px-2 py-2 font-semibold">Weight</th>
                  <th className="px-2 py-2 font-semibold">Base</th>
                  <th className="px-2 py-2 font-semibold">Fuel</th>
                  <th className="px-2 py-2 font-semibold">Landed</th>
                  <th className="px-2 py-2 font-semibold">Selling</th>
                  <th className="px-2 py-2 font-semibold">IndiRoute fee</th>
                  <th className="px-2 py-2 font-semibold">Final</th>
                  <th className="px-2 py-2 font-semibold">SLA</th>
                  <th className="px-2 py-2 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {rates.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="px-2 py-6 text-sm text-brand-muted"
                    >
                      No base rates yet. Add admin-entered Aramex rates above
                      (or switch to live API later). Quotes will not invent
                      prices.
                    </td>
                  </tr>
                ) : (
                  rates.map((rate) => (
                    <tr key={rate.id} className="border-b border-border/70">
                      <td className="px-2 py-2 text-brand">
                        {rate.countryCode}
                      </td>
                      <td className="px-2 py-2">
                        {rate.customerServiceTier ?? "—"}
                      </td>
                      <td className="px-2 py-2">
                        {rate.minWeightKg}
                        {rate.maxWeightKg == null
                          ? "+"
                          : `–${rate.maxWeightKg}`}{" "}
                        kg
                      </td>
                      <td className="px-2 py-2">₹{rate.baseAramexRate}</td>
                      <td className="px-2 py-2">
                        {rate.fuelCharge != null ? `₹${rate.fuelCharge}` : "—"}
                      </td>
                      <td className="px-2 py-2">
                        {rate.aramexLandedCost != null
                          ? `₹${rate.aramexLandedCost}`
                          : "—"}
                      </td>
                      <td className="px-2 py-2">
                        {rate.shippingCharge != null
                          ? `₹${rate.shippingCharge}`
                          : "—"}
                      </td>
                      <td className="px-2 py-2">
                        {(rate.indiRouteFee ?? rate.packingFee) != null
                          ? `₹${rate.indiRouteFee ?? rate.packingFee}`
                          : "—"}
                      </td>
                      <td className="px-2 py-2 font-semibold text-brand">
                        {rate.finalCustomerPrice != null
                          ? `₹${rate.finalCustomerPrice}`
                          : "—"}
                      </td>
                      <td className="px-2 py-2">{rate.sourceSla ?? "—"}</td>
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void deleteBaseRate(rate.id)}
                          className="text-red-700 underline-offset-2 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === "settings" && settings ? (
        <form
          onSubmit={saveSettings}
          className="space-y-6 rounded-xl border border-border bg-surface p-6 sm:p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label
                className={labelClassName}
                htmlFor="aramex_fuel_surcharge_percent"
              >
                Aramex fuel surcharge %
              </label>
              <input
                id="aramex_fuel_surcharge_percent"
                type="number"
                step="any"
                min="0"
                className={fieldClassName}
                value={settings.aramex_fuel_surcharge_percent}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    aramex_fuel_surcharge_percent: Number(event.target.value),
                  })
                }
              />
              <p className="mt-1 text-xs text-brand-muted">
                Update when Aramex publishes a new surcharge (default 23.25).
              </p>
            </div>
            <div>
              <label className={labelClassName} htmlFor="volumetric_divisor">
                Volumetric divisor
              </label>
              <input
                id="volumetric_divisor"
                type="number"
                step="1"
                min="1"
                className={fieldClassName}
                value={settings.volumetric_divisor}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    volumetric_divisor: Number(event.target.value),
                  })
                }
              />
              <p className="mt-1 text-xs text-brand-muted">
                (L × W × H) cm ÷ divisor. Default 5000.
              </p>
            </div>
            <div>
              <label
                className={labelClassName}
                htmlFor="final_price_round_to_inr"
              >
                Final round-up (₹)
              </label>
              <input
                id="final_price_round_to_inr"
                type="number"
                step="1"
                min="1"
                className={fieldClassName}
                value={settings.final_price_round_to_inr}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    final_price_round_to_inr: Number(event.target.value),
                  })
                }
              />
            </div>
            <div>
              <label className={labelClassName} htmlFor="base_rate_source">
                Base rate source
              </label>
              <select
                id="base_rate_source"
                className={fieldClassName}
                value={settings.base_rate_source}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    base_rate_source: event.target
                      .value as ShippingSettings["base_rate_source"],
                  })
                }
              >
                <option value="admin_table">Admin rate table</option>
                <option value="aramex_api">
                  Live Aramex API (falls back to table)
                </option>
              </select>
            </div>
            <div>
              <label className={labelClassName} htmlFor="quote_validity_hours">
                Quote validity (hours)
              </label>
              <input
                id="quote_validity_hours"
                type="number"
                step="1"
                min="1"
                className={fieldClassName}
                value={settings.quote_validity_hours}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    quote_validity_hours: Number(event.target.value),
                  })
                }
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            {(
              [
                ["economy_enabled", "Enable Economy"],
                ["standard_enabled", "Enable Standard"],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="inline-flex items-center gap-2 text-sm text-brand"
              >
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={(event) =>
                    setSettings({ ...settings, [key]: event.target.checked })
                  }
                />
                {label}
              </label>
            ))}
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-brand">
              IndiRoute margin brackets
            </h2>
            <p className="mt-1 text-sm text-brand-muted">
              Applied to AramexLandedCost (base + fuel).
            </p>
            <div className="mt-3 space-y-3">
              {marginBrackets.map((bracket, index) => (
                <div
                  key={`${bracket.min_amount_inr}-${index}`}
                  className="grid gap-3 sm:grid-cols-3"
                >
                  <div>
                    <label className={labelClassName}>Min ₹</label>
                    <input
                      type="number"
                      step="any"
                      className={fieldClassName}
                      value={bracket.min_amount_inr}
                      onChange={(event) => {
                        const next = [...marginBrackets];
                        next[index] = {
                          ...bracket,
                          min_amount_inr: Number(event.target.value),
                        };
                        setMarginBrackets(next);
                      }}
                    />
                  </div>
                  <div>
                    <label className={labelClassName}>Max ₹</label>
                    <input
                      type="number"
                      step="any"
                      className={fieldClassName}
                      value={bracket.max_amount_inr ?? ""}
                      placeholder="No max"
                      onChange={(event) => {
                        const next = [...marginBrackets];
                        next[index] = {
                          ...bracket,
                          max_amount_inr:
                            event.target.value === ""
                              ? null
                              : Number(event.target.value),
                        };
                        setMarginBrackets(next);
                      }}
                    />
                  </div>
                  <div>
                    <label className={labelClassName}>Margin %</label>
                    <input
                      type="number"
                      step="any"
                      className={fieldClassName}
                      value={bracket.margin_percent}
                      onChange={(event) => {
                        const next = [...marginBrackets];
                        next[index] = {
                          ...bracket,
                          margin_percent: Number(event.target.value),
                        };
                        setMarginBrackets(next);
                      }}
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="text-sm font-semibold text-brand underline-offset-2 hover:underline"
                onClick={() =>
                  setMarginBrackets([
                    ...marginBrackets,
                    {
                      min_amount_inr: 0,
                      max_amount_inr: null,
                      margin_percent: 8,
                    },
                  ])
                }
              >
                Add margin bracket
              </button>
            </div>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-brand">
              IndiRoute fee weight slabs
            </h2>
            <p className="mt-1 text-sm text-brand-muted">
              Combined processing fee by chargeable weight (one line on the
              quote).
            </p>
            <div className="mt-3 space-y-3">
              {feeSlabs.map((slab, index) => (
                <div
                  key={`${slab.min_kg}-${index}`}
                  className="grid gap-3 sm:grid-cols-3"
                >
                  <div>
                    <label className={labelClassName}>From kg</label>
                    <input
                      type="number"
                      step="any"
                      className={fieldClassName}
                      value={slab.min_kg}
                      onChange={(event) => {
                        const next = [...feeSlabs];
                        next[index] = {
                          ...slab,
                          min_kg: Number(event.target.value),
                        };
                        setFeeSlabs(next);
                      }}
                    />
                  </div>
                  <div>
                    <label className={labelClassName}>To kg</label>
                    <input
                      type="number"
                      step="any"
                      className={fieldClassName}
                      value={slab.max_kg ?? ""}
                      placeholder="No max"
                      onChange={(event) => {
                        const next = [...feeSlabs];
                        next[index] = {
                          ...slab,
                          max_kg:
                            event.target.value === ""
                              ? null
                              : Number(event.target.value),
                        };
                        setFeeSlabs(next);
                      }}
                    />
                  </div>
                  <div>
                    <label className={labelClassName}>Fee ₹</label>
                    <input
                      type="number"
                      step="any"
                      className={fieldClassName}
                      value={slab.fee_inr}
                      onChange={(event) => {
                        const next = [...feeSlabs];
                        next[index] = {
                          ...slab,
                          fee_inr: Number(event.target.value),
                        };
                        setFeeSlabs(next);
                      }}
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="text-sm font-semibold text-brand underline-offset-2 hover:underline"
                onClick={() =>
                  setFeeSlabs([
                    ...feeSlabs,
                    { min_kg: 0, max_kg: null, fee_inr: 0 },
                  ])
                }
              >
                Add fee slab
              </button>
            </div>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-brand">
              Countries
            </h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {countries.map((country, index) => (
                <label
                  key={country.country_code}
                  className="inline-flex items-center gap-2 text-sm text-brand"
                >
                  <input
                    type="checkbox"
                    checked={country.enabled}
                    onChange={(event) => {
                      const next = [...countries];
                      next[index] = {
                        ...country,
                        enabled: event.target.checked,
                      };
                      setCountries(next);
                    }}
                  />
                  {country.country_name} ({country.country_code})
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="min-h-11 rounded-md bg-accent px-5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save settings"}
          </button>
        </form>
      ) : null}

      {tab === "mappings" ? (
        <section className="overflow-x-auto rounded-xl border border-border bg-surface p-6 sm:p-8">
          <p className="mb-4 text-sm text-brand-muted">
            Internal SLA / mapping labels for Economy and Standard. Customers
            only see IndiRoute product names. Base prices come from the Aramex
            rate table or future API.
          </p>
          <table className="min-w-full text-left text-xs">
            <thead className="border-b border-border text-brand-muted">
              <tr>
                <th className="px-2 py-2">Country</th>
                <th className="px-2 py-2">Tier</th>
                <th className="px-2 py-2">Role</th>
                <th className="px-2 py-2">Service</th>
                <th className="px-2 py-2">ID</th>
                <th className="px-2 py-2">SLA</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((row) => (
                <tr key={row.id} className="border-b border-border/70">
                  <td className="px-2 py-2">{row.country_code}</td>
                  <td className="px-2 py-2">{row.customer_tier}</td>
                  <td className="px-2 py-2">{row.role}</td>
                  <td className="px-2 py-2">{row.source_service_name}</td>
                  <td className="px-2 py-2">{row.source_service_id}</td>
                  <td className="px-2 py-2">{row.source_sla}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  );
}
