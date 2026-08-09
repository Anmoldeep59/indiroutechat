"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuthState } from "@/hooks/useAuthState";
import type { PackingFeeSlab, ShippingSettings } from "@/lib/shipping/types";

type AdminRate = {
  id: string;
  countryCode: string;
  countryName: string;
  customerServiceTier: string | null;
  sourceServiceName: string;
  sourceServiceId: number;
  sourceSla: string | null;
  weightSlabKg: number;
  sourceRate: number;
  shippingCharge: number | null;
  handlingFee: number | null;
  serviceFee: number | null;
  packingFee: number | null;
  gst: number | null;
  finalCustomerPrice: number | null;
  blockedIndiaPost: boolean;
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

const fieldClassName =
  "mt-1.5 min-h-11 w-full rounded-md border border-border bg-background px-3.5 text-sm text-brand outline-none focus:border-accent focus:ring-2 focus:ring-accent/25";

const labelClassName = "block text-sm font-semibold tracking-tight text-brand";

export function ShippingRatesAdmin() {
  const { user } = useAuthState();
  const [tab, setTab] = useState<"rates" | "settings" | "mappings">("rates");
  const [rates, setRates] = useState<AdminRate[]>([]);
  const [settings, setSettings] = useState<ShippingSettings | null>(null);
  const [packingSlabs, setPackingSlabs] = useState<PackingFeeSlab[]>([]);
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [mappings, setMappings] = useState<MappingRow[]>([]);
  const [countryFilter, setCountryFilter] = useState("");
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
      packingSlabs?: PackingFeeSlab[];
      countries?: CountryRow[];
      mappings?: MappingRow[];
      error?: string;
    };
    if (!response.ok) {
      throw new Error(payload.error || "Unable to load settings.");
    }
    setSettings(payload.settings ?? null);
    setPackingSlabs(payload.packingSlabs ?? []);
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
          packingSlabs,
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

  async function seedRates() {
    if (!user) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const token = await withAuth();
      const response = await fetch("/api/admin/shipping/rates/import", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode: "seed" }),
      });
      const payload = (await response.json()) as {
        imported?: number;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || "Seed failed.");
      }
      setMessage(`Seeded ${payload.imported ?? 0} rate rows.`);
      await loadRates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Seed failed.");
    } finally {
      setSaving(false);
    }
  }

  async function importJsonFile(file: File) {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { rows?: unknown[] } | unknown[];
      const rows = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.rows)
          ? parsed.rows
          : null;
      if (!rows) {
        throw new Error("JSON must be an array or { rows: [] }.");
      }
      const token = await withAuth();
      const response = await fetch("/api/admin/shipping/rates/import", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode: "upsert", rows }),
      });
      const payload = (await response.json()) as {
        imported?: number;
        skippedIndiaPost?: number;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || "Import failed.");
      }
      setMessage(
        `Imported ${payload.imported ?? 0} rows. Skipped India Post: ${payload.skippedIndiaPost ?? 0}.`,
      );
      await loadRates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
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
          Customer quotes never expose source courier brands. This view is for
          audit, fee control, and ratecard import only.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {(
            [
              ["rates", "Rate view"],
              ["settings", "Settings"],
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
        <section className="space-y-4 rounded-xl border border-border bg-surface p-6 sm:p-8">
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
                  <option key={country.country_code} value={country.country_code}>
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
            <button
              type="button"
              disabled={saving}
              onClick={() => void seedRates()}
              className="min-h-11 rounded-md bg-brand px-4 text-sm font-semibold text-white"
            >
              Load seed rates
            </button>
            <label className="inline-flex min-h-11 cursor-pointer items-center rounded-md border border-border px-4 text-sm font-semibold text-brand">
              Import JSON ratecard
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void importJsonFile(file);
                }}
              />
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-border text-brand-muted">
                <tr>
                  <th className="px-2 py-2 font-semibold">Country</th>
                  <th className="px-2 py-2 font-semibold">Tier</th>
                  <th className="px-2 py-2 font-semibold">Source service</th>
                  <th className="px-2 py-2 font-semibold">ID</th>
                  <th className="px-2 py-2 font-semibold">SLA</th>
                  <th className="px-2 py-2 font-semibold">Slab kg</th>
                  <th className="px-2 py-2 font-semibold">Source</th>
                  <th className="px-2 py-2 font-semibold">+Markup</th>
                  <th className="px-2 py-2 font-semibold">Fees</th>
                  <th className="px-2 py-2 font-semibold">GST</th>
                  <th className="px-2 py-2 font-semibold">Final</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((rate) => (
                  <tr key={rate.id} className="border-b border-border/70">
                    <td className="px-2 py-2 text-brand">{rate.countryCode}</td>
                    <td className="px-2 py-2">{rate.customerServiceTier ?? "—"}</td>
                    <td className="px-2 py-2">{rate.sourceServiceName}</td>
                    <td className="px-2 py-2">{rate.sourceServiceId}</td>
                    <td className="px-2 py-2">{rate.sourceSla ?? "—"}</td>
                    <td className="px-2 py-2">{rate.weightSlabKg}</td>
                    <td className="px-2 py-2">₹{rate.sourceRate}</td>
                    <td className="px-2 py-2">
                      {rate.shippingCharge != null ? `₹${rate.shippingCharge}` : "—"}
                    </td>
                    <td className="px-2 py-2">
                      {rate.handlingFee != null
                        ? `₹${rate.handlingFee + (rate.serviceFee ?? 0) + (rate.packingFee ?? 0)}`
                        : "—"}
                    </td>
                    <td className="px-2 py-2">
                      {rate.gst != null ? `₹${rate.gst}` : "—"}
                    </td>
                    <td className="px-2 py-2 font-semibold text-brand">
                      {rate.finalCustomerPrice != null
                        ? `₹${rate.finalCustomerPrice}`
                        : "—"}
                    </td>
                  </tr>
                ))}
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
            {(
              [
                ["shipping_markup_percent", "Shipping markup %"],
                ["handling_fee_inr", "Handling fee (₹)"],
                ["service_fee_inr", "Service fee (₹)"],
                ["gst_rate", "GST rate (e.g. 0.18)"],
                ["volumetric_divisor", "Volumetric divisor"],
                ["final_price_round_to_inr", "Final round-up (₹)"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className={labelClassName} htmlFor={key}>
                  {label}
                </label>
                <input
                  id={key}
                  type="number"
                  step="any"
                  className={fieldClassName}
                  value={settings[key]}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      [key]: Number(event.target.value),
                    })
                  }
                />
              </div>
            ))}

            <div>
              <label className={labelClassName} htmlFor="tax_mode">
                Tax mode
              </label>
              <select
                id="tax_mode"
                className={fieldClassName}
                value={settings.tax_mode}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    tax_mode: event.target
                      .value as ShippingSettings["tax_mode"],
                  })
                }
              >
                <option value="gst_on_indiroute_fees_only">
                  GST on IndiRoute fees only
                </option>
                <option value="gst_on_all">GST on shipping + fees</option>
                <option value="gst_none">No GST</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            {(
              [
                ["economy_enabled", "Enable Economy"],
                ["standard_enabled", "Enable Standard"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="inline-flex items-center gap-2 text-sm text-brand">
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
              Packing fee slabs
            </h2>
            <div className="mt-3 space-y-3">
              {packingSlabs.map((slab, index) => (
                <div key={`${slab.min_kg}-${index}`} className="grid gap-3 sm:grid-cols-3">
                  <input
                    type="number"
                    step="any"
                    className={fieldClassName}
                    value={slab.min_kg}
                    onChange={(event) => {
                      const next = [...packingSlabs];
                      next[index] = {
                        ...slab,
                        min_kg: Number(event.target.value),
                      };
                      setPackingSlabs(next);
                    }}
                  />
                  <input
                    type="number"
                    step="any"
                    className={fieldClassName}
                    value={slab.max_kg ?? ""}
                    placeholder="No max"
                    onChange={(event) => {
                      const next = [...packingSlabs];
                      next[index] = {
                        ...slab,
                        max_kg:
                          event.target.value === ""
                            ? null
                            : Number(event.target.value),
                      };
                      setPackingSlabs(next);
                    }}
                  />
                  <input
                    type="number"
                    step="any"
                    className={fieldClassName}
                    value={slab.fee_inr}
                    onChange={(event) => {
                      const next = [...packingSlabs];
                      next[index] = {
                        ...slab,
                        fee_inr: Number(event.target.value),
                      };
                      setPackingSlabs(next);
                    }}
                  />
                </div>
              ))}
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
            Internal source mapping used for Economy / Standard selection. Customers
            only see IndiRoute product names.
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
