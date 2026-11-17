import { createClient } from "@supabase/supabase-js";
export interface Identity { readonly userId: string; readonly expiresAt: number }
export type VerifyToken = (token: string) => Promise<Identity>;

// getClaims verifies signature/expiry; getUser additionally checks the Auth server.
// https://supabase.com/docs/reference/javascript/auth-getclaims
export function createSupabaseVerifier(url: string, publicKey: string): VerifyToken {
  const client = createClient(url, publicKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return async (token) => {
    const { data, error } = await client.auth.getClaims(token);
    if (error || !data || data.claims.role !== "authenticated" || typeof data.claims.sub !== "string" || !Number.isFinite(data.claims.exp)) throw new Error("unauthorized");
    const { data: user, error: userError } = await client.auth.getUser(token);
    if (userError || !user.user || user.user.id !== data.claims.sub || data.claims.exp * 1000 <= Date.now()) throw new Error("unauthorized");
    return { userId: user.user.id, expiresAt: data.claims.exp * 1000 };
  };
}
