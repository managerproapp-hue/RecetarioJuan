-- ===================================================
-- SCRIPT DE REPARACIÓN TOTAL: TABLA 'STORE' (RECETAS)
-- Ejecuta esto en el SQL Editor de Supabase
-- ===================================================

-- 1. LIMPIEZA DE DUPLICADOS (Usando ctid por si no hay columna ID)
DELETE FROM public.store a USING (
      SELECT MIN(ctid) as keep_id, key
      FROM public.store
      GROUP BY key
      HAVING COUNT(*) > 1
    ) b
    WHERE a.key = b.key
    AND a.ctid <> b.keep_id;

-- 2. ASEGURAR CLAVE PRIMARIA
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'store_pkey' 
        AND contype = 'p'
    ) THEN
        ALTER TABLE public.store ADD PRIMARY KEY (key);
    END IF;
END $$;

-- 3. POLÍTICAS RLS ULTRA-FLEXIBLES
-- Eliminamos todas las posibles políticas restrictivas
DROP POLICY IF EXISTS "Permitir lectura de todas las recetas" ON public.store;
DROP POLICY IF EXISTS "Gestionar datos propios o administrador" ON public.store;
DROP POLICY IF EXISTS "Lectura total recetas" ON public.store;
DROP POLICY IF EXISTS "Escritura total recetas" ON public.store;
DROP POLICY IF EXISTS "Anyone can read shared recipes" ON public.store;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.store;
DROP POLICY IF EXISTS "Users can only modify their own data" ON public.store;

-- Lectura absoluta para todos los autenticados
CREATE POLICY "RLS_SELECT_RECIPES" ON public.store
  FOR SELECT TO authenticated USING (key LIKE 'recipes%');

-- Escritura absoluta para usuarios autenticados (Temporal para migrar)
CREATE POLICY "RLS_ALL_RECIPES" ON public.store
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. VERIFICACIÓN DE RECUENTO
-- SELECT count(*) FROM public.store WHERE key LIKE 'recipes%';
