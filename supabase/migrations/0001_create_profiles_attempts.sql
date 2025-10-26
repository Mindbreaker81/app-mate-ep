create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar text,
  created_at timestamp with time zone default now()
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  level int not null,
  operation text not null,
  is_correct boolean not null,
  time_spent int not null default 0,
  user_answer jsonb not null,
  correct_answer jsonb not null,
  practice_mode text not null
);

alter table public.profiles enable row level security;
alter table public.attempts enable row level security;

drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles upsert own" on public.profiles;
create policy "profiles upsert own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "attempts select own" on public.attempts;
create policy "attempts select own" on public.attempts
  for select using (auth.uid() = user_id);

drop policy if exists "attempts insert own" on public.attempts;
create policy "attempts insert own" on public.attempts
  for insert with check (auth.uid() = user_id);
