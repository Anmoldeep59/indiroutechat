type PlaceholderSectionProps = {
  title: string;
  description: string;
};

export function PlaceholderSection({
  title,
  description,
}: PlaceholderSectionProps) {
  return (
    <section className="rounded-xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(12,35,64,0.04)] sm:p-8">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-accent">
        Customer dashboard
      </p>
      <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-brand sm:text-3xl">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-muted sm:text-base">
        {description}
      </p>
      <div className="mt-8 rounded-lg border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-brand-muted">
        This section is ready for live data. No records to show yet.
      </div>
    </section>
  );
}
