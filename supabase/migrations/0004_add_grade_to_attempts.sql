-- Migración 0004: añadir columna grade a attempts
-- Ejecutar en Supabase SQL Editor o con supabase db push

alter table public.attempts
  add column if not exists grade text not null default '4t';

comment on column public.attempts.grade is 'Curso escolar: 4t (4.º) o 5e (5.º)';

-- Opcional: índice para filtrar estadísticas por curso
create index if not exists attempts_user_grade_idx
  on public.attempts (user_id, grade);
