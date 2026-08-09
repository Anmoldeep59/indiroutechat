"use client";

import { useEffect, useState } from "react";
import { useAuthState } from "@/hooks/useAuthState";

type Notification = {
  id: string;
  title: string;
  body: string | null;
  type: string;
  read_at: string | null;
  created_at: string;
};

export function NotificationsInbox() {
  const { user } = useAuthState();
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const token = await user.getIdToken();
      const response = await fetch("/api/notifications/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = (await response.json()) as {
        notifications?: Notification[];
      };
      setItems(payload.notifications ?? []);
      await fetch("/api/notifications/me", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ markAllRead: true }),
      });
    })();
  }, [user]);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <h1 className="font-display text-2xl font-bold text-brand">
          Notifications
        </h1>
      </section>
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-brand-muted">No notifications yet.</p>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <p className="font-semibold text-brand">{item.title}</p>
              {item.body ? (
                <p className="mt-1 text-sm text-brand-muted">{item.body}</p>
              ) : null}
              <p className="mt-2 text-xs text-brand-muted">
                {new Date(item.created_at).toLocaleString()}
              </p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
