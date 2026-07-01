# Migración de base de datos — Pitagoritas v2.0

Este documento describe los cambios de base de datos necesarios para la expansión curricular v2.0.

## Resumen

Se añade la columna `grade` a la tabla `attempts` para guardar el curso escolar (4.º o 5.º) en cada intento.

## Archivo de migración

La migración SQL está en:

`supabase/migrations/0004_add_grade_to_attempts.sql`

## Cómo aplicarla

### Opción A: Supabase Dashboard

1. Abre tu proyecto en [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Ve a **SQL Editor**
3. Copia y ejecuta el contenido de `0004_add_grade_to_attempts.sql`

### Opción B: Supabase CLI

```bash
supabase db push
```

### Opción C: Ejecución manual

```sql
alter table public.attempts
  add column if not exists grade text not null default '4t';

create index if not exists attempts_user_grade_idx
  on public.attempts (user_id, grade);
```

## Compatibilidad

- La columna tiene `default '4t'`, así que los intentos antiguos quedan marcados como 4.º de Primaria.
- La aplicación funciona **sin** esta migración: si la columna no existe, Supabase rechazará el campo `grade` en el insert. En ese caso, hay que aplicar la migración para registrar el curso.
- Tras aplicar la migración, los nuevos intentos incluirán `grade: '4t' | '5e'`.

## Verificación

```sql
select grade, count(*)
from public.attempts
group by grade;
```

Deberías ver filas con `4t` (histórico) y `5e` (nuevos intentos en 5.º).

## Rollback (solo si fuera necesario)

```sql
drop index if exists attempts_user_grade_idx;
alter table public.attempts drop column if exists grade;
```
