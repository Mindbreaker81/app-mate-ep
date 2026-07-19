# Migración de base de datos — Pitagoritas

Este documento describe los cambios de base de datos necesarios para las expansiones curriculares v2.0 y v3.0, el usuario administrador (v3.1) y el estado de juego por usuario (v3.2).

## v3.2 — Estado de juego por usuario

### Resumen

Añade la tabla `game_state` (una fila por usuario, columna `data` jsonb) para que
logros, récords y meta diaria sigan al niño entre dispositivos en lugar de vivir
solo en el localStorage del navegador. RLS: cada usuario solo ve y escribe su fila.

### Archivo de migración

`supabase/migrations/0007_game_state.sql`

### Cómo aplicarla

Ejecuta el contenido de `0007_game_state.sql` en el SQL Editor del Dashboard
(o con `psql` usando la connection string del Session pooler).

### Verificación

```sql
select policyname from pg_policies where tablename = 'game_state';
```

Debe devolver `game_state own`. Tras jugar con un niño logueado:

```sql
select user_id, data->>'maxScore' as max_score, updated_at from public.game_state;
```

## v3.1 — Usuario administrador único

### Resumen

Añade la tabla `admin_users` (limitada a una sola fila), la función `is_admin()`,
políticas RLS de solo lectura para que el admin vea todos los perfiles e intentos,
y los RPC `admin_reset_pin` (resetea el PIN de un niño) y `admin_list_children`
(resumen de avance por niño).

### Archivo de migración

`supabase/migrations/0006_admin_user.sql`

### Cómo aplicarla

1. Ejecuta el contenido de `0006_admin_user.sql` en el SQL Editor del Dashboard
   (o con `psql` usando la connection string del Session pooler).
2. Crea el usuario admin: Authentication → Users → **Add user** (email real,
   contraseña fuerte, marca **Auto Confirm User**).
3. Regístralo como admin:

```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'EMAIL_DEL_ADMIN';
```

### Verificación

```sql
select u.email from public.admin_users a join auth.users u on u.id = a.user_id;
```

Debe devolver exactamente una fila con el email del admin. Después, en la app:
botón "Admin" → login con email y contraseña → panel con la lista de niños.

## v3.0 — Validación de curso 6.º (`6e`)

### Resumen

Amplía el valor permitido de `grade` en `attempts` para incluir `6e` (6.º de Primaria).

### Archivo de migración

`supabase/migrations/0005_validate_grade_6e.sql`

### Cómo aplicarla

Igual que v2.0: Supabase Dashboard → SQL Editor, o `supabase db push`.

### Verificación

```sql
select grade, count(*)
from public.attempts
group by grade;
```

Deberías ver filas con `4t`, `5e` y `6e`.

---

## v2.0 — Columna `grade` en intentos

### Resumen

Se añade la columna `grade` a la tabla `attempts` para guardar el curso escolar en cada intento.

### Archivo de migración

`supabase/migrations/0004_add_grade_to_attempts.sql`

### Cómo aplicarla

#### Opción A: Supabase Dashboard

1. Abre tu proyecto en [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Ve a **SQL Editor**
3. Copia y ejecuta el contenido de `0004_add_grade_to_attempts.sql`
4. Ejecuta también `0005_validate_grade_6e.sql` para v3.0

#### Opción B: Supabase CLI

```bash
supabase db push
```

#### Opción C: Ejecución manual

```sql
alter table public.attempts
  add column if not exists grade text not null default '4t';

create index if not exists attempts_user_grade_idx
  on public.attempts (user_id, grade);

alter table public.attempts
  drop constraint if exists attempts_grade_check;

alter table public.attempts
  add constraint attempts_grade_check
  check (grade in ('4t', '5e', '6e'));
```

## Compatibilidad

- La columna tiene `default '4t'`, así que los intentos antiguos quedan marcados como 4.º de Primaria.
- La aplicación funciona **sin** esta migración: si la columna no existe, Supabase rechazará el campo `grade` en el insert. En ese caso, hay que aplicar la migración para registrar el curso.
- Tras aplicar las migraciones, los nuevos intentos incluirán `grade: '4t' | '5e' | '6e'`.

## Rollback (solo si fuera necesario)

```sql
drop index if exists attempts_user_grade_idx;
alter table public.attempts drop constraint if exists attempts_grade_check;
alter table public.attempts drop column if exists grade;
```
