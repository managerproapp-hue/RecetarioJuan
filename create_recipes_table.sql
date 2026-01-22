-- ===================================================================
-- CREACIÓN DE TABLA DE RECETAS INDIVIDUALES (v3)
-- Esta tabla permite carga parcial, búsqueda y escalabilidad.
-- ===================================================================

-- 0. Habilitar extensión para búsquedas rápidas (Trigram)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Crear la tabla si no existe
CREATE TABLE IF NOT EXISTS public.recipes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT[] DEFAULT '{}',
    photo TEXT,
    creator TEXT,
    is_public BOOLEAN DEFAULT false,
    owner_id UUID REFERENCES auth.users(id),
    total_cost NUMERIC DEFAULT 0,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(), -- For the "Memoria Inteligente" feature
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    all_content JSONB -- Aquí guardamos el objeto Recipe completo
);

-- 2. Habilitar RLS
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Seguridad (RLS)

-- LECTURA: Usuario ve sus propias recetas + las públicas + si es admin
DROP POLICY IF EXISTS "recipes_select" ON public.recipes;
CREATE POLICY "recipes_select" ON public.recipes
FOR SELECT USING (
    owner_id = auth.uid() OR
    is_public = true OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ESCRITURA: Usuario gestiona sus propias recetas + si es admin
DROP POLICY IF EXISTS "recipes_all_manage" ON public.recipes;
CREATE POLICY "recipes_all_manage" ON public.recipes
FOR ALL USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 4. Índices para velocidad de búsqueda
CREATE INDEX IF NOT EXISTS idx_recipes_owner_id ON public.recipes(owner_id);
CREATE INDEX IF NOT EXISTS idx_recipes_is_public ON public.recipes(is_public);
CREATE INDEX IF NOT EXISTS idx_recipes_name ON public.recipes USING gin (name gin_trgm_ops); -- Requiere pg_trgm
