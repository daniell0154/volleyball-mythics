import {createWebSupabaseClient} from "../auth/client.js";
export const attributeKeys=["serve","receive","set","attack","block","speed","jump"] as const;
export interface RosterPayload {name:string;attributes:Record<typeof attributeKeys[number],number>;abilityId:string;assetKey:string}
export interface Draft {id:string;revision:number;payload:RosterPayload}
export interface Published {id:string;version:number;name:string;enabled:boolean;payload:RosterPayload}
export interface AdminServices {
 authorized():Promise<boolean>;login(email:string,password:string):Promise<void>;logout():Promise<void>;
 list(page:number):Promise<{drafts:Draft[];published:Published[]}>;
 write(action:"save"|"publish"|"disable",id:string,expected:number,payload?:RosterPayload):Promise<Draft>;
}
export function createAdminServices():AdminServices {
 // Different storage key prevents admin login/logout from replacing a playing guest.
 const client=createWebSupabaseClient({url:import.meta.env.VITE_SUPABASE_URL??"",publishableKey:import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY??"",storageKey:"volleyball-mythics-admin"});
 const authorized=async()=>{const {data:{session}}=await client.auth.getSession();if(!session)return false;const {data,error}=await client.rpc("is_roster_admin");if(error)throw error;return data===true;};
 return {authorized,
  async login(email,password){const {error}=await client.auth.signInWithPassword({email,password});if(error)throw error;if(!await authorized()){await client.auth.signOut();throw Error("forbidden");}},
  async logout(){const {error}=await client.auth.signOut();if(error)throw error;},
  async list(page){if(!await authorized())throw Error("forbidden");const from=page*50;
   const [drafts,published]=await Promise.all([client.from("character_drafts").select("id,revision,payload").order("id").range(from,from+49),client.from("characters").select("*").order("id").order("version",{ascending:false}).range(from,from+49)]);
   if(drafts.error||published.error)throw drafts.error??published.error;
   return {drafts:drafts.data??[],published:(published.data??[]).map(c=>({id:c.id,version:c.version,name:c.name,enabled:c.enabled,payload:{name:c.name,attributes:{serve:c.serve,receive:c.receive,set:c.set_skill,attack:c.attack,block:c.block,speed:c.speed,jump:c.jump},abilityId:c.ability_id,assetKey:c.asset_key}}))};
  },
  async write(action,id,expected,payload){const {data,error}=await client.rpc("roster_write",{p_action:action,p_id:id,p_expected:expected,p_payload:payload??null});if(error)throw error;return data as Draft;}
 };
}
