import type { User } from "firebase/auth";

type SyncExtras = {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  country?: string | null;
  avatarUrl?: string | null;
};

export async function syncProfileWithServer(
  user: User,
  extras?: SyncExtras,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const idToken = await user.getIdToken();
    const response = await fetch("/api/profiles/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idToken,
        firstName: extras?.firstName ?? null,
        lastName: extras?.lastName ?? null,
        phone: extras?.phone ?? null,
        country: extras?.country ?? null,
        avatarUrl: extras?.avatarUrl ?? user.photoURL ?? null,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      return {
        ok: false,
        error: payload?.error ?? "Profile sync failed.",
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Profile sync failed.",
    };
  }
}
