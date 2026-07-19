# Usuario administrador único — Plan de implementación

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Un único admin (email real + contraseña) que ve el avance de todos los niños, resetea PINs olvidados y puede cambiar su contraseña, accesible desde un botón "Admin" en la pantalla de inicio.

**Architecture:** Migración SQL en Supabase cloud (tabla `admin_users` de una sola fila, `is_admin()`, RLS de solo lectura para el admin, RPCs `admin_reset_pin` y `admin_list_children` con `SECURITY DEFINER`). En el frontend: `AuthContext` gana `isAdmin`/`signInAdmin`/`changePassword`; `App.tsx` enruta a `AdminDashboard` cuando `isAdmin`; `AuthGate` añade el botón "Admin" y el formulario `AdminLogin`.

**Tech Stack:** React 19 + Vite, Supabase JS v2, Tailwind, Vitest + Testing Library. Diseño aprobado: `docs/plans/2026-07-19-admin-user-design.md`.

---

### Task 1: Migración SQL `0006_admin_user.sql`

**Files:**
- Create: `supabase/migrations/0006_admin_user.sql`

Sin test automatizado (SQL); se verifica al aplicarla (Task 8). Contenido completo:

```sql
-- 0006: usuario administrador único
-- Después de aplicar: crear el usuario admin en Dashboard (Authentication > Add user,
-- email real, contraseña fuerte, auto-confirm) y ejecutar:
--   insert into public.admin_users (user_id)
--   select id from auth.users where email = 'EMAIL_DEL_ADMIN';

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

-- Resetear el PIN de un niño: replica pinToAuthPassword ('Pit' || pin || '!a')
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
    set encrypted_password = extensions.crypt('Pit' || new_pin || '!a', extensions.gen_salt('bf')),
        updated_at = now()
    where id = target_id;
end;
$$;

-- Resumen de avance por niño
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
```

Commit: `feat(db): migración de usuario administrador único`

### Task 2: `adminService` con TDD

**Files:**
- Create: `src/services/adminService.ts`
- Test: `src/services/__tests__/adminService.test.ts`

API: `listChildren(): Promise<ChildOverview[] | null>` (RPC `admin_list_children`, mapea a camelCase) y `resetChildPin(username, pin): Promise<{ ok: true } | { ok: false; error: string }>` (RPC `admin_reset_pin`, traduce `not_admin`/`invalid_pin`/`user_not_found` a mensajes en español). Mock de `supabase.rpc` con el patrón `vi.hoisted` de `attemptService.test.ts`. Escribir tests primero (fallan por módulo inexistente), implementar, verificar verde, commit.

### Task 3: `AuthContext` — `isAdmin`, `signInAdmin`, `changePassword`

**Files:**
- Modify: `src/context/AuthContext.tsx`

- `isAdmin: boolean` en el contexto; se resuelve en `fetchProfile`-time: al resolver sesión, `select user_id from admin_users` (fila propia). Si es admin, no exigir perfil (saltar el signOut de "falta perfil").
- `signInAdmin({ email, password })`: `signInWithPassword` directo, mensajes de error en español; verifica tras login que el usuario está en `admin_users`, si no → signOut + error.
- `changePassword(newPassword)`: `supabase.auth.updateUser({ password })`.
- Actualizar `AuthContextValue` y los mocks de tests existentes que construyen el value a mano (LoginForm/RegisterForm tests) añadiendo los campos nuevos.
- Verificar: `npm test` en verde. Commit.

### Task 4: Extraer `StatsView` presentacional de `DetailedStats`

**Files:**
- Create: `src/components/StatsView.tsx`
- Modify: `src/components/DetailedStats.tsx`

`StatsView({ stats, correctExercises, totalExercises })` contiene el JSX actual; `DetailedStats` queda como wrapper que lee de `useGame` y delega. Sin cambios visuales. `npm test` + typecheck en verde. Commit.

### Task 5: `AdminLogin` con TDD

**Files:**
- Create: `src/components/auth/AdminLogin.tsx`
- Test: `src/components/auth/__tests__/AdminLogin.test.tsx`

Formulario email + contraseña que llama a `signInAdmin`; botón "Volver" (prop `onBack`). Test: rellena campos, submit, espera `signInAdmin` llamado con `{ email, password }`. Patrón `renderWithAuth` de `LoginForm.test.tsx`.

### Task 6: `AdminDashboard` con TDD

**Files:**
- Create: `src/components/admin/AdminDashboard.tsx`
- Create: `src/components/admin/PinResetDialog.tsx`
- Create: `src/components/admin/ChangePasswordForm.tsx`
- Test: `src/components/admin/__tests__/AdminDashboard.test.tsx`

- Dashboard: carga `listChildren()` en un `useEffect`; tabla (avatar, usuario, intentos, % aciertos, última actividad); clic en fila → vista detalle con `StatsView` alimentado por `fetchUserStats(childId)`; botón "Nuevo PIN" → `PinResetDialog` (input 6 dígitos + "Generar aleatorio" + confirmación; muestra el PIN aplicado); sección "Cambiar mi contraseña" (`ChangePasswordForm`: nueva + confirmación, mín. 8, llama `changePassword`); botón "Cerrar sesión".
- Tests: renderiza lista desde `listChildren` mockeado; reset de PIN llama `resetChildPin` con username y pin; validación de contraseña corta.

### Task 7: Integración — botón Admin en `AuthGate` y enrutado en `App.tsx`

**Files:**
- Modify: `src/components/auth/AuthGate.tsx` (modo `'admin'`, botón discreto al pie, render de `AdminLogin`)
- Modify: `src/App.tsx` (si `isAdmin` → `AdminDashboard` sin `GameProvider`/`Layout` de juego)

`AuthGate` decide: sin sesión → login/registro/admin; con sesión + `isAdmin` → `AdminDashboard`. Smoke test (`appSmoke.test.tsx`) debe seguir en verde. `npm run lint` + `npm run build`. Commit.

### Task 8: Aplicar migración en Supabase cloud y crear el admin

- Aplicar `0006_admin_user.sql` (SQL Editor del Dashboard o psql con connection string del Session pooler — pedirla al usuario).
- Crear usuario admin en Dashboard (email real, auto-confirm) e insertar su UUID en `admin_users`.
- Verificar: login admin en la app, lista de niños visible, reset de PIN de un usuario de prueba funciona, login del niño con PIN nuevo funciona.
- Actualizar `DATABASE_MIGRATION.md` con la sección v3.1. Commit final.
