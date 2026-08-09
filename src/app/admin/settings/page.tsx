import Link from "next/link";

export default function Page() {
  return (
    <section className="rounded-xl border border-border bg-surface p-6 sm:p-8">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-accent">
        Settings
      </p>
      <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-brand">
        Operational settings
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-muted">
        Shipping markup, fees, GST, volumetric divisor, country enablement, and
        source service mapping are managed in Shipping Rates.
      </p>
      <Link
        href="/admin/shipping-rates"
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
      >
        Open shipping settings
      </Link>
    </section>
  );
}
