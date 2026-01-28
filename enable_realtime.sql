-- ACTIVA EL TIEMPO REAL PARA LA TABLA DE PERFILES
-- Esto es necesario para que el permiso se sincronice al instante 
-- entre el PC del administrador y el dispositivo del usuario.

-- 1. Añade la tabla profiles a la publicación de tiempo real de Supabase
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
  END IF;
END $$;

-- 2. Asegúrate de que las políticas de RLS permiten la lectura
-- Si ya existe, no hará nada.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

-- 3. Asegúrate de que los usuarios pueden leer su propio ID para el filtro de tiempo real
-- Esto es redundante con el paso 2 pero asegura el funcionamiento.
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
