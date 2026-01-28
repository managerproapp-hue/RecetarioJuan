-- FIX PARA VISIBILIDAD DE CONTENIDO COMPARTIDO
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. PERFILES: Permitir que todos vean los perfiles (necesario para saber quién es admin)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

-- 2. TABLA STORE (RECETAS): Permitir que todos lean las filas de recetas
-- La filtración por 'isPublic' se hace en el código Frontend por ahora.
-- Esto permite que fetchCommunityRecipes() encuentre las recetas de otros.
DROP POLICY IF EXISTS "Users can read public items" ON public.store;
DROP POLICY IF EXISTS "Public recipes are readable by all" ON public.store;
CREATE POLICY "Everyone can read store recipes" ON public.store
  FOR SELECT USING (key LIKE 'recipes:%');

-- 3. PRODUCTOS (INGREDIENTES): Asegurar acceso público a lo aprobado
-- Redefinimos para que sea más robusto
DROP POLICY IF EXISTS "Users can view relevant products" ON public.products;
CREATE POLICY "Anyone can view approved products" ON public.products
  FOR SELECT USING (
    is_approved = true OR 
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. RE-COMPROBACIÓN DE ADMIN
-- Asegúrate de que el usuario administrador está bien configurado
UPDATE public.profiles 
SET role = 'admin', is_approved = true 
WHERE email = 'managerproapp@gmail.com';
