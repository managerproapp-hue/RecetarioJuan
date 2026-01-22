-- ===================================================================
-- VERIFICAR RECETAS EN LA BASE DE DATOS
-- Ejecuta cada query por separado
-- ===================================================================

-- QUERY 1: Ver todas las entradas de recetas
SELECT 
  key,
  jsonb_array_length(value) as cantidad_recetas,
  created_at,
  updated_at
FROM public.store 
WHERE key LIKE 'recipes%'
ORDER BY key;

-- QUERY 2: Ver perfiles de usuarios
SELECT 
  id,
  email,
  role,
  is_approved
FROM public.profiles
ORDER BY created_at;

-- QUERY 3: Verificar que RLS está habilitado
SELECT 
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE tablename IN ('store', 'profiles', 'products')
ORDER BY tablename;
