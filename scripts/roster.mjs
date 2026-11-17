import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { overallFromAttributes } from '../packages/domain/dist/config/physics.js';

const root = new URL('../', import.meta.url);
const roster = JSON.parse(readFileSync(new URL('content/characters/initial.json', root), 'utf8'));
const stable = value => value && typeof value === 'object' ? Array.isArray(value) ? value.map(stable) : Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,stable(v)])) : value;
const equal = (a,b) => JSON.stringify(stable(a)) === JSON.stringify(stable(b));
const ids = new Set();
for (const c of roster) {
  if (!/^[a-z][a-z0-9-]*$/.test(c.id) || ids.has(c.id) || c.version !== 1 || !c.enabled || !c.name) throw Error('Invalid/duplicate identity'); ids.add(c.id);
  if (overallFromAttributes(c.attributes) !== c.overall) throw Error(`Overall mismatch: ${c.id}`);
  if (!['male','female'].includes(c.gender) || !new RegExp(`^procedural:v1:${c.gender}:[0-9]{1,10}$`).test(c.assetKey)) throw Error(`Invalid appearance: ${c.id}`);
  if (!Number.isInteger(c.abilityConfig.cooldownSeconds) || c.abilityConfig.cooldownSeconds <= 0 || c.abilityConfig.durationSeconds < 0) throw Error(`Invalid ability: ${c.id}`);
}
const rows = roster.map(c => ({ id:c.id, version:c.version, name:c.name, serve:c.attributes.serve, receive:c.attributes.receive, set_skill:c.attributes.set, attack:c.attributes.attack, block:c.attributes.block, speed:c.attributes.speed, jump:c.attributes.jump, ability_id:c.abilityId, ability_config:c.abilityConfig, asset_key:c.assetKey, enabled:c.enabled }));
const columns = Object.keys(rows[0]);
const select = columns.join(',');
const sqlString = value => `'${String(value).replaceAll("'", "''")}'`;
const migration = `-- Generated from content/characters/initial.json by node scripts/roster.mjs sql.\n-- Versioned catalog only. Ability handlers are implemented in feature 006.\nbegin;\ninsert into public.characters (${select}) values\n${rows.map(r=>'('+columns.map(k=>typeof r[k]==='object'?sqlString(JSON.stringify(r[k]))+'::jsonb':typeof r[k]==='string'?sqlString(r[k]):String(r[k])).join(',')+')').join(',\n')}\non conflict (id,version) do nothing;\ncommit;\n`;
const command = process.argv[2] ?? 'check';
if (command === 'sql') writeFileSync(new URL('supabase/migrations/202611160003_initial_roster.sql', root), migration);
else if (command === 'check') {
  const path = new URL('supabase/migrations/202611160003_initial_roster.sql', root);
  if (!existsSync(path) || readFileSync(path,'utf8').replaceAll('\r\n','\n') !== migration) throw Error('Regenerate roster migration');
} else if (command === 'publish') {
  const env = fileURLToPath(new URL('.env', root)); if (existsSync(env)) process.loadEnvFile(env);
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw Error('Set SUPABASE_URL and server-only SUPABASE_SECRET_KEY locally');
  const client = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const load = async () => { const {data,error}=await client.from('characters').select(select).in('id',[...ids]).eq('version',1); if(error)throw Error(`Catalog query failed (${error.code})`);return data; };
  const before=await load();
  for(const actual of before)if(!equal(actual,rows.find(r=>r.id===actual.id)))throw Error(`Immutable revision conflict: ${actual.id}/1; create a new version`);
  const {error}=await client.from('characters').upsert(rows,{onConflict:'id,version',ignoreDuplicates:true});if(error)throw Error(`Catalog write failed (${error.code})`);
  const after=await load();if(after.length!==rows.length || after.some(actual=>!equal(actual,rows.find(r=>r.id===actual.id))))throw Error('Catalog readback mismatch');
} else throw Error('Use check, sql or publish');
console.log(JSON.stringify({command,characters:roster.map(c=>({id:c.id,version:c.version,overall:c.overall}))}));
