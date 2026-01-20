-- 1. LIMPIEZA: Eliminar políticas anteriores que estén bloqueando el funcionamiento
DROP POLICY IF EXISTS "Store es legible por todos" ON public.store;
DROP POLICY IF EXISTS "Store es escribible por usuarios autenticados" ON public.store;
DROP POLICY IF EXISTS "Store es actualizable por usuarios autenticados" ON public.store;
DROP POLICY IF EXISTS "Users can manage own store items" ON public.store;
DROP POLICY IF EXISTS "Users can read public items" ON public.store;

-- 2. ASEGURAR RLS: Asegurarse de que RLS está activo
ALTER TABLE public.store ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICA DE LECTURA (SELECT):
-- Permitimos que cualquier usuario autenticado lea cualquier fila para que funcione 
-- la sección de "Comunidad" (recetas públicas).
CREATE POLICY "Enable select for authenticated users" ON public.store
  FOR SELECT 
  TO authenticated 
  USING (true);

-- 4. POLÍTICA DE ESCRITURA (INSERT/UPDATE/DELETE):
-- Solo permitimos que un usuario modifique sus propios datos.
-- Como usamos claves del tipo 'recipes:ID_USUARIO', comprobamos que el ID coincida.
CREATE POLICY "Users can only modify their own data" ON public.store
  FOR ALL
  TO authenticated
  USING (key LIKE '%:' || auth.uid()::text)
  WITH CHECK (key LIKE '%:' || auth.uid()::text);

-- NOTA: Si tienes datos antiguos guardados con la clave simple 'recipes', 
-- no se podrán modificar hasta que se migren a 'recipes:ID_USUARIO'.
-- La aplicación ya hace esta migración automáticamente al detectar el LocalStorage.
