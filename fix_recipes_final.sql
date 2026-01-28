-- ===================================================
-- SCRIPT DEFINITIVO: VISIBILIDAD DE RECETAS Y PERMISOS
-- Ejecuta esto en el SQL Editor de Supabase
-- ===================================================

-- 1. ASEGURAR RLS ACTIVO
ALTER TABLE public.store ENABLE ROW LEVEL SECURITY;

-- 2. LIMPIEZA DE POLÍTICAS ANTIGUAS EN 'store'
DROP POLICY IF EXISTS "Anyone can read shared recipes" ON public.store;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.store;
DROP POLICY IF EXISTS "Users can only modify their own data" ON public.store;
DROP POLICY IF EXISTS "Store es legible por todos" ON public.store;
DROP POLICY IF EXISTS "Store es escribible por usuarios autenticados" ON public.store;

-- 3. POLÍTICA DE LECTURA (SELECT):
-- Permitimos leer todas las recetas (personales y compartidas)
-- El filtro de "Público/Privado" lo gestiona la App por seguridad.
-- Importante: Quitamos el ":" para incluir la clave legada 'recipes'
CREATE POLICY "Permitir lectura de todas las recetas" ON public.store
  FOR SELECT 
  TO authenticated 
  USING (key LIKE 'recipes%');

-- 4. POLÍTICA DE ESCRITURA TOTAL (INSERT/UPDATE/DELETE):
-- Un usuario puede gestionar sus propios datos (recipes:ID)
-- El administrador puede gestionar TODO (para mantenimiento)
CREATE POLICY "Gestionar datos propios o administrador" ON public.store
  FOR ALL
  TO authenticated
  USING (
    key LIKE '%:' || auth.uid()::text OR 
    key = 'recipes' OR -- Permitir acceso a la clave legada
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

-- 5. RE-HABILITAR REALTIME PARA ASEGURAR
-- (Por si se desactivó al borrar políticas)
ALTER TABLE public.store REPLICA IDENTITY FULL;

-- VERIFICACIÓN:
-- Tras ejecutar esto, las recetas antiguas deberían reaparecer 
-- y deberías poder guardar cambios sin errores.
