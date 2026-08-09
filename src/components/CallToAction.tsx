import { Diya, StringLights } from "./illustrations";
import { MotionReveal } from "./Motion";

export function CallToAction() {
  return (
    <section
      aria-labelledby="cta-heading"
      className="relative overflow-hidden bg-gradient-to-br from-brand via-brand to-brand-deep"
    >
      <div className="pattern-jaali pointer-events-none absolute inset-0" aria-hidden="true" />
      <StringLights className="pointer-events-none absolute inset-x-0 top-0 w-full opacity-80" />
      <div
        className="pointer-events-none absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-accent/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-1/4 h-40 w-40 translate-y-1/3 rounded-full bg-white/[0.04]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <MotionReveal>
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            India, delivered to the world
          </p>
          <h2
            id="cta-heading"
            className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            Ready to Shop India From Anywhere?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/80 sm:text-lg">
            Create your IndiRoute account, get a personal India warehouse
            address, and start forwarding parcels worldwide — securely and on
            your schedule.
          </p>

          <div className="mt-7 flex items-center justify-center gap-4" aria-hidden="true">
            <Diya className="h-9 w-9" />
            <p className="text-xs font-medium tracking-wide text-white/65">
              Diwali gifts · Rakhi parcels · Eid hampers · Christmas boxes —
              festive India, delivered worldwide
            </p>
            <Diya className="hidden h-9 w-9 sm:block" />
          </div>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:mt-10 sm:flex-row sm:items-center">
            <a
              href="/signup"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-6 text-sm font-semibold text-white shadow-[0_2px_12px_rgba(232,106,23,0.4)] transition-all duration-200 hover:bg-accent-hover hover:shadow-[0_8px_24px_rgba(232,106,23,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-safe:hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Create Free Account
            </a>
            <a
              href="#how-it-works"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/30 bg-transparent px-6 text-sm font-semibold text-white transition-all duration-200 hover:border-white/55 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-safe:hover:-translate-y-0.5 active:scale-[0.98]"
            >
              How It Works
            </a>
          </div>
        </div>
        </MotionReveal>
      </div>
    </section>
  );
}
