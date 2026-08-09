import { Button } from "./Button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(12,35,64,0.07),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(232,106,23,0.08),_transparent_50%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%230C2340' stroke-opacity='0.08' stroke-width='1'%3E%3Cpath d='M0 40h80M40 0v80'/%3E%3Ccircle cx='40' cy='40' r='2' fill='%230C2340' fill-opacity='0.12' stroke='none'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <p className="animate-fade-up font-display text-3xl font-bold tracking-tight text-brand sm:text-4xl">
          Indi<span className="text-accent">Route</span>
        </p>

        <h1 className="animate-fade-up animation-delay-100 mt-5 max-w-3xl font-display text-4xl font-bold leading-[1.1] tracking-tight text-brand sm:text-5xl lg:text-6xl">
          Shop India. Ship Anywhere.
        </h1>

        <p className="animate-fade-up animation-delay-200 mt-6 max-w-xl text-base leading-relaxed text-brand-muted sm:text-lg">
          Get a personal Indian warehouse address, shop from any store in India,
          and let IndiRoute forward your parcels securely to your door —
          anywhere in the world.
        </p>

        <div className="animate-fade-up animation-delay-300 mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            variant="primary"
            className="w-full px-6 py-3 text-base sm:w-auto"
          >
            Get Your India Address
          </Button>
          <Button
            variant="outline"
            className="w-full px-6 py-3 text-base sm:w-auto"
          >
            Calculate Shipping
          </Button>
        </div>
      </div>
    </section>
  );
}
