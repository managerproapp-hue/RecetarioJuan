-- ===================================================================
-- VER RECETAS PÚBLICAS
-- Este script muestra todas las recetas públicas en la base de datos
-- ===================================================================

-- Ver todas las recetas con su estado de privacidad
SELECT 
  key,
  jsonb_array_length(value) as total_recetas,
  (
    SELECT COUNT(*)
    FROM jsonb_array_elements(value) AS recipe
    WHERE (recipe->>'isPublic')::boolean = true
  ) as recetas_publicas,
  (
    SELECT COUNT(*)
    FROM jsonb_array_elements(value) AS recipe
    WHERE (recipe->>'isPublic')::boolean = false OR recipe->>'isPublic' IS NULL
  ) as recetas_privadas
FROM public.store 
WHERE key LIKE 'recipes%'
ORDER BY key;

-- ===================================================================
-- INTERPRETACIÓN
-- ===================================================================
-- 
-- Deberías ver una fila por cada usuario que tiene recetas.
-- 
-- Si "recetas_publicas" es 0 para todos los usuarios:
--   → No hay recetas marcadas como públicas
--   → Por eso no aparecen en "Explorador Comunidad"
-- 
-- Si "total_recetas" es > 0 pero no ves las recetas en la app:
--   → El problema está en el código del frontend
--   → Necesitamos revisar la consola del navegador
-- ===================================================================
