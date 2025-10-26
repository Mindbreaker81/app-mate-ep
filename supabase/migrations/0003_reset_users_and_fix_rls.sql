-- Script para limpiar usuarios y arreglar RLS
-- IMPORTANTE: Esto borrará TODOS los usuarios y sus datos

-- Paso 1: Borrar todos los attempts (para evitar foreign key constraint)
DELETE FROM public.attempts;

-- Paso 2: Borrar todos los profiles
DELETE FROM public.profiles;

-- Paso 3: Borrar usuarios de auth (CASCADE borrará automáticamente profiles/attempts)
-- NOTA: Solo admin/postgres puede hacer esto, no se puede hacer desde la app
-- Este DELETE debe ejecutarse directamente en Supabase Dashboard como postgres
-- DELETE FROM auth.users;

-- Paso 4: Re-habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Paso 5: Recrear políticas RLS más permisivas para evitar problemas
DROP POLICY IF EXISTS "profiles select own" ON public.profiles;
DROP POLICY IF EXISTS "profiles upsert own" ON public.profiles;
DROP POLICY IF EXISTS "profiles insert own" ON public.profiles;
DROP POLICY IF EXISTS "profiles update own" ON public.profiles;

-- Permitir SELECT de tu propio perfil
CREATE POLICY "profiles select own" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Permitir INSERT de tu propio perfil
CREATE POLICY "profiles insert own" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Permitir UPDATE de tu propio perfil
CREATE POLICY "profiles update own" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Verificar políticas
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
