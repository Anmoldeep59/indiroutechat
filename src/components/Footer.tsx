import Link from "next/link";
import { BarcodeDecor, IndiaMap } from "./illustrations";
import { Logo } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";

const footerGroups = [
  {
    title: "Company",
    links: [
      { label: "About Us", href: "#about" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Parcel Forwarding", href: "#parcel-forwarding" },
      { label: "Assisted Purchase", href: "#assisted-purchase" },
      { label: "Parcel Consolidation", href: "#parcel-consolidation" },
      { label: "India Pickup", href: "#india-pickup" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Shipping Calculator", href: "#shipping-calculator" },
      { label: "Prohibited Items", href: "#prohibited-items" },
      { label: "Contact Us", href: "#contact" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms & Conditions", href: "#terms" },
      { label: "Privacy Policy", href: "#privacy" },
    ],
  },
] as const;

const socialLinks = [
  {
    label: "LinkedIn",
    href: "#",
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "#",
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    label: "X",
    href: "#",
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.227-8.451L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "#",
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-brand to-brand-deep text-white">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent"
        aria-hidden="true"
      />
      <div className="pattern-jaali pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-accent/[0.07] blur-3xl"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.85fr)] lg:gap-16">
          <div className="max-w-md">
            <Logo tone="on-dark" />
            <p className="mt-4 text-sm leading-relaxed text-white/80 sm:text-[0.9375rem]">
              Shop from India and ship worldwide with your personal IndiRoute
              warehouse address.
            </p>
            <NewsletterForm />
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 sm:gap-6 lg:gap-8">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h2 className="font-display text-sm font-semibold tracking-wide text-accent">
                  {group.title}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="inline-block text-sm text-white/75 transition-all duration-200 hover:text-white motion-safe:hover:translate-x-0.5"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* India → world band */}
        <div className="mt-12 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] sm:mt-14">
          <div className="flex flex-col items-center gap-6 px-6 py-8 sm:flex-row sm:justify-between sm:px-8">
            <div className="flex items-center gap-5">
              <IndiaMap className="h-20 w-auto text-white" />
              <svg viewBox="0 0 120 40" className="hidden h-10 w-28 sm:block" aria-hidden="true">
                <path
                  d="M2 20h108"
                  stroke="#e86a17"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="route-line"
                />
                <path d="M104 14l12 6-12 6z" fill="#e86a17" />
              </svg>
              <div className="hidden items-center gap-2.5 sm:flex" aria-hidden="true">
                {["#e86a17", "#ffffff", "#147a54", "#d4a017", "#e86a17"].map(
                  (color, i) => (
                    <span
                      key={i}
                      className="route-node inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: color, opacity: 0.85, animationDelay: `${i * 0.4}s` }}
                    />
                  ),
                )}
              </div>
            </div>
            <div className="text-center sm:text-right">
              <p className="font-display text-lg font-bold tracking-tight text-white sm:text-xl">
                India, delivered to the world.
              </p>
              <BarcodeDecor className="ml-auto mt-3 hidden h-7 w-auto text-white/30 sm:block" />
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-5 border-t border-white/15 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/65">
            © {year} IndiRoute. All rights reserved.
          </p>

          <ul className="flex items-center gap-2.5" aria-label="Social media">
            {socialLinks.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  aria-label={social.label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-white/80 transition-all duration-200 hover:border-accent/60 hover:bg-accent/15 hover:text-white motion-safe:hover:-translate-y-0.5"
                >
                  {social.icon}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
