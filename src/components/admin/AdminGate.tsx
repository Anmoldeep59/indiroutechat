"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAuthState } from "@/hooks/useAuthState";
import { supabase } from "@/lib/supabase";

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

      const { data, error } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("firebase_uid", user.uid)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        setRoleError(
          "Unable to verify admin access. Confirm Supabase is configured and your profile exists.",
        );
        setIsAdmin(false);
        setCheckingRole(false);
        return;
      }

      const adminRole = data?.role === "admin";
      setIsAdmin(adminRole);
      setCheckingRole(false);

      if (!adminRole) {
        router.replace("/dashboard");
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
