create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  first_name text not null default '',
  last_name text,
  birth_date date,
  city text,
  country text,
  created_at timestamptz default now()
);

create table if not exists public.leagues (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.league_members (
  league_id uuid not null references public.leagues(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  points integer not null default 0,
  today_points integer not null default 0,
  joined_at timestamptz default now(),
  primary key (league_id, user_id)
);

create table if not exists public.league_daily_challenges (
  league_id uuid not null references public.leagues(id) on delete cascade,
  challenge_date date not null,
  game_ids text[] not null,
  created_at timestamptz default now(),
  primary key (league_id, challenge_date)
);

alter table public.profiles enable row level security;
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;
alter table public.league_daily_challenges enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "leagues_select_member" on public.leagues;
create policy "leagues_select_member" on public.leagues for select using (
  owner_id = auth.uid()
  or exists (
    select 1 from public.league_members lm
    where lm.league_id = leagues.id and lm.user_id = auth.uid()
  )
);

drop policy if exists "leagues_insert_owner" on public.leagues;
create policy "leagues_insert_owner" on public.leagues for insert with check (owner_id = auth.uid());

drop policy if exists "league_members_select_same_league" on public.league_members;
create policy "league_members_select_same_league" on public.league_members for select using (
  exists (
    select 1 from public.league_members mine
    where mine.league_id = league_members.league_id and mine.user_id = auth.uid()
  )
);

drop policy if exists "league_members_insert_self" on public.league_members;
create policy "league_members_insert_self" on public.league_members for insert with check (user_id = auth.uid());

drop policy if exists "league_members_update_self" on public.league_members;
create policy "league_members_update_self" on public.league_members for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "daily_challenges_select_member" on public.league_daily_challenges;
create policy "daily_challenges_select_member" on public.league_daily_challenges for select using (
  exists (
    select 1 from public.league_members lm
    where lm.league_id = league_daily_challenges.league_id and lm.user_id = auth.uid()
  )
);

drop policy if exists "daily_challenges_insert_member" on public.league_daily_challenges;
create policy "daily_challenges_insert_member" on public.league_daily_challenges for insert with check (
  exists (
    select 1 from public.league_members lm
    where lm.league_id = league_daily_challenges.league_id and lm.user_id = auth.uid()
  )
);

create or replace function public.join_league_by_code(join_code text, member_name text)
returns public.leagues
language plpgsql
security definer
set search_path = public
as $$
declare
  target_league public.leagues;
begin
  select * into target_league
  from public.leagues
  where upper(code) = upper(join_code)
  limit 1;

  if target_league.id is null then
    raise exception 'League not found';
  end if;

  insert into public.league_members (league_id, user_id, display_name)
  values (target_league.id, auth.uid(), coalesce(nullif(member_name, ''), 'Player'))
  on conflict (league_id, user_id) do nothing;

  return target_league;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    birth_date,
    city,
    country
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    nullif(new.raw_user_meta_data->>'last_name', ''),
    nullif(new.raw_user_meta_data->>'birth_date', '')::date,
    nullif(new.raw_user_meta_data->>'city', ''),
    nullif(new.raw_user_meta_data->>'country', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    birth_date = excluded.birth_date,
    city = excluded.city,
    country = excluded.country;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
