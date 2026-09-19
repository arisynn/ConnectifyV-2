-- Durable live duels and asynchronous challenges. API service role only.
create table if not exists public.cde_game_rooms (
  room_code text primary key,
  kind text not null check (kind in ('live','challenge')),
  state jsonb not null,
  revision bigint not null default 1,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.cde_game_rooms enable row level security;
revoke all on public.cde_game_rooms from anon, authenticated;
grant all on public.cde_game_rooms to service_role;
create index if not exists cde_game_rooms_expiry on public.cde_game_rooms(expires_at);
-- All profile writes (including earnedToday and ownership) go through the API.
drop policy if exists "Users can update their own profile_data" on public.cde_profiles;
revoke insert, update, delete on public.cde_profiles from anon, authenticated;
grant all on public.cde_profiles to service_role;
-- Currency RPCs must never be directly callable by browser credentials.
do $$ declare f record; begin
  for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('cde_mutate_permen','cde_mutate_state') loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.signature);
    execute format('grant execute on function %s to service_role', f.signature);
  end loop;
end $$;