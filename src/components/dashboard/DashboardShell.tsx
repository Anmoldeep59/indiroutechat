"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { signOut, type User } from "firebase/auth";
import { Logo } from "@/components/Logo";
import { dashboardNavItems } from "@/components/dashboard/nav";
import { auth } from "@/lib/firebase";

type DashboardShellProps = {
  user: User;
  children: ReactNode;
};

type DashboardNavProps = {
  pathname: string;
  onNavigate?: () => void;
};

function DashboardNav({ pathname, onNavigate }: DashboardNavProps) {
  return (
    <nav aria-label="Dashboard" className="flex flex-col gap-0.5">
      {dashboardNavItems.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={onNavigate}
            className={`relative rounded-md py-2.5 pl-4 pr-3 text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-white/10 text-white"
                : "text-white/70 hover:bg-white/5 hover:text-white motion-safe:hover:translate-x-0.5"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            <span
              className={`absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-accent transition-opacity duration-200 ${
                isActive ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden="true"
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const displayName = user.displayName?.trim() || "IndiRoute Customer";
  const email = user.email ?? "No email on file";

  async function handleSignOut() {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      await signOut(auth);
      router.replace("/login");
    } catch {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="flex min-h-full flex-1 bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-gradient-to-b from-brand to-brand-deep lg:flex">
        <div className="pattern-jaali pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative border-b border-white/10 px-5 py-5">
          <Logo tone="on-dark" />
          <p className="mt-2 text-xs font-medium tracking-wide text-white/55">
            Customer Dashboard
          </p>
        </div>
        <div className="relative flex-1 overflow-y-auto px-3 py-4">
          <DashboardNav pathname={pathname} />
        </div>
        <div
          className="relative border-t border-white/10 px-5 py-4"
          aria-hidden="true"
        >
          <p className="text-xs font-medium tracking-wide text-white/40">
            Shop India. Ship Anywhere.
          </p>
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-brand/40"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="animate-drawer-in relative flex h-full w-[min(18rem,85vw)] flex-col bg-gradient-to-b from-brand to-brand-deep shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <Logo tone="on-dark" />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-white hover:bg-white/10"
                aria-label="Close menu"
              >
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
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <DashboardNav
                pathname={pathname}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-md">
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-brand hover:bg-brand/[0.05] lg:hidden"
                aria-label="Open menu"
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen(true)}
              >
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
              </button>
              <div>
                <p className="font-display text-sm font-semibold text-brand sm:text-base">
                  Dashboard
                </p>
                <p className="hidden text-xs text-brand-muted sm:block">
                  Shop India. Ship Anywhere.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="min-w-0 text-right">
                <p className="truncate font-display text-sm font-semibold text-brand">
                  {displayName}
                </p>
                <p className="truncate text-xs text-brand-muted">{email}</p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-md border border-border bg-background px-3.5 text-sm font-semibold text-brand transition-colors hover:border-brand/30 hover:bg-brand/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSigningOut ? "Signing out..." : "Sign Out"}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div key={pathname} className="animate-fade-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
