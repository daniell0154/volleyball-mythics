create extension if not exists pgcrypto with schema extensions;

create type public.match_mode as enum ('1v1', '2v2');
create type public.match_status as enum ('created', 'active', 'finished', 'cancelled');
create type public.match_reason as enum ('points', 'forfeit', 'server_failure');
create type public.team_side as enum ('A', 'B');

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 24),
  created_at timestamptz not null default now()
);

create table public.characters (
  id text not null,
  version integer not null check (version > 0),
  name text not null check (char_length(name) between 1 and 64),
  serve smallint not null check (serve between 1 and 100),
  receive smallint not null check (receive between 1 and 100),
  set_skill smallint not null check (set_skill between 1 and 100),
  attack smallint not null check (attack between 1 and 100),
  block smallint not null check (block between 1 and 100),
  speed smallint not null check (speed between 1 and 100),
  jump smallint not null check (jump between 1 and 100),
  overall smallint generated always as (round((serve + receive + set_skill + attack + block + speed + jump)::numeric / 7)::smallint) stored,
  ability_id text not null,
  ability_config jsonb not null default '{}'::jsonb check (jsonb_typeof(ability_config) = 'object'),
  asset_key text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (id, version)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  mode public.match_mode not null,
  status public.match_status not null default 'created',
  score_a smallint not null default 0 check (score_a between 0 and 6),
  score_b smallint not null default 0 check (score_b between 0 and 6),
  winner public.team_side,
  reason public.match_reason,
  rules_version integer not null check (rules_version > 0),
  result_hash text,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  check ((status = 'finished' and winner is not null and reason is not null and ended_at is not null)
      or status <> 'finished'),
  check (winner is null or (winner = 'A' and score_a = 6) or (winner = 'B' and score_b = 6)
      or reason <> 'points'),
  check (ended_at is null or started_at is null or ended_at >= started_at),
  unique (id, result_hash)
);

create table public.match_players (
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  team public.team_side not null,
  slot smallint not null check (slot in (0, 1)),
  character_id text not null,
  character_version integer not null,
  joined_at timestamptz not null default now(),
  primary key (match_id, user_id),
  unique (match_id, team, slot),
  foreign key (character_id, character_version) references public.characters(id, version)
);

create index match_players_user_recent on public.match_players(user_id, joined_at desc);
create index matches_recent on public.matches(created_at desc);

alter table public.profiles enable row level security;
alter table public.characters enable row level security;
alter table public.matches enable row level security;
alter table public.match_players enable row level security;

create policy "Users can read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create own profile" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Authenticated users can read enabled characters" on public.characters
  for select to authenticated using (enabled);
create policy "Users can read own match participants" on public.match_players
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can read own matches" on public.matches
  for select to authenticated using (
    exists (select 1 from public.match_players p where p.match_id = id and p.user_id = (select auth.uid()))
  );

revoke insert, update, delete on public.characters, public.matches, public.match_players from anon, authenticated;
revoke update, delete on public.profiles from anon;
grant select on public.characters to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.matches, public.match_players to authenticated;
grant all on public.characters, public.matches, public.match_players, public.profiles to service_role;
