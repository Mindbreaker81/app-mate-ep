-- 0007: estado de juego por usuario (logros, récords) sincronizado entre dispositivos
create table if not exists public.game_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.game_state enable row level security;

create policy "game_state own" on public.game_state
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.game_state to authenticated;
revoke all on public.game_state from anon;
