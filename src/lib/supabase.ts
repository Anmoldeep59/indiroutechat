import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Browser/shared Supabase client using the public anon key only.
 * Do not use the service-role key in frontend code.
 *
 * Uses a harmless placeholder during build when env vars are absent.
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl && supabaseAnonKey
    ? supabaseUrl
    : "https://placeholder.supabase.co",
  supabaseUrl && supabaseAnonKey ? supabaseAnonKey : "public-anon-key",
);
