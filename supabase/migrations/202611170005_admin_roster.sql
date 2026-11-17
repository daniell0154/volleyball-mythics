begin;
create table public.roster_admins (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.roster_admins enable row level security;
revoke all on public.roster_admins from anon, authenticated;

create function public.is_roster_admin() returns boolean language sql stable security definer
set search_path = public, pg_temp as $$
 select coalesce((auth.jwt()->>'is_anonymous')::boolean,true) = false
 and exists(select 1 from public.roster_admins where user_id=auth.uid())
$$;
revoke all on function public.is_roster_admin() from public, anon;
grant execute on function public.is_roster_admin() to authenticated;

create table public.character_drafts (
 id text primary key check(id ~ '^[a-z0-9][a-z0-9_-]{0,63}$'),
 revision integer not null default 1 check(revision>0),
 payload jsonb not null check(jsonb_typeof(payload)='object' and octet_length(payload::text)<=8192),
 updated_by uuid not null references auth.users(id),
 updated_at timestamptz not null default now()
);
create table public.roster_audit (
 id bigint generated always as identity primary key,
 actor_id uuid not null references auth.users(id),
 character_id text not null,
 operation text not null check(operation in ('save','publish','disable')),
 version integer not null,
 created_at timestamptz not null default now()
);
alter table public.character_drafts enable row level security;
alter table public.roster_audit enable row level security;
revoke all on public.character_drafts,public.roster_audit from anon,authenticated;
grant select on public.character_drafts,public.roster_audit to authenticated;
create policy admin_drafts on public.character_drafts for select to authenticated using(public.is_roster_admin());
create policy admin_audit on public.roster_audit for select to authenticated using(public.is_roster_admin());
create policy admin_characters on public.characters for select to authenticated using(public.is_roster_admin());

-- Published content is immutable, including writes made with a service credential.
create function public.guard_character_revision() returns trigger language plpgsql as $$
begin
 if tg_op='DELETE' then raise exception 'immutable_revision' using errcode='23514'; end if;
 if (to_jsonb(new)-'enabled') is distinct from (to_jsonb(old)-'enabled') then
  raise exception 'immutable_revision' using errcode='23514';
 end if;
 return new;
end $$;
create trigger immutable_character_revision before update or delete on public.characters
for each row execute function public.guard_character_revision();
commit;
