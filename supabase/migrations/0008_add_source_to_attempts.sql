-- Migración 0008: añadir columna source a attempts
-- Ejecutar en Supabase SQL Editor o con supabase db push
-- Orden de despliegue: primero esta migración, después el código que la escribe.
-- El default 'free' mantiene funcionando la app desplegada mientras tanto
-- (los intentos antiguos y los encolados offline se consideran modo libre).

alter table public.attempts
  add column if not exists source text not null default 'free';

alter table public.attempts
  drop constraint if exists attempts_source_check;

alter table public.attempts
  add constraint attempts_source_check
  check (source in ('free', 'path', 'daily-session', 'placement'));

comment on column public.attempts.source is 'Procedencia del intento: free (modo libre), path (habilidad de «Mi camino»), daily-session (sesión diaria) o placement (prueba de colocación)';
