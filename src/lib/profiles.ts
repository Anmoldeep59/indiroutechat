import type { User } from "firebase/auth";
import { supabase } from "@/lib/supabase";

export type ProfileUpsertInput = {
  firebaseUid: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  country?: string | null;
  avatarUrl?: string | null;
};

function splitDisplayName(displayName: string | null | undefined): {
  firstName: string | null;
  lastName: string | null;
} {
  if (!displayName?.trim()) {
    return { firstName: null, lastName: null };
  }

  const parts = displayName.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? null,
    lastName: parts.slice(1).join(" ") || null,
  };
}

export async function upsertProfile(input: ProfileUpsertInput) {
  const payload = {
    firebase_uid: input.firebaseUid,
    email: input.email ?? null,
    first_name: input.firstName ?? null,
    last_name: input.lastName ?? null,
    phone: input.phone ?? null,
    country: input.country ?? null,
    avatar_url: input.avatarUrl ?? null,
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "firebase_uid" })
    .select("*")
    .single();

  return { data, error };
}

export async function upsertProfileFromFirebaseUser(
  user: User,
  extras?: Partial<Omit<ProfileUpsertInput, "firebaseUid" | "email">>,
) {
  const fromDisplay = splitDisplayName(user.displayName);

  return upsertProfile({
    firebaseUid: user.uid,
    email: user.email,
    firstName: extras?.firstName ?? fromDisplay.firstName,
    lastName: extras?.lastName ?? fromDisplay.lastName,
    phone: extras?.phone ?? user.phoneNumber,
    country: extras?.country ?? null,
    avatarUrl: extras?.avatarUrl ?? user.photoURL,
  });
}
