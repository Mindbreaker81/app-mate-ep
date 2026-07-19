# Diseño: usuario administrador único

**Fecha:** 2026-07-19
**Estado:** aprobado

## Objetivo

Un único administrador que pueda: ver el avance de todos los niños, resetear/crear
un nuevo PIN cuando un niño lo olvide, y cambiar su propia contraseña. Acceso desde
un botón "Admin" en la pantalla de inicio, con email + contraseña completa (no PIN).

## Contexto

- SPA Vite + React 19 + Supabase (`@supabase/supabase-js`).
- Base de datos activa: proyecto Supabase cloud `sezqtlebdodwwbekgnlw` (región
  `aws-1-us-east-1`). El `DATABASE_URL` del `.env` apunta a un Postgres propio
  (79.72.57.209) que está vacío y no lo usa la app; no se toca.
- Los niños se autentican con username + PIN de 6 dígitos, convertido en email
  sintético (`<user>@pitagoritas-mail.com`) y contraseña `Pit<pin>!a`
  (`pinToAuthPassword` en `src/utils/authHelpers.ts`).
- RLS: cada usuario solo ve sus propios `profiles` y `attempts`.

## Base de datos (migración `0006_admin_user.sql`)

### Tabla `admin_users`

- `user_id uuid primary key references auth.users(id) on delete cascade`.
- Índice único sobre una constante (`create unique index one_admin on
  admin_users ((true))`) → garantiza **máximo una fila** = un solo admin.
- RLS: el usuario puede leer solo su propia fila (para detectar `isAdmin`).
- La cuenta admin se crea a mano en el Dashboard de Supabase (Authentication →
  Add user) con el email real y contraseña fuerte; luego se inserta su UUID en
  `admin_users`. La migración documenta el comando.

### Función `is_admin()`

`security definer`, `stable`: devuelve si `auth.uid()` está en `admin_users`.
La usan las políticas RLS y los RPC.

### Políticas RLS nuevas (solo lectura para admin)

- `profiles`: SELECT para admin sobre todas las filas.
- `attempts`: SELECT para admin sobre todas las filas.
- El admin no puede modificar ni borrar datos de niños.

### RPC `admin_reset_pin(target_username text, new_pin text)`

`security definer`. Pasos: (1) exige `is_admin()`; (2) valida `new_pin ~ '^\d{6}$'`;
(3) busca el `id` por username en `profiles`; (4) actualiza
`auth.users.encrypted_password = crypt('Pit' || new_pin || '!a', gen_salt('bf'))`.
Mismo formato que `pinToAuthPassword` → el niño entra con el PIN nuevo sin cambios
en el login. Errores con `raise exception` y mensajes identificables.

### RPC `admin_list_children()`

`security definer`, exige `is_admin()`. Devuelve por niño: `id`, `username`,
`avatar`, `created_at`, `total_attempts`, `correct_attempts`, `last_activity`.
Agregación en SQL (eficiente con muchos intentos).

## Frontend

### Botón "Admin" y login

- En `AuthGate` (pantalla inicial), botón discreto "Admin" al pie.
- `AdminLogin`: formulario email + contraseña → `supabase.auth.signInWithPassword`
  directo (sin email sintético ni PIN).

### `AuthContext`

- Nuevo estado `isAdmin: boolean`, resuelto al cargar la sesión consultando
  `admin_users` (fila propia, permitida por RLS).
- Cuando `isAdmin`, se omite el flujo "sin perfil → signOut" (el admin no tiene
  perfil de niño).

### Enrutado (`App.tsx`)

- `isAdmin` → `AdminDashboard` en lugar del juego. Los niños nunca ven el panel;
  el admin nunca ve ejercicios.

### `AdminDashboard`

1. **Tabla de niños**: avatar, username, intentos totales, % aciertos, última
   actividad (`admin_list_children()`). Clic en un niño → estadísticas completas
   reutilizando `DetailedStats` + `fetchUserStats` (permitido por la nueva RLS).
2. **Reset de PIN**: por niño, diálogo con PIN nuevo de 6 dígitos (o "generar
   aleatorio"), confirmación, llamada al RPC, y muestra del PIN para comunicarlo.
3. **Cambiar mi contraseña**: contraseña nueva + confirmación (mín. 8 caracteres)
   → `supabase.auth.updateUser({ password })`.
4. Cerrar sesión.

### Errores

Mensajes en español coherentes con el estilo actual: credenciales inválidas, PIN
mal formado, usuario no encontrado, sin permisos.

## Tests

- Unit tests de `AdminLogin` y `AdminDashboard` con Supabase mockeado, siguiendo
  el patrón de `LoginForm.test.tsx` / `RegisterForm.test.tsx`.
- Test de `AuthContext` para la detección de `isAdmin` si resulta razonable con
  la infraestructura actual.

## Aplicación de la migración

En el proyecto Supabase cloud: SQL Editor del Dashboard, o `psql` con la
connection string del Session pooler. Después, crear el usuario admin en el
Dashboard e insertar su UUID en `admin_users`.
