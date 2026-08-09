"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAuthState } from "@/hooks/useAuthState";

export function AdminGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuthState();
  const [checkingRole, setCheckingRole] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    let cancelled = false;

    async function verifyAdmin() {
      if (loading) return;
      if (!user) {
        setCheckingRole(false);
        return;
      }

      setCheckingRole(true);
      setRoleError(null);

      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/admin/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = (await response.json().catch(() => null)) as {
          ok?: boolean;
          error?: string;
        } | null;

        if (cancelled) return;

        if (response.status === 403) {
          setIsAdmin(false);
          setCheckingRole(false);
          router.replace("/dashboard");
          return;
        }

        if (!response.ok || !payload?.ok) {
          setRoleError(
            payload?.error ||
              "Unable to verify admin access. Confirm Firebase Admin + Supabase service role keys are set, and your profile role is admin.",
          );
          setIsAdmin(false);
          setCheckingRole(false);
          return;
        }

        setIsAdmin(true);
        setCheckingRole(false);
      } catch {
        if (cancelled) return;
        setRoleError("Unable to verify admin access.");
        setIsAdmin(false);
        setCheckingRole(false);
      }
    }

    void verifyAdmin();
    return () => {
      cancelled = true;
    };
  }, [loading, user, router]);

  if (loading || checkingRole) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background px-4">
        <div className="text-center">
          <div
            className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-brand/20 border-t-accent"
            aria-hidden="true"
          />
          <p className="mt-4 font-display text-sm font-semibold text-brand">
            Verifying admin access...
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

  if (roleError) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background px-4">
        <p className="max-w-md text-center text-sm text-brand-muted">{roleError}</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background px-4">
        <p className="text-sm text-brand-muted">Redirecting...</p>
      </div>
    );
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
