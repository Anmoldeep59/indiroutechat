"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { signOut, type User } from "firebase/auth";
import { Logo } from "@/components/Logo";
import { adminNavItems } from "@/components/admin/nav";
import { auth } from "@/lib/firebase";

type AdminShellProps = {
  user: User;
  children: ReactNode;
};

type AdminNavProps = {
  pathname: string;
  onNavigate?: () => void;
};

function AdminNav({ pathname, onNavigate }: AdminNavProps) {
  return (
    <nav aria-label="Admin" className="flex flex-col gap-0.5">
      {adminNavItems.map((item) => {
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={onNavigate}
            className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-white/10 text-white"
                : "text-white/75 hover:bg-white/5 hover:text-white"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ user, children }: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

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
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-brand lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <Logo tone="on-dark" />
          <p className="mt-2 text-xs font-medium tracking-wide text-accent">
            Admin Panel
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <AdminNav pathname={pathname} />
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
          <aside className="relative flex h-full w-[min(18rem,85vw)] flex-col bg-brand shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <Logo tone="on-dark" />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-white hover:bg-white/10"
                aria-label="Close menu"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <AdminNav
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
                onClick={() => setMobileOpen(true)}
              >
                ☰
              </button>
              <div>
                <p className="font-display text-sm font-semibold text-brand sm:text-base">
                  Administration
                </p>
                <p className="hidden text-xs text-brand-muted sm:block">
                  Secure IndiRoute operations console
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="min-w-0 text-right">
                <p className="truncate font-display text-sm font-semibold text-brand">
                  {user.displayName || "Admin"}
                </p>
                <p className="truncate text-xs text-brand-muted">
                  {user.email}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-md border border-border bg-background px-3.5 text-sm font-semibold text-brand transition-colors hover:border-brand/30 disabled:opacity-60"
              >
                {isSigningOut ? "Signing out..." : "Sign Out"}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
