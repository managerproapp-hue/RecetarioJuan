-- ===================================================================
-- OPTIMIZACIÓN DE RENDIMIENTO: POLÍTICAS RLS SIMPLIFICADAS
-- Este script desglosa la política compleja en varias más simples
-- para que Postgres las procese más rápido y evitar timeouts (error 57014).
-- ===================================================================

-- 1. Limpiar política anterior
DROP POLICY IF EXISTS "store_select_policy" ON public.store;
DROP POLICY IF EXISTS "store_select_own" ON public.store;
DROP POLICY IF EXISTS "store_select_recipes" ON public.store;
DROP POLICY IF EXISTS "store_select_global" ON public.store;
DROP POLICY IF EXISTS "store_select_admin" ON public.store;

-- 2. Crear políticas desglosadas (Postgres las combina con OR)

-- POLÍTICA A: Datos propios (Identificados por el sufijo del ID de usuario)
-- Esto permite leer 'recipes:USER_ID', 'appSettings:USER_ID', etc.
CREATE POLICY "store_select_own" ON public.store
  FOR SELECT TO authenticated
  USING (key LIKE '%:' || auth.uid()::text);

-- POLÍTICA B: Recetas de comunidad
-- Permite que todos lean cualquier clave que empiece por 'recipes'
CREATE POLICY "store_select_recipes" ON public.store
  FOR SELECT TO authenticated
  USING (key LIKE 'recipes%');

-- POLÍTICA C: Claves globales legacy o compartidas
CREATE POLICY "store_select_global" ON public.store
  FOR SELECT TO authenticated
  USING (key IN ('recipes', 'app_settings', 'appSettings', 'productDatabase'));

-- POLÍTICA D: Administradores (Acceso total)
CREATE POLICY "store_select_admin" ON public.store
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 3. Verificar que se han creado correctamente
SELECT policyname, tablename, cmd FROM pg_policies WHERE tablename = 'store';

-- 4. Ejecutar mantenimiento básico (Analizar la tabla para optimizar el planificador)
ANALYZE public.store;
ANALYZE public.profiles;
