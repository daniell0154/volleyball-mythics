import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface SupabasePublicConfig {
  url: string;
  publishableKey: string;
  storageKey?: string;
}

export function createWebSupabaseClient(config: SupabasePublicConfig): SupabaseClient {
  if (!URL.canParse(config.url) || !config.url.startsWith("https://")) {
    throw new Error("VITE_SUPABASE_URL must be an HTTPS URL");
  }
  if (!config.publishableKey.trim()) throw new Error("Supabase publishable key is required");
  return createClient(config.url, config.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, ...(config.storageKey?{storageKey:config.storageKey}:{}) },
  });
}

export async function signInAsGuest(client: SupabaseClient) {
  const { data, error } = await client.auth.signInAnonymously();
  if (error) throw error;
  if (!data.user) throw new Error("Supabase returned no guest identity");
  return data.user;
}

export async function saveGuestProfile(client: SupabaseClient, displayName: string) {
  const name = displayName.trim();
  if (name.length < 2 || name.length > 24) throw new Error("Display name must contain 2–24 characters");
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error("Sign in before saving a profile");
  const { error } = await client.from("profiles").upsert(
    { user_id: user.id, display_name: name },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}
