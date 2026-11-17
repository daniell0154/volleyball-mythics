import type { CatalogEntry } from "@volleyball-mythics/protocol";
import { createWebSupabaseClient, saveGuestProfile } from "../auth/client.js";
import { gameServerUrl } from "../network/serverUrl.js";

export interface LobbyServices {
  prepareSession(): Promise<string>;
  saveName(name: string): Promise<void>;
  loadCatalog(): Promise<CatalogEntry[]>;
  serverUrl(): string;
}
export function createLobbyServices(): LobbyServices {
  let client: ReturnType<typeof createWebSupabaseClient> | undefined;
  let preparing: Promise<string> | undefined;
  const database = () => client ??= createWebSupabaseClient({ url: import.meta.env.VITE_SUPABASE_URL ?? "", publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "" });
  const prepareSession = () => {
    if (!preparing) preparing = (async () => {
      const { data: { session } } = await database().auth.getSession();
      if (session) return session.access_token;
      const { data, error } = await database().auth.signInAnonymously();
      if (error || !data.session) throw error ?? new Error("Guest session unavailable");
      return data.session.access_token;
    })().finally(() => { preparing = undefined; });
    return preparing;
  };
  return {
    prepareSession,
    saveName: (name) => saveGuestProfile(database(), name),
    async loadCatalog() {
      await prepareSession();
      const { data, error } = await database().from("characters")
        .select("id,version,name,overall,asset_key,ability_id,ability_config,serve,receive,set_skill,attack,block,speed,jump").eq("enabled",true).order("name");
      if (error || !data) throw error ?? new Error("Catalog unavailable");
      return data.map((c): CatalogEntry => ({ id: c.id, version: c.version, name: c.name, overall: c.overall, assetKey: c.asset_key,
        abilityId: c.ability_id, abilityConfig: c.ability_config,
        abilityName: typeof c.ability_config?.name === "string" ? c.ability_config.name : c.ability_id,
        attributes: { serve:c.serve, receive:c.receive, set:c.set_skill, attack:c.attack, block:c.block, speed:c.speed, jump:c.jump } }));
    },
    serverUrl: () => gameServerUrl(location.href,import.meta.env.DEV,import.meta.env.VITE_GAME_SERVER_URL),
  };
}
