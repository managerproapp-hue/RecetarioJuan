-- ===================================================================
-- REPARACIÓN VELOZ: SOLUCIÓN AL TIMEOUT Y CARGA DE PRODUCTOS
-- Este script optimiza las reglas para que Supabase las procese
-- instantáneamente y tus 53 recetas carguen sin errores.
-- ===================================================================

-- 1. Limpieza total de políticas en 'store'
ALTER TABLE public.store DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_select_policy" ON public.store;
DROP POLICY IF EXISTS "store_select_own" ON public.store;
DROP POLICY IF EXISTS "store_select_recipes" ON public.store;
DROP POLICY IF EXISTS "store_select_community" ON public.store;
DROP POLICY IF EXISTS "store_select_global" ON public.store;
DROP POLICY IF EXISTS "store_select_admin" ON public.store;
DROP POLICY IF EXISTS "RLS_ALL_RECIPES" ON public.store;
DROP POLICY IF EXISTS "RLS_SELECT_RECIPES" ON public.store;
DROP POLICY IF EXISTS "Permitir todo a usuarios con la clave anon" ON public.store;
DROP POLICY IF EXISTS "store_write_policy" ON public.store;

ALTER TABLE public.store ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS DE LECTURA OPTIMIZADAS (SELECT)
-- Usamos comparaciones directas para que use el índice (PK) y sea instantáneo

-- A. Tus propios datos (Recetas, Ajustes, Menús, Productos)
CREATE POLICY "fast_select_own" ON public.store
  FOR SELECT TO authenticated
  USING (
    key = 'recipes:' || auth.uid()::text OR
    key = 'appSettings:' || auth.uid()::text OR
    key = 'savedMenus:' || auth.uid()::text OR
    key = 'productDatabase:' || auth.uid()::text OR
    key = 'app_settings' OR
    key = 'recipes'
  );

-- B. Comunidad (Recetas de otros)
CREATE POLICY "fast_select_community" ON public.store
  FOR SELECT TO authenticated
  USING (key LIKE 'recipes:%');

-- C. Administradores
CREATE POLICY "fast_select_admin" ON public.store
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 3. POLÍTICA DE ESCRITURA (INSERT/UPDATE/DELETE)
CREATE POLICY "fast_write_own" ON public.store
  FOR ALL TO authenticated
  USING (
    key = 'recipes:' || auth.uid()::text OR
    key = 'appSettings:' || auth.uid()::text OR
    key = 'savedMenus:' || auth.uid()::text OR
    key = 'productDatabase:' || auth.uid()::text OR
    key = 'recipes'
  )
  WITH CHECK (
    key = 'recipes:' || auth.uid()::text OR
    key = 'appSettings:' || auth.uid()::text OR
    key = 'savedMenus:' || auth.uid()::text OR
    key = 'productDatabase:' || auth.uid()::text OR
    key = 'recipes'
  );

-- 4. Administrador total
CREATE POLICY "fast_admin_all" ON public.store
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. Mantenimiento para refrescar los índices
ANALYZE public.store;

-- 6. Verificación (Deberías ver solo las fast_...)
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'store';
