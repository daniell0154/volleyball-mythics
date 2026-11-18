begin;
-- Este RPC preserva a chave validada ao publicar revisões.
create or replace function public.roster_write(p_action text,p_id text,p_expected integer,p_payload jsonb default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare d public.character_drafts; v integer; a text; n numeric; config jsonb; attr jsonb;
begin
 if not public.is_roster_admin() then raise exception 'forbidden' using errcode='42501'; end if;
 if p_id is null or p_id !~ '^[a-z0-9][a-z0-9_-]{0,63}$' or p_expected is null or p_expected<0
 or p_action not in ('save','publish','disable') or p_action is null then
  raise exception 'invalid_payload' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id,0));
 select * into d from public.character_drafts where id=p_id for update;
 if coalesce(d.revision,0)<>p_expected then raise exception 'revision_conflict' using errcode='40001'; end if;
 if p_action='save' then
  if p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>8192
   or jsonb_typeof(p_payload->'name') is distinct from 'string'
   or length(btrim(p_payload->>'name')) not between 1 and 64
   or jsonb_typeof(p_payload->'attributes') is distinct from 'object'
   or jsonb_typeof(p_payload->'assetKey') is distinct from 'string'
   or (
    p_payload->>'assetKey' !~ '^procedural:(v1|athletic-v2):(male|female):[0-9]{1,10}$'
    and p_payload->>'assetKey' !~ '^procedural:visual-v3:(classic|athletic):(male|female):[0-9]{1,10}:(peach|warm|bronze|deep):(short|swept|back|short-long|swept-long|back-long|bald|curly)$'
   )
   or coalesce(p_payload->>'abilityId','') not in ('teammate_rant','free_point_out')
   or exists(select 1 from jsonb_object_keys(p_payload) k where k not in ('name','attributes','abilityId','assetKey')) then
   raise exception 'invalid_payload' using errcode='22023'; end if;
  v=case when split_part(p_payload->>'assetKey',':',2)='visual-v3' then 5 else 4 end;
  if split_part(p_payload->>'assetKey',':',v)::numeric>4294967295 then
   raise exception 'invalid_asset' using errcode='22023';
  end if;
  attr=p_payload->'attributes';
  if (select count(*) from jsonb_object_keys(attr))<>7 then raise exception 'invalid_attributes' using errcode='22023'; end if;
  foreach a in array array['serve','receive','set','attack','block','speed','jump'] loop
   if jsonb_typeof(attr->a) is distinct from 'number' then raise exception 'invalid_attribute' using errcode='22023'; end if;
   n=(attr->>a)::numeric;
   if n<>trunc(n) or n not between 1 and 100 then raise exception 'invalid_attribute' using errcode='22023'; end if;
  end loop;
  insert into public.character_drafts(id,revision,payload,updated_by)
  values(p_id,p_expected+1,p_payload,auth.uid())
  on conflict(id) do update set revision=excluded.revision,payload=excluded.payload,updated_by=excluded.updated_by,updated_at=now()
  returning * into d;
  v=d.revision;
 else
  if d.id is null then raise exception 'draft_required' using errcode='22023'; end if;
  if p_action='publish' then
   select ability_config into config from public.characters where ability_id=d.payload->>'abilityId' order by version desc,id limit 1;
   if config is null then raise exception 'ability_unavailable' using errcode='22023'; end if;
   select coalesce(max(version),0)+1 into v from public.characters where id=p_id;
   update public.characters set enabled=false where id=p_id and enabled;
   attr=d.payload->'attributes';
   insert into public.characters(id,version,name,serve,receive,set_skill,attack,block,speed,jump,ability_id,ability_config,asset_key)
   values(p_id,v,btrim(d.payload->>'name'),(attr->>'serve')::smallint,(attr->>'receive')::smallint,(attr->>'set')::smallint,
    (attr->>'attack')::smallint,(attr->>'block')::smallint,(attr->>'speed')::smallint,(attr->>'jump')::smallint,
    d.payload->>'abilityId',config,d.payload->>'assetKey');
  else
   update public.characters set enabled=false where id=p_id and enabled;
   select coalesce(max(version),0) into v from public.characters where id=p_id;
  end if;
  update public.character_drafts set revision=revision+1,updated_by=auth.uid(),updated_at=now() where id=p_id returning * into d;
 end if;
 insert into public.roster_audit(actor_id,character_id,operation,version) values(auth.uid(),p_id,p_action,v);
 return jsonb_build_object('id',d.id,'revision',d.revision,'payload',d.payload,'version',v);
end $$;
revoke all on function public.roster_write(text,text,integer,jsonb) from public,anon;
grant execute on function public.roster_write(text,text,integer,jsonb) to authenticated;
commit;
