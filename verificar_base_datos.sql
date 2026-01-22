-- ===================================================================
-- VERIFICACIÓN SIMPLE - SIN ERRORES
-- Este script funciona con tu base de datos actual
-- ===================================================================

-- 1. VER POLÍTICAS RLS EN 'store'
SELECT 
  policyname,
  cmd as operacion
FROM pg_policies 
WHERE tablename = 'store'
ORDER BY cmd, policyname;

-- 2. VER TUS RECETAS
SELECT 
  key as clave,
  jsonb_array_length(value) as cantidad_recetas
FROM public.store 
WHERE key LIKE 'recipes%'
ORDER BY key;

-- 3. VER USUARIOS
SELECT 
  email,
  role as rol,
  is_approved as aprobado
FROM public.profiles
ORDER BY email;

-- 4. VERIFICAR RLS HABILITADO
SELECT 
  tablename as tabla,
  rowsecurity as rls_activo
FROM pg_tables
WHERE tablename IN ('store', 'profiles', 'products')
ORDER BY tablename;

-- ===================================================================
-- INTERPRETACIÓN DE RESULTADOS
-- ===================================================================
-- 
-- Si ves:
-- ✅ Varias políticas en 'store' (al menos store_select_policy, store_insert_policy, etc.)
-- ✅ Tu clave de recetas (recipes:TU_ID) con cantidad > 0
-- ✅ Tu email con aprobado = true
-- ✅ RLS activo = true en todas las tablas
-- 
-- Entonces la base de datos está bien configurada.
-- El problema está en el frontend (código de la aplicación).
-- ===================================================================
