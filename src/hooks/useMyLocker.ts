"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthState } from "@/hooks/useAuthState";
import type { CustomerLockerView } from "@/lib/locker-display";

type UseMyLockerResult = {
  locker: CustomerLockerView | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useMyLocker(): UseMyLockerResult {
  const { user, loading: authLoading } = useAuthState();
  const [locker, setLocker] = useState<CustomerLockerView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(async () => {
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      queueMicrotask(() => {
        setLocker(null);
        setError(null);
        setLoading(false);
      });
      return;
    }

    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
    });

    async function loadLocker() {
      try {
        const idToken = await user!.getIdToken();
        const response = await fetch("/api/lockers/me", {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        const payload = (await response.json().catch(() => null)) as {
          locker?: CustomerLockerView;
          error?: string;
        } | null;

        if (cancelled) return;

        if (!response.ok) {
          setLocker(null);
          setError(
            payload?.error ||
              "We couldn't load your India locker yet. Please try again shortly.",
          );
          return;
        }

        setLocker(payload?.locker ?? null);
        if (!payload?.locker) {
          setError(
            "Your locker has not been assigned yet. Please refresh or sign in again.",
          );
        } else {
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setLocker(null);
          setError(
            "We couldn't load your India locker yet. Please try again shortly.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadLocker();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, reloadKey]);

  return {
    locker,
    loading: authLoading || loading,
    error,
    refresh,
  };
}
