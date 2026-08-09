import type { ReactNode } from "react";
import {
  AddressCardVisual,
  DeliveryVisual,
  ShoppingVisual,
  WarehouseStepVisual,
} from "./illustrations";
import { MotionReveal } from "./Motion";

const stepVisuals: Record<string, ReactNode> = {
  "01": <AddressCardVisual className="h-24 w-auto" />,
  "02": <ShoppingVisual className="h-24 w-auto" />,
  "03": <WarehouseStepVisual className="h-24 w-auto" />,
  "04": <DeliveryVisual className="h-24 w-auto" />,
};

const steps = [
  {
    number: "01",
    title: "Get Your India Address",
    description:
      "Create an account and receive your personal IndiRoute warehouse/locker address in India.",
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
          d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
        />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Shop From Indian Stores",
    description:
      "Use your IndiRoute address when ordering from Indian online stores.",
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
    number: "03",
    title: "We Receive & Consolidate",
    description:
      "IndiRoute receives your parcels, stores them securely, and can combine multiple packages into one shipment.",
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
    number: "04",
    title: "Ship Worldwide",
    description:
      "Choose your shipping option, pay the charges, and track your parcel to your destination.",
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
] as const;

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="scroll-mt-20 border-t border-border bg-background"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <MotionReveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Simple process
            </p>
            <h2
              id="how-it-works-heading"
              className="mt-3 font-display text-3xl font-bold tracking-tight text-brand sm:text-4xl"
            >
              How IndiRoute Works
            </h2>
            <p className="mt-4 text-base leading-relaxed text-brand-muted sm:text-lg">
              Shop from Indian stores and receive your products anywhere in the
              world — IndiRoute handles the warehouse address, storage, and
              international shipping for you.
            </p>
          </div>
        </MotionReveal>

        <div className="relative mt-12 sm:mt-14 lg:mt-16">
          <div
            className="pointer-events-none absolute left-[12%] right-[12%] top-[2.75rem] hidden h-px bg-gradient-to-r from-transparent via-accent/45 to-transparent lg:block"
            aria-hidden="true"
          />

          <ol className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {steps.map((step, index) => (
              <MotionReveal key={step.number} delay={index * 100} className="h-full">
                <li className="card-lift group relative flex h-full flex-col rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_3px_rgba(12,35,64,0.05)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/[0.06] text-brand transition-colors duration-300 group-hover:bg-accent/10 group-hover:text-accent">
                      {step.icon}
                    </div>
                    <span className="font-display text-sm font-bold tracking-wider text-accent">
                      {step.number}
                    </span>
                  </div>

                  <div className="mt-5 flex h-24 items-center justify-center rounded-xl bg-background/80">
                    {stepVisuals[step.number]}
                  </div>

                  <h3 className="mt-5 font-display text-lg font-semibold tracking-tight text-brand">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-brand-muted">
                    {step.description}
                  </p>
                </li>
              </MotionReveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
