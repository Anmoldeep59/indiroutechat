export function CallToAction() {
  return (
    <section
      aria-labelledby="cta-heading"
      className="relative overflow-hidden bg-brand"
    >
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
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="cta-heading"
            className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            Ready to Shop India From Anywhere?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/80 sm:text-lg">
            Create your IndiRoute account, get a personal India warehouse
            address, and start forwarding parcels worldwide — securely and on
            your schedule.
          </p>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:mt-10 sm:flex-row sm:items-center">
            <a
              href="/signup"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-6 text-sm font-semibold text-white transition-colors hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Create Free Account
            </a>
            <a
              href="#how-it-works"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/30 bg-transparent px-6 text-sm font-semibold text-white transition-colors hover:border-white/50 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              How It Works
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
