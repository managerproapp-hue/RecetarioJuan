-- ===================================================================
-- SCRIPT DE VERIFICACIÓN SIMPLIFICADO
-- Ejecuta cada sección por separado en Supabase SQL Editor
-- ===================================================================

-- SECCIÓN 1: Ver políticas RLS en tabla 'store'
-- Copia y ejecuta solo estas líneas:
SELECT 
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'store'
ORDER BY cmd, policyname;

-- Deberías ver 4 políticas: store_select_policy, store_insert_policy, store_update_policy, store_delete_policy
