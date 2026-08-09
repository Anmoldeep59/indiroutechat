import {
  AutoRickshaw,
  CourierScooter,
  ProductParcels,
} from "./illustrations";
import { MotionReveal } from "./Motion";

const productCategories = [
  { title: "Indian clothing", detail: "Sarees, kurtas, ethnic wear" },
  { title: "Handicrafts", detail: "Home decor & artisan gifts" },
  { title: "Ayurveda & beauty", detail: "Wellness & cosmetics parcels" },
  { title: "Books & stationery", detail: "Publishers & market finds" },
  { title: "Jewellery boxes", detail: "Secure packaging for valuables" },
  { title: "Festival gifts", detail: "Diwali, Eid, Rakhi & more" },
] as const;

/**
 * Visual storytelling: what international customers shop from India.
 * Decorative only — no ecommerce catalog.
 */
export function IndiaShopStrip() {
  return (
    <section
      aria-labelledby="shop-india-heading"
      className="relative overflow-hidden border-t border-border bg-surface"
    >
      <div className="pattern-jaali-dark pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -left-20 top-0 h-56 w-56 rounded-full bg-accent/[0.06] blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <MotionReveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Shop India
            </p>
            <h2
              id="shop-india-heading"
              className="mt-3 font-display text-2xl font-bold tracking-tight text-brand sm:text-3xl"
            >
              From Indian stores to your doorstep
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-muted sm:text-base">
              Fashion, handicrafts, wellness, books, and festival gifts —
              IndiRoute receives the parcels in India and forwards what you are
              ready to ship.
            </p>
          </div>
        </MotionReveal>

        <MotionReveal delay={100}>
          <div className="mt-8 flex justify-center">
            <ProductParcels className="h-20 w-auto sm:h-24" />
          </div>
        </MotionReveal>

        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
          {productCategories.map((item, index) => (
            <MotionReveal key={item.title} delay={index * 60}>
              <li className="card-lift flex h-full flex-col rounded-2xl border border-border bg-background px-5 py-4 shadow-[0_1px_3px_rgba(12,35,64,0.04)]">
                <h3 className="font-display text-sm font-semibold text-brand">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-brand-muted sm:text-sm">
                  {item.detail}
                </p>
              </li>
            </MotionReveal>
          ))}
        </ul>

        <MotionReveal delay={200}>
          <div className="mt-10 flex flex-wrap items-end justify-center gap-8 opacity-90">
            <div className="text-center">
              <CourierScooter className="mx-auto h-16 w-auto" />
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
                City courier
              </p>
            </div>
            <div className="text-center">
              <AutoRickshaw className="mx-auto h-16 w-auto" />
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
                Local pickup
              </p>
            </div>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}
