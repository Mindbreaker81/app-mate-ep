-- Migración 0005: ampliar grade para incluir 6.º de Primaria (6e)

alter table public.attempts
  drop constraint if exists attempts_grade_check;

alter table public.attempts
  add constraint attempts_grade_check
  check (grade in ('4t', '5e', '6e'));

comment on column public.attempts.grade is 'Curso escolar: 4t (4.º), 5e (5.º) o 6e (6.º)';
