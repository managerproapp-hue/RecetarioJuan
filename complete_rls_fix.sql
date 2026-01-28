-- ===================================================================
-- COMPLETE RLS FIX FOR RECETARIO JUAN
-- Este script limpia y recrea todas las políticas RLS desde cero
-- Ejecuta esto en el SQL Editor de Supabase
-- ===================================================================

-- ===================================================================
-- PARTE 1: LIMPIEZA COMPLETA DE POLÍTICAS EXISTENTES
-- ===================================================================

-- Eliminar TODAS las políticas existentes en la tabla 'store'
DROP POLICY IF EXISTS "Permitir lectura de todas las recetas" ON public.store;
DROP POLICY IF EXISTS "Gestionar datos propios o administrador" ON public.store;
DROP POLICY IF EXISTS "Lectura avanzada: recetas y ajustes" ON public.store;
DROP POLICY IF EXISTS "Gestión total: propios o admin" ON public.store;
DROP POLICY IF EXISTS "Users can read public items" ON public.store;
DROP POLICY IF EXISTS "Public recipes are readable by all" ON public.store;
DROP POLICY IF EXISTS "Everyone can read store recipes" ON public.store;
DROP POLICY IF EXISTS "Users can manage own data" ON public.store;
DROP POLICY IF EXISTS "Admins can manage all data" ON public.store;

-- Eliminar políticas existentes en 'profiles'
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Eliminar políticas existentes en 'products'
DROP POLICY IF EXISTS "Users can view relevant products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view approved products" ON public.products;
DROP POLICY IF EXISTS "Users can create products" ON public.products;
DROP POLICY IF EXISTS "Users can update own products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;

-- ===================================================================
-- PARTE 2: POLÍTICAS PARA LA TABLA 'store' (RECETAS Y CONFIGURACIÓN)
-- ===================================================================

-- POLÍTICA DE LECTURA (SELECT)
-- Permitir a usuarios autenticados leer:
--   1. Sus propias recetas: recipes:USER_ID
--   2. TODAS las recetas de otros usuarios (para comunidad): recipes:%
--   3. Configuración global: app_settings, appSettings
--   4. Menús guardados propios: savedMenus:USER_ID
--   5. La clave legacy 'recipes' (para migración)
CREATE POLICY "store_select_policy" ON public.store
  FOR SELECT 
  TO authenticated 
  USING (
    -- Permitir leer recetas propias
    key = 'recipes:' || auth.uid()::text OR
    -- Permitir leer TODAS las recetas (filtrado de público/privado se hace en código)
    key LIKE 'recipes:%' OR
    -- Permitir leer la clave legacy
    key = 'recipes' OR
    -- Permitir leer configuración global
    key IN ('app_settings', 'appSettings') OR
    -- Permitir leer menús propios
    key = 'savedMenus:' || auth.uid()::text OR
    -- Permitir leer base de datos de productos legacy
    key = 'productDatabase:' || auth.uid()::text OR
    key = 'productDatabase' OR
    -- Admins pueden leer TODO
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- POLÍTICA DE INSERCIÓN (INSERT)
-- Permitir insertar solo en claves propias o si es admin
CREATE POLICY "store_insert_policy" ON public.store
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Permitir insertar en claves con su propio ID
    key LIKE '%:' || auth.uid()::text OR
    -- Permitir insertar en clave legacy 'recipes' (para migración)
    key = 'recipes' OR
    -- Permitir insertar configuración global si es admin
    (key IN ('app_settings', 'appSettings') AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )) OR
    -- Admins pueden insertar TODO
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- POLÍTICA DE ACTUALIZACIÓN (UPDATE)
-- Permitir actualizar solo datos propios o si es admin
CREATE POLICY "store_update_policy" ON public.store
  FOR UPDATE
  TO authenticated
  USING (
    -- Permitir actualizar claves propias
    key LIKE '%:' || auth.uid()::text OR
    -- Permitir actualizar clave legacy 'recipes' (para migración)
    key = 'recipes' OR
    -- Permitir actualizar configuración global si es admin
    (key IN ('app_settings', 'appSettings') AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )) OR
    -- Admins pueden actualizar TODO
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    -- Mismo check que USING
    key LIKE '%:' || auth.uid()::text OR
    key = 'recipes' OR
    (key IN ('app_settings', 'appSettings') AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )) OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- POLÍTICA DE ELIMINACIÓN (DELETE)
