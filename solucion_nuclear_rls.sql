-- ===================================================================
-- SOLUCIÓN FINAL: MÁXIMO RENDIMIENTO (OPCIÓN NUCLEAR v2)
-- Optimizada para Account A (53 recetas) evitando Timeouts.
-- ===================================================================

-- 1. Limpiar TODA restricción previa
ALTER TABLE public.store DISABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'store' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.store', pol.policyname);
    END LOOP;
END $$;

-- 2. Habilitar RLS de nuevo
ALTER TABLE public.store ENABLE ROW LEVEL SECURITY;

-- 3. ÚNICA política de lectura para TODOS (Instantánea)
-- Al no tener condiciones complejas, Postgres no tarda nada en procesarla.
CREATE POLICY "allow_read_all" ON public.store 
FOR SELECT USING (true);

-- 4. ÚNICA política de escritura (Segura y simple)
CREATE POLICY "allow_write_authenticated" ON public.store 
FOR ALL TO authenticated 
USING (
  key LIKE 'recipes:%' OR 
  key LIKE 'appSettings:%' OR
  key LIKE 'savedMenus:%' OR
  key LIKE 'productDatabase:%' OR
  key = 'recipes' OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (true);

-- 5. Mantenimiento profundo
VACUUM ANALYZE public.store;

-- 6. Mensaje final
SELECT 'Reparación de Base de Datos completada.' as resultado;
