import { createClient } from "@supabase/supabase-js";
import { VersionedCharacterCatalog } from "@volleyball-mythics/domain";
import type { CatalogEntry } from "@volleyball-mythics/protocol";

/** Authenticated RLS read; no admin or service credential is needed. */
export function createCatalogLoader(url: string, publicKey: string) {
  const revisions = new VersionedCharacterCatalog();
  return async (token: string): Promise<CatalogEntry[]> => {
    const db = createClient(url, publicKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await db.from("characters").select("id,version,name,overall,asset_key,ability_id,ability_config,serve,receive,set_skill,attack,block,speed,jump").eq("enabled", true);
    if (error || !data) throw new Error("catalog_unavailable");
    return revisions.replaceEnabled(data.map(c => ({ id:c.id,version:c.version,name:c.name,overall:c.overall,assetKey:c.asset_key,
      attributes:{serve:c.serve,receive:c.receive,set:c.set_skill,attack:c.attack,block:c.block,speed:c.speed,jump:c.jump},abilityId:c.ability_id,abilityConfig:c.ability_config
    }))).map(c=>({...c,abilityName:typeof c.abilityConfig?.name==="string"?c.abilityConfig.name:(c.abilityId??"Habilidade")}));
  };
}
