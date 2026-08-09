import { PostalStamp, RangoliMotif } from "./illustrations";
import { Reveal } from "./Reveal";

export function Pricing() {
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="relative scroll-mt-20 overflow-hidden border-t border-border bg-surface"
    >
      <PostalStamp className="pointer-events-none absolute -right-6 top-10 hidden h-36 w-auto rotate-[8deg] opacity-40 lg:block" />
      <RangoliMotif className="pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 text-brand opacity-[0.04]" />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Pricing
            </p>
            <h2
              id="pricing-heading"
              className="mt-3 font-display text-3xl font-bold tracking-tight text-brand sm:text-4xl"
            >
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-base leading-relaxed text-brand-muted sm:text-lg">
              Pay only for the services you use — no hidden fees, no confusing
              packages.
            </p>
          </div>
        </Reveal>

        <ul className="mt-12 grid gap-5 sm:mt-14 sm:grid-cols-2 sm:gap-6 lg:mt-16 lg:grid-cols-3 lg:gap-6">
          <Reveal className="h-full sm:col-span-1">
          <li className="card-lift flex h-full flex-col rounded-2xl border border-border bg-background p-6 shadow-[0_1px_3px_rgba(12,35,64,0.05)] sm:p-7">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand/[0.06] text-brand">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.75}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
                />
              </svg>
            </div>

            <h3 className="mt-5 font-display text-xl font-semibold tracking-tight text-brand">
              Warehouse Storage
            </h3>

            <div className="mt-4 rounded-lg border border-accent/25 bg-accent/5 px-4 py-3">
              <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                20 Days FREE
              </p>
              <p className="mt-1 text-sm font-medium text-brand">
                First 20 days:{" "}
                <span className="font-bold text-accent">FREE</span>
              </p>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-brand-muted">
              After 20 days:{" "}
              <span className="font-semibold text-brand">₹100 per day</span>
            </p>

            <p className="mt-auto pt-5 text-xs leading-relaxed text-brand-muted/90">
              Storage charges may depend on parcel/locker policy.
            </p>
          </li>
          </Reveal>

          <Reveal className="h-full sm:col-span-1" delay={100}>
          <li className="card-lift flex h-full flex-col rounded-2xl border border-border bg-background p-6 shadow-[0_1px_3px_rgba(12,35,64,0.05)] sm:p-7">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand/[0.06] text-brand">
              <svg
                className="h-5 w-5"
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
            </div>

            <h3 className="mt-5 font-display text-xl font-semibold tracking-tight text-brand">
              Parcel Consolidation
            </h3>

            <p className="mt-4 text-sm leading-relaxed text-brand-muted">
              Combine multiple parcels into one international shipment to reduce
              packaging waste and overall shipping cost.
            </p>

            <p className="mt-auto pt-5 text-sm font-semibold text-brand">
              Pricing shown before confirmation
            </p>
          </li>
          </Reveal>

          <Reveal className="h-full sm:col-span-2 lg:col-span-1" delay={200}>
          <li className="card-lift flex h-full flex-col rounded-2xl border border-border bg-background p-6 shadow-[0_1px_3px_rgba(12,35,64,0.05)] sm:p-7">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand/[0.06] text-brand">
              <svg
                className="h-5 w-5"
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
            </div>

            <h3 className="mt-5 font-display text-xl font-semibold tracking-tight text-brand">
              International Shipping
            </h3>

            <p className="mt-4 text-sm leading-relaxed text-brand-muted">
              Shipping cost depends on destination, weight, dimensions, and
              service speed. You&apos;ll see your estimate before you commit.
            </p>

            <a
              href="#shipping-calculator"
              className="group/link mt-auto inline-flex w-fit items-center gap-1.5 pt-5 text-sm font-semibold text-accent transition-colors hover:text-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Calculate Shipping
              <span
                aria-hidden="true"
                className="transition-transform duration-200 motion-safe:group-hover/link:translate-x-1"
              >
                →
              </span>
            </a>
          </li>
          </Reveal>
        </ul>
      </div>
    </section>
  );
}
