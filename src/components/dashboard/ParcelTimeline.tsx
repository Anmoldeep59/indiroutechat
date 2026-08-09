"use client";

import { TrackingTimelineVisual } from "@/components/illustrations";

const stages = [
  { id: "received", label: "Warehouse Received", icon: "box" },
  { id: "inspection", label: "Inspection", icon: "scan" },
  { id: "consolidation", label: "Consolidation", icon: "stack" },
  { id: "packed", label: "Packed", icon: "tape" },
  { id: "ready", label: "Ready to Ship", icon: "check" },
  { id: "shipped", label: "Shipped", icon: "plane" },
  { id: "transit", label: "In Transit", icon: "route" },
  { id: "delivered", label: "Delivered", icon: "home" },
] as const;

type ParcelTimelineProps = {
  /** Index of the furthest completed stage (decorative default). */
  activeIndex?: number;
};

/**
 * Visual parcel journey timeline — decorative UI only.
 * Does not alter backend status logic.
 */
export function ParcelTimeline({ activeIndex = 0 }: ParcelTimelineProps) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-[0_1px_3px_rgba(12,35,64,0.05)] sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            Parcel journey
          </p>
          <h3 className="mt-1 font-display text-lg font-semibold tracking-tight text-brand">
            From warehouse to doorstep
          </h3>
        </div>
        <TrackingTimelineVisual className="hidden h-12 w-auto text-brand sm:block" />
      </div>

      <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stages.map((stage, index) => {
          const done = index <= activeIndex;
          return (
            <li
              key={stage.id}
              className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors ${
                done
                  ? "border-accent/30 bg-accent/[0.06]"
                  : "border-border bg-background"
              }`}
            >
              <span
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  done
                    ? "bg-accent text-white"
                    : "bg-brand/[0.06] text-brand-muted"
                }`}
              >
                {index + 1}
              </span>
              <div>
                <p
                  className={`text-sm font-semibold ${
                    done ? "text-brand" : "text-brand-muted"
                  }`}
                >
                  {stage.label}
                </p>
                <p className="mt-0.5 text-[11px] text-brand-muted">
                  {done ? "On track" : "Upcoming"}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
