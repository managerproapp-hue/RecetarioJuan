-- ===================================================================
-- SCRIPT DE REPARACIÓN TOTAL Y MIGRACIÓN (v3.1)
-- Ejecuta este script UNA SOLA VEZ para arreglar todo.
-- ===================================================================

-- 1. Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Limpiar y Re-crear la tabla con el formato correcto (ID como Texto)
DROP TABLE IF EXISTS public.recipes CASCADE;

CREATE TABLE public.recipes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT[] DEFAULT '{}',
    photo TEXT,
    creator TEXT,
    is_public BOOLEAN DEFAULT false,
    owner_id UUID REFERENCES auth.users(id),
    total_cost NUMERIC DEFAULT 0,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    all_content JSONB
);

-- 3. Habilitar RLS
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Seguridad (SELECT para todos los autenticados para evitar bloqueos)
CREATE POLICY "recipes_select_v3" ON public.recipes
FOR SELECT USING (
    owner_id = auth.uid() OR
    is_public = true OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "recipes_write_v3" ON public.recipes
FOR ALL TO authenticated 
USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 5. MIGRACIÓN DE DATOS (JSON -> FILAS INDIVIDUALES)
DO $$ 
DECLARE 
    store_row RECORD;
    recipe_item JSONB;
    user_id UUID;
    migrated_count INTEGER := 0;
BEGIN
    FOR store_row IN SELECT key, value FROM public.store WHERE key LIKE 'recipes%' LOOP
        
        IF store_row.key LIKE 'recipes:%' THEN
            user_id := split_part(store_row.key, ':', 2)::UUID;
        ELSE
            user_id := NULL;
        END IF;

        IF jsonb_typeof(store_row.value) = 'array' THEN
            FOR recipe_item IN SELECT jsonb_array_elements(store_row.value) LOOP
                INSERT INTO public.recipes (
                    id, name, category, photo, creator, is_public, owner_id, total_cost, last_modified, all_content
                ) VALUES (
                    (recipe_item->>'id'),
                    COALESCE(recipe_item->>'name', 'Receta sin nombre'),
                    CASE 
                        WHEN jsonb_typeof(recipe_item->'category') = 'array' 
                        THEN COALESCE(ARRAY(SELECT jsonb_array_elements_text(recipe_item->'category')), '{}')
                        WHEN jsonb_typeof(recipe_item->'category') = 'string'
                        THEN ARRAY[recipe_item->>'category']
                        ELSE '{}'
                    END,
                    recipe_item->>'photo',
                    recipe_item->>'creator',
                    COALESCE((recipe_item->>'isPublic')::BOOLEAN, false),
                    user_id,
                    COALESCE((recipe_item->>'totalCost')::NUMERIC, 0),
                    COALESCE((recipe_item->>'lastModified')::BIGINT / 1000 * interval '1 second' + '1970-01-01'::timestamp, now()),
                    recipe_item
                )
                ON CONFLICT (id) DO NOTHING;
                migrated_count := migrated_count + 1;
            END LOOP;
        END IF;
    END LOOP;
    RAISE NOTICE 'Migración completada: % recetas procesadas.', migrated_count;
END $$;

-- 6. Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_recipes_owner_last ON public.recipes(owner_id, last_accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_is_public ON public.recipes(is_public) WHERE is_public = true;

-- 7. Verificar
SELECT COUNT(*) as total_recetas_en_base_de_datos FROM public.recipes;
