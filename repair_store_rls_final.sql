-- ===================================================================
-- LIMPIEZA TOTAL Y REPARACIÓN DE POLÍTICAS RLS (TABLA STORE)
-- Este script borra ABSOLUTAMENTE TODAS las políticas previas
-- para evitar conflictos y errores 406 / Timeouts.
-- ===================================================================

-- 1. Deshabilitar RLS temporalmente para limpiar todo con seguridad
ALTER TABLE public.store DISABLE ROW LEVEL SECURITY;

-- 2. Borrar TODAS las políticas conocidas y las que aparecieron en la captura
DROP POLICY IF EXISTS "store_select_policy" ON public.store;
DROP POLICY IF EXISTS "store_select_own" ON public.store;
DROP POLICY IF EXISTS "store_select_recipes" ON public.store;
DROP POLICY IF EXISTS "store_select_global" ON public.store;
DROP POLICY IF EXISTS "store_select_admin" ON public.store;
DROP POLICY IF EXISTS "RLS_ALL_RECIPES" ON public.store;
DROP POLICY IF EXISTS "RLS_SELECT_RECIPES" ON public.store;
DROP POLICY IF EXISTS "Permitir todo a usuarios con la clave anon" ON public.store;
DROP POLICY IF EXISTS "store_delete_policy" ON public.store;
DROP POLICY IF EXISTS "store_insert_policy" ON public.store;
DROP POLICY IF EXISTS "store_update_policy" ON public.store;
-- Otras posibles nombres detectados en versiones previas
DROP POLICY IF EXISTS "Everyone can read store recipes" ON public.store;
DROP POLICY IF EXISTS "Users can read public items" ON public.store;
DROP POLICY IF EXISTS "Public recipes are readable by all" ON public.store;

-- 3. Volver a habilitar RLS
ALTER TABLE public.store ENABLE ROW LEVEL SECURITY;

-- 4. Re-crear solo las políticas OPTIMIZADAS y NECESARIAS

-- LECTURA (SELECT)
-- A: Datos propios (basados en ID de usuario)
CREATE POLICY "store_select_own" ON public.store
  FOR SELECT TO authenticated
  USING (key LIKE '%:' || auth.uid()::text);

-- B: Comunidad (todas las recetas)
-- NOTA: El filtrado de isPublic lo hace la aplicación
CREATE POLICY "store_select_community" ON public.store
  FOR SELECT TO authenticated
  USING (key LIKE 'recipes%');

-- C: Claves globales
CREATE POLICY "store_select_global" ON public.store
  FOR SELECT TO authenticated
  USING (key IN ('recipes', 'app_settings', 'appSettings', 'productDatabase'));

-- D: Administradores
CREATE POLICY "store_select_admin" ON public.store
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- INSERCIÓN / ACTUALIZACIÓN / BORRADO (Mantener simplicidad)
CREATE POLICY "store_write_policy" ON public.store
  FOR ALL TO authenticated
  USING (
    key LIKE '%:' || auth.uid()::text OR
    key = 'recipes' OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    key LIKE '%:' || auth.uid()::text OR
    key = 'recipes' OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. Mantenimiento
ANALYZE public.store;

-- MENSAJE FINAL:
SELECT 'Reparación completada. Por favor, refresca la página (F5).' as status;
