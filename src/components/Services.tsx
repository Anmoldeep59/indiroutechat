import type { ReactNode } from "react";
import {
  ConsolidationVisual,
  GlobeRoute,
  PickupVan,
  ShopFront,
} from "./illustrations";
import { MotionReveal } from "./Motion";

const serviceVisuals: Record<string, ReactNode> = {
  "Parcel Forwarding": <GlobeRoute className="h-20 w-auto" />,
  "Assisted Purchase": <ShopFront className="h-20 w-auto" />,
  "Parcel Consolidation": <ConsolidationVisual className="h-20 w-auto" />,
  "India Pickup": <PickupVan className="h-20 w-auto" />,
};

const services = [
  {
    title: "Parcel Forwarding",
    description:
      "Customers receive a personal Indian warehouse address. We receive their parcels and forward them internationally.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
        />
      </svg>
    ),
  },
  {
    title: "Assisted Purchase",
    description:
      "If a customer cannot order from an Indian website, IndiRoute can purchase the product for them.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
        />
      </svg>
    ),
  },
  {
    title: "Parcel Consolidation",
    description:
      "Combine multiple parcels into one shipment to reduce packaging and international shipping costs.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
    ),
  },
  {
    title: "India Pickup",
    description:
      "Customers can request pickup of parcels from eligible addresses within India and send them to the IndiRoute warehouse.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25h17.25M3.375 14.25V6.375c0-.621.504-1.125 1.125-1.125h6.75c.621 0 1.125.504 1.125 1.125v7.875"
        />
      </svg>
    ),
  },
] as const;

export function Services() {
  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="scroll-mt-20 border-t border-border bg-surface"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <MotionReveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              What we do
            </p>
            <h2
              id="services-heading"
              className="mt-3 font-display text-3xl font-bold tracking-tight text-brand sm:text-4xl"
            >
              Our Services
            </h2>
            <p className="mt-4 text-base leading-relaxed text-brand-muted sm:text-lg">
              IndiRoute helps customers shop, receive, combine, and ship products
              from India to destinations worldwide.
            </p>
          </div>
        </MotionReveal>

        <ul className="mt-12 grid gap-5 sm:mt-14 sm:grid-cols-2 sm:gap-6 lg:mt-16 lg:grid-cols-4 lg:gap-5">
          {services.map((service, index) => (
            <MotionReveal key={service.title} delay={index * 100} className="h-full">
              <li className="card-lift group flex h-full flex-col rounded-2xl border border-border bg-background p-6 shadow-[0_1px_3px_rgba(12,35,64,0.05)]">
                <div className="flex h-24 items-center justify-center rounded-xl bg-surface transition-colors duration-300 group-hover:bg-accent/[0.04]">
                  {serviceVisuals[service.title]}
                </div>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/[0.06] text-brand transition-colors duration-300 group-hover:bg-accent/10 group-hover:text-accent">
                    {service.icon}
                  </div>
                  <h3 className="font-display text-lg font-semibold tracking-tight text-brand">
                    {service.title}
                  </h3>
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-brand-muted">
                  {service.description}
                </p>
              </li>
            </MotionReveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
