# Migración de base de datos — Pitagoritas

Este documento describe los cambios de base de datos necesarios para las expansiones curriculares v2.0 y v3.0.

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
