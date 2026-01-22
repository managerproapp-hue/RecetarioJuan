-- ===================================================================
-- SCRIPT DE MIGRACIÓN: JSON BLOQUE -> REGISTROS INDIVIDUALES (v3)
-- Ejecuta este script después de crear la tabla 'recipes'.
-- ===================================================================

DO $$ 
DECLARE 
    store_row RECORD;
    recipe_item JSONB;
    user_id UUID;
BEGIN
    -- 1. Recorrer todas las entradas de recetas en el store
    FOR store_row IN SELECT key, value FROM public.store WHERE key LIKE 'recipes%' LOOP
        
        -- 2. Extraer el owner_id si es una clave 'recipes:UUID'
        IF store_row.key LIKE 'recipes:%' THEN
            user_id := split_part(store_row.key, ':', 2)::UUID;
        ELSE
            user_id := NULL; -- Para la clave legacy 'recipes' sin ID
        END IF;

        -- 3. Si el valor es un array, recorrer cada receta
        IF jsonb_typeof(store_row.value) = 'array' THEN
            FOR recipe_item IN SELECT jsonb_array_elements(store_row.value) LOOP
                
                -- 4. Insertar en la nueva tabla (evitando duplicados por ID si reenviamos)
                INSERT INTO public.recipes (
                    id,
                    name,
                    category,
                    photo,
                    creator,
                    is_public,
                    owner_id,
                    total_cost,
                    last_modified,
                    all_content
                ) VALUES (
                    (recipe_item->>'id'),
                    COALESCE(recipe_item->>'name', 'Receta sin nombre'),
                    COALESCE(ARRAY(SELECT jsonb_array_elements_text(recipe_item->'category')), '{}'),
                    recipe_item->>'photo',
                    recipe_item->>'creator',
                    (recipe_item->>'isPublic')::BOOLEAN,
                    COALESCE(user_id, (recipe_item->>'ownerId')::UUID),
                    COALESCE((recipe_item->>'totalCost')::NUMERIC, 0),
                    COALESCE((recipe_item->>'lastModified')::BIGINT / 1000 * interval '1 second' + '1970-01-01'::timestamp, now()),
                    recipe_item
                )
                ON CONFLICT (id) DO UPDATE SET 
                    all_content = EXCLUDED.all_content,
                    last_modified = EXCLUDED.last_modified;
                    
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- Verificar migración
SELECT COUNT(*) as recetas_migradas FROM public.recipes;
