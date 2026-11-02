-- 0009: acceso de SOLO LECTURA al dominio por habilidad para el administrador (PIT-29)
--
-- El admin ya lee perfiles e intentos (0006), pero game_state tiene RLS solo
-- para el propietario (0007). Este RPC security definer expone únicamente
-- data->'skills' y updated_at del niño pedido: ni PIN, ni logros, ni el resto
-- de data, ni el estado de otros usuarios. No escribe nada.
--
-- ESTADO: pendiente de aplicar. Requiere aprobación expresa antes de
-- ejecutarse en Supabase (ver DATABASE_MIGRATION.md).

create or replace function public.admin_get_skill_progress(target_user_id uuid)
returns table (
  skills jsonb,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  -- Solo niños: el perfil debe existir y no ser una cuenta de administrador
  if not exists (
    select 1
    from public.profiles p
    where p.id = target_user_id
      and not exists (select 1 from public.admin_users au where au.user_id = p.id)
  ) then
    raise exception 'user_not_found';
  end if;
  -- Si el niño aún no tiene fila en game_state devuelve 0 filas (sin datos,
  -- no un error): quien llama distingue «vacío» de «sin permisos».
  return query
    select gs.data -> 'skills' as skills, gs.updated_at
    from public.game_state gs
    where gs.user_id = target_user_id;
end;
$$;

comment on function public.admin_get_skill_progress(uuid) is
  'Solo admin (is_admin): progreso por habilidad (game_state.data->''skills'') y updated_at del niño indicado. Solo lectura (PIT-29).';

-- Solo el rol authenticated puede invocarla; dentro, is_admin() decide.
-- Hay que revocar PUBLIC: el grant implícito de EXECUTE va a PUBLIC, y un
-- revoke solo a anon no lo elimina.
revoke all on function public.admin_get_skill_progress(uuid) from public;
revoke execute on function public.admin_get_skill_progress(uuid) from anon;
grant execute on function public.admin_get_skill_progress(uuid) to authenticated;
