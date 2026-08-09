"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useAuthState } from "@/hooks/useAuthState";

export function DashboardGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuthState();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background px-4">
        <div className="text-center">
          <div
            className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-brand/20 border-t-accent"
            aria-hidden="true"
          />
          <p className="mt-4 font-display text-sm font-semibold text-brand">
            Loading your dashboard...
          </p>
          <p className="mt-1 text-sm text-brand-muted">
            Checking your IndiRoute account.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background px-4">
        <p className="text-sm text-brand-muted">Redirecting to sign in...</p>
      </div>
    );
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
