-- ===================================================
-- SCRIPT DE LIMPIEZA: ELIMINAR INGREDIENTES DUPLICADOS
-- Ejecuta esto en el SQL Editor de Supabase
-- ===================================================

-- Este script busca productos con el mismo nombre y elimina todos 
-- excepto uno (el que tenga el ID más antiguo).

DELETE FROM public.products
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY name 
                   ORDER BY created_at ASC
               ) as row_num
        FROM public.products
    ) t
    WHERE t.row_num > 1
);

-- Verificación: Tras ejecutarlo, el contador de ingredientes 
-- debería bajar a la cantidad real de productos únicos.
