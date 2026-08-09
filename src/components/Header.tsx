"use client";

import { useEffect, useState } from "react";
import { Button } from "./Button";
import { Logo } from "./Logo";

const navLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Services", href: "#services" },
  { label: "Pricing", href: "#pricing" },
] as const;

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    const onResize = () => {
      if (window.matchMedia("(min-width: 768px)").matches) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-md">
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr] lg:px-8">
        <div className="justify-self-start">
          <Logo />
        </div>

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Primary"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group relative px-3.5 py-2 text-sm font-medium text-brand transition-colors hover:text-brand"
            >
              <span className="text-brand-muted transition-colors group-hover:text-brand">
                {link.label}
              </span>
              <span className="absolute inset-x-3.5 -bottom-0.5 h-0.5 origin-left scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100" />
            </a>
          ))}
        </nav>

        <div className="hidden items-center justify-self-end gap-2.5 md:flex">
          <Button
            href="/login"
            variant="ghost"
            className="px-4 py-2 text-brand hover:bg-brand/[0.05]"
          >
            Login
          </Button>
          <Button
            href="/signup"
            variant="secondary"
            className="px-5 py-2 shadow-none"
          >
            Sign Up
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center justify-self-end rounded-md text-brand transition-colors hover:bg-brand/[0.05] md:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {menuOpen ? (
        <div
          id="mobile-menu"
          className="border-t border-border/70 bg-background md:hidden"
        >
          <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
            <nav className="flex flex-col gap-0.5" aria-label="Mobile">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-3 text-[0.9375rem] font-medium text-brand transition-colors hover:bg-brand/[0.04]"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="mt-3 flex flex-col gap-2.5 border-t border-border/70 pt-4">
              <Button
                href="/login"
                variant="outline"
                className="w-full border-brand/20 text-brand"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Button>
              <Button
                href="/signup"
                variant="secondary"
                className="w-full"
                onClick={() => setMenuOpen(false)}
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
