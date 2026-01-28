-- TABLA DE PRODUCTOS COMPARTIDA CON APROBACIÓN POR ADMINISTRADOR
-- Esta tabla permite que todos los usuarios compartan la misma base de ingredientes.

-- 1. Crear la tabla si no existe
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT,
    unit TEXT DEFAULT 'kg',
    price_per_unit NUMERIC DEFAULT 0,
    allergens TEXT[] DEFAULT '{}',
    is_approved BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Habilitar RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICA DE LECTURA (SELECT):
-- - Los administradores ven TODOS los productos.
-- - Los usuarios normales solo ven los APROBADOS o los suyos propios (aunque estén pendientes).
DROP POLICY IF EXISTS "Users can view relevant products" ON public.products;
CREATE POLICY "Users can view relevant products" ON public.products
FOR SELECT USING (
    is_approved = true OR 
    auth.uid() = created_by OR
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 4. POLÍTICA DE INSERCIÓN (INSERT):
-- - Cualquier usuario autenticado puede añadir un producto.
-- - Por defecto is_approved es FALSE (gracias al esquema).
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
CREATE POLICY "Authenticated users can insert products" ON public.products
FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
);

-- 5. POLÍTICA DE ACTUALIZACIÓN (UPDATE):
-- - Solo los administradores pueden actualizar productos (para aprobarlos o corregir precios).
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products" ON public.products
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 6. POLÍTICA DE BORRADO (DELETE):
-- - Solo administradores.
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products" ON public.products
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 7. Habilitar Tiempo Real para que los productos aparezcan al momento
-- Asegúrate de que la tabla está en la publicación de tiempo real
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE products;
  END IF;
END $$;
