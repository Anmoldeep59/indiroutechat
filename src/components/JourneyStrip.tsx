"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  CargoShip,
  HomeDelivered,
  IndianTruck,
  WarehouseIllustration,
} from "./illustrations";
import { MotionReveal } from "./Motion";

/**
 * Decorative journey band: IndiRoute warehouse → Indian highways →
 * international air/sea cargo → customer's doorstep.
 */
export function JourneyStrip() {
  const reduce = useReducedMotion();

  return (
    <section
      aria-label="How your parcel travels from India to the world"
      className="relative overflow-hidden border-t border-border bg-background"
    >
      <div className="pattern-jaali-dark pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <MotionReveal>
          <p className="text-center font-display text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            The IndiRoute journey
          </p>
          <h2 className="mt-3 text-center font-display text-2xl font-bold tracking-tight text-brand sm:text-3xl">
            Warehouse → Indian highways → the world
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-brand-muted">
            Your parcels move from a secure Indian locker through ground
            logistics and international cargo — tracked every step.
          </p>
        </MotionReveal>

        <MotionReveal delay={120}>
          <div className="relative mt-10 grid items-end gap-10 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4 lg:gap-6">
            <svg
              className="pointer-events-none absolute inset-x-8 bottom-[7.5rem] hidden h-6 lg:block"
              viewBox="0 0 1000 20"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <line
                x1="0"
                y1="10"
                x2="1000"
                y2="10"
                stroke="#0c2340"
                strokeOpacity="0.18"
                strokeWidth="2"
                className="road-line"
              />
            </svg>

            <div className="flex flex-col items-center text-center">
              <WarehouseIllustration className="h-32 w-auto" />
              <h3 className="mt-4 font-display text-sm font-semibold text-brand">
                IndiRoute Warehouse
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-brand-muted">
                Parcels arrive at your personal India locker
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <motion.div
                animate={reduce ? undefined : { x: [0, 12, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              >
                <IndianTruck className="h-32 w-auto" />
              </motion.div>
              <h3 className="mt-4 font-display text-sm font-semibold text-brand">
                Indian Highways
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-brand-muted">
                Secure ground transport to the cargo terminal
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <svg viewBox="0 0 160 110" className="h-28 w-auto" aria-hidden="true">
                <path
                  d="M8 96C40 56 84 34 148 26"
                  fill="none"
                  stroke="#e86a17"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="route-line"
                />
                <g className="animate-float-soft">
                  <path d="M52 58l44-16-12 16 12 16z" fill="#0c2340" transform="rotate(-14 74 58)" />
                  <path d="M60 56l20-7-5.5 7 5.5 7z" fill="#e86a17" transform="rotate(-14 70 56) translate(14 1)" />
                </g>
                <circle cx="8" cy="96" r="4" fill="#0c2340" opacity="0.55" />
                <circle cx="148" cy="26" r="7" fill="#e86a17" opacity="0.2" className="route-node" />
                <circle cx="148" cy="26" r="3.5" fill="#e86a17" />
                <ellipse cx="80" cy="103" rx="60" ry="3.5" fill="#0c2340" opacity="0.08" />
              </svg>
              <div className="mt-1 opacity-80">
                <CargoShip className="mx-auto h-10 w-auto" />
              </div>
              <h3 className="mt-3 font-display text-sm font-semibold text-brand">
                Air & ocean cargo
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-brand-muted">
                Economy or express — tracked door to door
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <HomeDelivered className="h-32 w-auto" />
              <h3 className="mt-4 font-display text-sm font-semibold text-brand">
                Your Doorstep
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-brand-muted">
                Delivered anywhere in the world
              </p>
            </div>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}
