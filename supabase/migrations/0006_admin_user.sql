-- 0006: usuario administrador único
--
-- Después de aplicar esta migración:
-- 1. Crear el usuario admin en Dashboard: Authentication > Users > Add user
--    (email real, contraseña fuerte, marcar "Auto Confirm User").
-- 2. Registrar ese usuario como admin ejecutando:
--    insert into public.admin_users (user_id)
--    select id from auth.users where email = 'EMAIL_DEL_ADMIN';

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Garantiza que solo pueda existir UNA fila (un solo admin)
create unique index if not exists admin_users_single_row on public.admin_users ((true));

alter table public.admin_users enable row level security;

drop policy if exists "admin_users select own" on public.admin_users;
create policy "admin_users select own" on public.admin_users
  for select using (auth.uid() = user_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

-- El admin puede LEER todos los perfiles e intentos (solo lectura)
drop policy if exists "profiles select admin" on public.profiles;
create policy "profiles select admin" on public.profiles
  for select using (public.is_admin());

drop policy if exists "attempts select admin" on public.attempts;
create policy "attempts select admin" on public.attempts
  for select using (public.is_admin());

-- Resetea el PIN de un niño. Replica el formato de pinToAuthPassword
-- (src/utils/authHelpers.ts): 'Pit' || pin || '!a'
create or replace function public.admin_reset_pin(target_username text, new_pin text)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  target_id uuid;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if new_pin !~ '^\d{6}$' then
    raise exception 'invalid_pin';
  end if;
  select id into target_id from public.profiles where username = lower(trim(target_username));
  if target_id is null then
    raise exception 'user_not_found';
  end if;
  update auth.users
    set encrypted_password = crypt('Pit' || new_pin || '!a', gen_salt('bf')),
        updated_at = now()
    where id = target_id;
end;
$$;

-- Resumen de avance por niño (solo admin; para otros devuelve 0 filas)
create or replace function public.admin_list_children()
returns table (
  id uuid,
  username text,
  avatar text,
  created_at timestamptz,
  total_attempts bigint,
  correct_attempts bigint,
  last_activity timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.username, p.avatar, p.created_at,
         count(a.id), count(a.id) filter (where a.is_correct),
         max(a.created_at)
  from public.profiles p
  left join public.attempts a on a.user_id = p.id
  where public.is_admin()
  group by p.id, p.username, p.avatar, p.created_at
  order by p.username;
$$;

revoke execute on function public.admin_reset_pin(text, text) from anon;
revoke execute on function public.admin_list_children() from anon;