-- Permitir eliminar solo datos propios o si es admin
CREATE POLICY "store_delete_policy" ON public.store
  FOR DELETE
  TO authenticated
  USING (
    -- Permitir eliminar claves propias
    key LIKE '%:' || auth.uid()::text OR
    -- Admins pueden eliminar TODO
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ===================================================================
-- PARTE 3: POLÍTICAS PARA LA TABLA 'profiles'
-- ===================================================================

-- LECTURA: Todos pueden ver todos los perfiles (necesario para saber quién es admin)
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT 
  TO authenticated
  USING (true);

-- INSERCIÓN: Solo el sistema puede crear perfiles (via trigger o código backend)
CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Solo puede insertar su propio perfil
    id = auth.uid() OR
    -- O si es admin
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ACTUALIZACIÓN: Usuarios pueden actualizar su propio perfil, admins pueden actualizar cualquiera
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    -- Puede actualizar su propio perfil
    id = auth.uid() OR
    -- O si es admin o editor (para aprobar usuarios)
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    -- Mismo check
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

-- ELIMINACIÓN: Solo admins pueden eliminar perfiles
CREATE POLICY "profiles_delete_policy" ON public.profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ===================================================================
-- PARTE 4: POLÍTICAS PARA LA TABLA 'products'
-- ===================================================================

-- LECTURA: Usuarios pueden ver productos aprobados, sus propios productos, o todo si son admin
CREATE POLICY "products_select_policy" ON public.products
  FOR SELECT
  TO authenticated
  USING (
    -- Productos aprobados son visibles para todos
    is_approved = true OR
    -- Puede ver sus propios productos
    created_by = auth.uid() OR
    -- Admins pueden ver todo
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- INSERCIÓN: Usuarios autenticados pueden crear productos
CREATE POLICY "products_insert_policy" ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- El created_by debe ser el usuario actual
    created_by = auth.uid() OR
    -- O si es admin puede crear para cualquiera
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ACTUALIZACIÓN: Usuarios pueden actualizar sus propios productos, admins pueden actualizar cualquiera
CREATE POLICY "products_update_policy" ON public.products
  FOR UPDATE
  TO authenticated
  USING (
    -- Puede actualizar sus propios productos
    created_by = auth.uid() OR
    -- Admins pueden actualizar todo
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    -- Mismo check
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ELIMINACIÓN: Usuarios pueden eliminar sus propios productos, admins pueden eliminar cualquiera
CREATE POLICY "products_delete_policy" ON public.products
  FOR DELETE
  TO authenticated
  USING (
    -- Puede eliminar sus propios productos
    created_by = auth.uid() OR
    -- Admins pueden eliminar todo
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ===================================================================
-- PARTE 5: VERIFICACIÓN Y CORRECCIÓN DE DATOS
-- ===================================================================

-- Asegurar que el usuario admin está correctamente configurado
UPDATE public.profiles 
SET 
  role = 'admin', 
  is_approved = true 
WHERE email = 'managerproapp@gmail.com';

-- Verificar que existe el perfil admin (si no, necesitas crearlo manualmente)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'managerproapp@gmail.com') THEN
    RAISE NOTICE 'ADVERTENCIA: No existe un perfil con email managerproapp@gmail.com';
    RAISE NOTICE 'Debes crear este perfil manualmente después de hacer login por primera vez';
  ELSE
    RAISE NOTICE 'Perfil admin verificado correctamente';
  END IF;
END $$;

-- ===================================================================
-- PARTE 6: INFORMACIÓN DE DIAGNÓSTICO
-- ===================================================================

-- Mostrar todas las políticas activas en 'store'
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'store'
ORDER BY policyname;

-- Mostrar resumen de recetas por usuario
SELECT 
  key,
  CASE 
    WHEN key LIKE 'recipes:%' THEN split_part(key, ':', 2)
    ELSE 'legacy'
  END as user_id,
  jsonb_array_length(value) as recipe_count
FROM public.store 
WHERE key LIKE 'recipes%'
ORDER BY key;

-- Mostrar información de perfiles
SELECT 
  id,
  email,
  role,
  is_approved,
  created_at
FROM public.profiles
ORDER BY created_at;

-- ===================================================================
-- FIN DEL SCRIPT
-- ===================================================================

-- INSTRUCCIONES POST-EJECUCIÓN:
-- 1. Verifica que todas las políticas se crearon correctamente
-- 2. Verifica que tu perfil admin está configurado
-- 3. Prueba hacer login y crear una receta
-- 4. Verifica que la receta aparece en "Mis Recetas"
-- 5. Marca la receta como pública y verifica que aparece en "Comunidad"
