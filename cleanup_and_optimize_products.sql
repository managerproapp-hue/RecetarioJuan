-- ===================================================
-- SCRIPT DE LIMPIEZA Y OPTIMIZACIÓN DE INGREDIENTES
-- ===================================================

-- 1. Eliminar duplicados manteniendo solo el más antiguo (basado en created_at)
DELETE FROM public.products
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY LOWER(TRIM(name)) 
                   ORDER BY created_at ASC
               ) as row_num
        FROM public.products
    ) t
    WHERE t.row_num > 1
);

-- 2. Asegurar que no hay espacios en blanco extra en los nombres
UPDATE public.products SET name = TRIM(name);

-- 3. Crear un índice único para prevenir duplicados futuros (insensible a mayúsculas)
-- Primero eliminamos si ya existe por casualidad
DROP INDEX IF EXISTS idx_products_unique_name;
CREATE UNIQUE INDEX idx_products_unique_name ON public.products (LOWER(name));

-- 4. Verificar el nuevo conteo
SELECT COUNT(*) as total_ingredientes_unicos FROM public.products;
