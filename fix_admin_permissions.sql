-- SOLUCIÓN DEFINITIVA PARA PERMISOS DE ADMINISTRADOR
-- Este script permite que los administradores aprueben usuarios y que el cambio sea permanente.

-- 1. Eliminar políticas antiguas que puedan estar estorbando
DROP POLICY IF EXISTS "Perfiles públicos son visibles por todos." ON public.profiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil." ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 2. Política de LECTURA: Todos los usuarios pueden leer los perfiles (necesario para el Panel Maestro)
CREATE POLICY "Enable select for all users" ON public.profiles
  FOR SELECT USING (true);

-- 3. Política de ACTUALIZACIÓN:
-- Los usuarios pueden actualizar su PROPIO perfil.
-- Los administradores pueden actualizar CUALQUIER perfil.
CREATE POLICY "Admins and owners can update profiles" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Asegurar que el Tiempo Real funciona para todos los cambios
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- 5. RE-VERIFICAR: Asegurarse de que el usuario principal es ADMIN
-- Cambia 'managerproapp@gmail.com' por tu email si es otro, pero este es el que aparece en tu captura.
UPDATE public.profiles 
SET role = 'admin', is_approved = true 
WHERE email = 'managerproapp@gmail.com';
