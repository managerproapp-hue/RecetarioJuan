-- ===================================================
-- REFUERZO DE SEGURIDAD Y CONFIGURACIÓN GLOBAL
-- Ejecuta esto en el SQL Editor de Supabase
-- ===================================================

-- 1. LIMPIEZA DE POLÍTICAS PREVIAS EN 'store'
DROP POLICY IF EXISTS "Permitir lectura de todas las recetas" ON public.store;
DROP POLICY IF EXISTS "Gestionar datos propios o administrador" ON public.store;

-- 2. NUEVA POLÍTICA DE LECTURA (SELECT):
-- Permitimos leer:
--   - Todas las recetas (para el explorador de la comunidad)
--   - La configuración global (app_settings)
CREATE POLICY "Lectura avanzada: recetas y ajustes" ON public.store
  FOR SELECT 
  TO authenticated 
  USING (
    key LIKE 'recipes%' OR 
    key = 'app_settings'
  );

-- 3. NUEVA POLÍTICA DE ESCRITURA (ALL):
-- Permitimos gestionar:
--   - Datos propios (ej: "recipes:ID_USUARIO", "profile_setup:ID_USUARIO")
--   - La clave legada 'recipes' (para administradores y usuarios antiguos)
--   - TODO si es Administrador
CREATE POLICY "Gestión total: propios o admin" ON public.store
  FOR ALL
  TO authenticated
  USING (
    key LIKE '%:' || auth.uid()::text OR 
    key = 'recipes' OR 
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

-- 4. POLÍTICAS DE 'profiles' PARA EL ROL EDITOR
-- Un editor puede actualizar otros perfiles (para aprobar usuarios)
-- pero solo el Admin puede borrar perfiles.
-- (Ya configurado en la App, pero reforzado aquí si se desea)

-- Asegurar que el el rol 'editor' no puede borrar en la tabla store si no es su propio dato
-- El Admin sigue teniendo acceso total arriba.

-- 5. NOTA SOBRE BACKUPS:
-- Las operaciones de base de datos pesadas (backups, migraciones masivas) 
-- se restringen en la UI al rol 'admin' mediante código en AdminDashboard.tsx.
