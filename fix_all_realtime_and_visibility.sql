-- ==========================================
-- SCRIPT DE CONSOLIDACIÓN: REALTIME Y VISIBILIDAD
-- Ejecuta esto en el SQL Editor de Supabase
-- ==========================================

-- 1. ASEGURAR QUE LAS TABLAS ESTÁN EN LA PUBLICACIÓN DE TIEMPO REAL
DO $$
BEGIN
  -- Habilitar para 'profiles'
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'profiles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
  END IF;
  
  -- Habilitar para 'products'
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'products') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE products;
  END IF;

  -- Habilitar para 'store' (recetas publicas)
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'store') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE store;
  END IF;
END $$;

-- 2. CONFIGURAR REPLICA IDENTITY FULL (Necesario para filtros complejos en Realtime)
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.store REPLICA IDENTITY FULL;

-- 3. POLÍTICAS RLS PARA 'profiles'
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

-- 4. POLÍTICAS RLS PARA 'products'
DROP POLICY IF EXISTS "Users can view relevant products" ON public.products;
CREATE POLICY "Users can view relevant products" ON public.products
FOR SELECT USING (
    is_approved = true OR 
    auth.uid() = created_by OR
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 5. POLÍTICAS RLS PARA 'store' (RECETAS COMPARTIDAS)
-- Permite que cualquiera lea las recetas, el filtrado de 'isPublic' se hace en la APP
DROP POLICY IF EXISTS "Anyone can read shared recipes" ON public.store;
CREATE POLICY "Anyone can read shared recipes" ON public.store
  FOR SELECT USING (key LIKE 'recipes:%');

-- 6. PERMISOS PARA LOS ADMINISTRADORES (Asegurar que el admin tiene rol correcto)
-- Cambia 'managerproapp@gmail.com' si usas otro email principal
UPDATE public.profiles 
SET role = 'admin', is_approved = true 
WHERE email = 'managerproapp@gmail.com';
