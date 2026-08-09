import type { SupabaseClient } from "@supabase/supabase-js";

export async function createNotification(
  db: SupabaseClient,
  input: {
    profileId: string;
    title: string;
    body?: string;
    type: string;
  },
) {
  const { error } = await db.from("notifications").insert({
    profile_id: input.profileId,
    title: input.title,
    body: input.body ?? null,
    type: input.type,
  });

  if (error) {
    console.error("[notifications] failed to create", error.message);
  }
}

export async function notifyAdmins(
  db: SupabaseClient,
  input: { title: string; body?: string; type: string },
) {
  const { data: admins } = await db
    .from("profiles")
    .select("id")
    .eq("role", "admin");

  if (!admins?.length) return;

  const rows = admins.map((admin) => ({
    profile_id: admin.id,
    title: input.title,
    body: input.body ?? null,
    type: input.type,
  }));

  const { error } = await db.from("notifications").insert(rows);
  if (error) {
    console.error("[notifications] failed to notify admins", error.message);
  }
}
