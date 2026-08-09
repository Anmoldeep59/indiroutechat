import { CrescentMotif, Diya, StringLights } from "./illustrations";
import { MotionReveal } from "./Motion";

const accents = [
  {
    title: "Diwali deliveries",
    detail: "Gift parcels, diyas of light, and warm saffron accents.",
    icon: "diya" as const,
  },
  {
    title: "Eid & festive gifts",
    detail: "Elegant geometric motifs for respectful celebration.",
    icon: "crescent" as const,
  },
  {
    title: "Rakhi & Onam",
    detail: "Family gift boxes shipped with care from India.",
    icon: "gift" as const,
  },
  {
    title: "Year-round festivals",
    detail: "Holi color hints, Navratri patterns, Christmas in India.",
    icon: "lights" as const,
  },
] as const;

/**
 * Tasteful festival storytelling — distributed visual identity, not a mega-banner.
 */
export function FestivalRibbon() {
  return (
    <section
      aria-labelledby="festival-heading"
      className="relative overflow-hidden border-t border-border bg-brand text-white"
    >
      <div className="pattern-jaali pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 opacity-80"
        aria-hidden="true"
      >
        <StringLights className="h-10 w-full" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-16 sm:px-6 lg:px-8 lg:pb-16 lg:pt-20">
        <MotionReveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Festival season ready
            </p>
            <h2
              id="festival-heading"
              className="mt-3 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl"
            >
              Celebrate India — receive it worldwide
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/75 sm:text-base">
              From Diwali gifts to Eid parcels and regional festivals, IndiRoute
              helps your celebrations travel further.
            </p>
          </div>
        </MotionReveal>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {accents.map((item, index) => (
            <MotionReveal key={item.title} delay={index * 80}>
              <li className="h-full rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-sm transition-colors duration-300 hover:bg-white/[0.08]">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  {item.icon === "diya" ? (
                    <Diya className="h-8 w-8" />
                  ) : item.icon === "crescent" ? (
                    <CrescentMotif className="h-7 w-7 text-accent" />
                  ) : item.icon === "gift" ? (
                    <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v6.75a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18V11.25m18 0V9a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9v2.25m18 0h-6.75A.75.75 0 0113.5 10.5v-1.5m0 0V6.75A2.25 2.25 0 0115.75 4.5h.01A2.25 2.25 0 0118 6.75v2.25m-4.5 0H9.75m0 0V6.75A2.25 2.25 0 007.5 4.5h-.01A2.25 2.25 0 005.25 6.75v2.25m4.5 0h4.5" />
                    </svg>
                  ) : (
                    <span className="h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_12px_rgba(232,106,23,0.8)]" />
                  )}
                </div>
                <h3 className="font-display text-sm font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-white/70">
                  {item.detail}
                </p>
              </li>
            </MotionReveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
