"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Button } from "./Button";
import {
  BarcodeDecor,
  Diya,
  HeroLogisticsScene,
  PostalStamp,
  RangoliMotif,
} from "./illustrations";

const heroHighlights = [
  "Free 20-day storage",
  "Parcel consolidation",
  "Worldwide delivery",
] as const;

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(12,35,64,0.08),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(232,106,23,0.1),_transparent_50%)]"
        aria-hidden="true"
      />
      <div className="pattern-jaali-dark pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
      <RangoliMotif className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 text-brand opacity-[0.05]" />
      <RangoliMotif className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 text-accent opacity-[0.06]" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 sm:pb-20 lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-8 lg:pb-24 lg:pt-16">
        <div>
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/[0.07] px-4 py-1.5 text-xs font-semibold tracking-wide text-accent"
          >
            <span className="relative flex h-2 w-2">
              <span className="motion-only absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            India, delivered to the world
          </motion.p>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="mt-6 max-w-3xl font-display text-4xl font-bold leading-[1.06] tracking-tight text-brand sm:text-5xl lg:text-6xl xl:text-[4.25rem]"
          >
            Shop India.
            <br />
            <span className="bg-gradient-to-r from-accent via-accent to-[#f59e0b] bg-clip-text text-transparent">
              Ship Anywhere.
            </span>
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="mt-6 max-w-xl text-base leading-relaxed text-brand-muted sm:text-lg"
          >
            Get a personal Indian warehouse address, shop from any store in
            India, and let IndiRoute forward your parcels securely to your door
            — anywhere in the world.
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Button
              href="/signup"
              variant="secondary"
              className="group w-full px-7 py-3 text-base sm:w-auto"
            >
              Get Your India Address
              <span
                aria-hidden="true"
                className="ml-2 inline-block transition-transform duration-200 motion-safe:group-hover:translate-x-1"
              >
                →
              </span>
            </Button>
            <Button
              href="#shipping-calculator"
              variant="outline"
              className="w-full px-7 py-3 text-base sm:w-auto"
            >
              Calculate Shipping
            </Button>
          </motion.div>

          <motion.ul
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.32 }}
            className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3"
          >
            {heroHighlights.map((highlight) => (
              <li
                key={highlight}
                className="flex items-center gap-2 text-sm font-medium text-brand-muted"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/10 text-success">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
                {highlight}
              </li>
            ))}
          </motion.ul>

          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-8 flex items-center gap-4 text-brand-muted"
          >
            <BarcodeDecor className="h-8 w-auto opacity-50" />
            <Diya className="hidden h-9 w-9 opacity-80 sm:block" />
          </motion.div>
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.97, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand via-brand to-brand-deep shadow-[0_28px_70px_rgba(12,35,64,0.38)]">
            <div className="pattern-jaali absolute inset-0" aria-hidden="true" />
            <div
              className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl"
              aria-hidden="true"
            />
            <HeroLogisticsScene className="relative h-auto w-full" />

            {/* floating chips */}
            <div className="animate-float absolute left-3 top-5 sm:left-5 sm:top-7" aria-hidden="true">
              <div className="rounded-xl border border-white/15 bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">Locker</p>
                <p className="font-display text-sm font-bold text-brand">IR-100042</p>
              </div>
            </div>
            <div
              className="animate-float-soft absolute bottom-6 right-4 hidden sm:block"
              aria-hidden="true"
              style={{ animationDelay: "-2s" }}
            >
              <PostalStamp className="h-28 w-auto opacity-95 drop-shadow-xl" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
