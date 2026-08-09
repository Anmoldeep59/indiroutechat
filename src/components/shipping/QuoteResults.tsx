"use client";

import type { CustomerTierQuote, QuoteResult } from "@/lib/shipping/types";

function formatInr(amount: number | null, currency: string) {
  if (amount == null) return "—";
  return `${currency} ${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

function TierIcon({ tier }: { tier: CustomerTierQuote["tier"] }) {
  if (tier === "economy") {
    return (
      <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
        <rect x="6" y="14" width="22" height="14" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="30" r="2.5" fill="currentColor" />
        <circle cx="24" cy="30" r="2.5" fill="currentColor" />
        <path d="M28 18h6l2 5v5h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (tier === "standard") {
    return (
      <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
        <path
          d="M6 22c8-2 12-8 14-14 2 6 6 12 14 14-8 2-12 8-14 14-2-6-6-12-14-14z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path d="M8 28h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
      <path d="M18 6l-8 14h8l-2 14 12-16h-8l4-12z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function QuoteResults({
  quote,
  selectedTier,
  onSelect,
}: {
  quote: QuoteResult;
  selectedTier?: string | null;
  onSelect?: (tier: CustomerTierQuote["tier"]) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-background px-4 py-3 text-sm text-brand-muted">
        <p>
          <span className="font-semibold text-brand">Ships from India</span>
          {" · "}
          {quote.countryName}
          {quote.city ? ` · ${quote.city}` : ""}
          {quote.postcode ? ` ${quote.postcode}` : ""}
        </p>
        <p className="mt-1">
          Chargeable weight:{" "}
          <span className="font-semibold text-brand">
            {quote.chargeableWeightKg.toFixed(2)} kg
          </span>
          {quote.volumetricWeightKg > quote.actualWeightKg ? (
            <span>
              {" "}
              (volumetric {quote.volumetricWeightKg.toFixed(2)} kg)
            </span>
          ) : null}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {quote.options.map((option) => {
          const selected = selectedTier === option.tier;
          const isExpress = option.tier === "express" || option.comingSoon;

          return (
            <article
              key={option.tier}
              className={[
                "relative flex flex-col rounded-xl border p-5 transition-colors",
                option.tier === "standard"
                  ? "border-accent bg-accent/5"
                  : "border-border bg-surface",
                selected ? "ring-2 ring-accent/40" : "",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-brand">
                  <TierIcon tier={option.tier} />
                </div>
                {option.badge ? (
                  <span
                    className={[
                      "rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]",
                      option.badge === "Recommended"
                        ? "bg-accent text-white"
                        : option.badge === "Coming Soon"
                          ? "bg-brand/10 text-brand-muted"
                          : "bg-brand/10 text-brand",
                    ].join(" ")}
                  >
                    {option.badge}
                  </span>
                ) : null}
              </div>

              <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-brand">
                {option.displayName}
              </h3>

              {isExpress ? (
                <p className="mt-3 text-sm leading-relaxed text-brand-muted">
                  Coming Soon
                </p>
              ) : option.available ? (
                <>
                  <p className="mt-3 font-display text-2xl font-bold text-brand">
                    {formatInr(option.priceInr, option.currency)}
                  </p>
                  <p className="mt-2 text-sm text-brand-muted">
                    Estimated delivery:{" "}
                    <span className="font-medium text-brand">
                      {option.estimatedDelivery || "Business days TBA"}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-brand-muted">
                    Chargeable weight:{" "}
                    <span className="font-medium text-brand">
                      {option.chargeableWeightKg?.toFixed(2)} kg
                    </span>
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-brand-muted">
                  No rate available for this weight and destination.
                </p>
              )}

              {onSelect ? (
                <button
                  type="button"
                  disabled={!option.available || Boolean(isExpress)}
                  onClick={() => onSelect(option.tier)}
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isExpress ? "Coming Soon" : selected ? "Selected" : "Select"}
                </button>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
