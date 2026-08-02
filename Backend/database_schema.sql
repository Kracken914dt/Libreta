-- Script de creación de tablas para la libreta de préstamos y fiados

-- 1. Tabla de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    cedula TEXT,
    telefono TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear índice para búsquedas rápidas por nombre o cédula
CREATE INDEX IF NOT EXISTS clientes_nombre_idx ON clientes (nombre);
CREATE INDEX IF NOT EXISTS clientes_cedula_idx ON clientes (cedula);

-- 2. Tabla de Préstamos / Fiados
CREATE TABLE IF NOT EXISTS prestamos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    producto TEXT NOT NULL,
    precio_total NUMERIC NOT NULL CHECK (precio_total >= 0),
    fecha_prestamo TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'devuelto')),
    dias_pago_sugeridos TEXT,
    notas TEXT,
    productos_fiados JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear índices para búsquedas y filtros
CREATE INDEX IF NOT EXISTS prestamos_cliente_id_idx ON prestamos (cliente_id);
CREATE INDEX IF NOT EXISTS prestamos_estado_idx ON prestamos (estado);

-- 3. Tabla de Abonos
CREATE TABLE IF NOT EXISTS abonos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prestamo_id UUID REFERENCES prestamos(id) ON DELETE CASCADE,
    monto NUMERIC NOT NULL CHECK (monto > 0),
    fecha_abono TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear índice para abonos
CREATE INDEX IF NOT EXISTS abonos_prestamo_id_idx ON abonos (prestamo_id);


-- =========================================================================
-- TRIGGER PARA ACTUALIZAR AUTOMÁTICAMENTE EL ESTADO DEL PRÉSTAMO
-- =========================================================================

-- Función que calcula el total abonado y actualiza el estado del préstamo
CREATE OR REPLACE FUNCTION recalcular_estado_prestamo()
RETURNS TRIGGER AS $$
DECLARE
    v_prestamo_id UUID;
    v_precio_total NUMERIC;
    v_total_abonado NUMERIC;
    v_estado TEXT;
BEGIN
    -- Obtener el prestamo_id según la operación (INSERT, UPDATE o DELETE)
    IF TG_OP = 'DELETE' THEN
        v_prestamo_id := OLD.prestamo_id;
    ELSE
        v_prestamo_id := NEW.prestamo_id;
    END IF;

    -- Si el préstamo está devuelto, no recalcular su estado
    SELECT estado INTO v_estado FROM prestamos WHERE id = v_prestamo_id;
    IF v_estado = 'devuelto' THEN
        RETURN NULL;
    END IF;

    -- Obtener el precio total del préstamo
    SELECT precio_total INTO v_precio_total FROM prestamos WHERE id = v_prestamo_id;

    -- Calcular la suma de todos los abonos para este préstamo
    SELECT COALESCE(SUM(monto), 0) INTO v_total_abonado FROM abonos WHERE prestamo_id = v_prestamo_id;

    -- Si el total abonado es mayor o igual al precio total, marcar como 'pagado', de lo contrario 'pendiente'
    IF v_total_abonado >= v_precio_total THEN
        UPDATE prestamos SET estado = 'pagado' WHERE id = v_prestamo_id;
    ELSE
        UPDATE prestamos SET estado = 'pendiente' WHERE id = v_prestamo_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger que se activa al insertar, actualizar o borrar abonos
DROP TRIGGER IF EXISTS trigger_recalcular_estado_prestamo ON abonos;
CREATE TRIGGER trigger_recalcular_estado_prestamo
AFTER INSERT OR UPDATE OR DELETE ON abonos
FOR EACH ROW
EXECUTE FUNCTION recalcular_estado_prestamo();


-- =========================================================================
-- TABLAS DE INVENTARIO: CATEGORÍAS Y PRODUCTOS
-- =========================================================================

-- 4. Tabla de Categorías de Productos
CREATE TABLE IF NOT EXISTS categorias_productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    color TEXT DEFAULT '#8b5cf6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS categorias_nombre_idx ON categorias_productos (nombre);

-- 5. Tabla de Productos
CREATE TABLE IF NOT EXISTS productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio NUMERIC NOT NULL CHECK (precio >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    imagen_url TEXT,
    categoria_id UUID REFERENCES categorias_productos(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS productos_nombre_idx ON productos (nombre);
CREATE INDEX IF NOT EXISTS productos_categoria_id_idx ON productos (categoria_id);









-- ==========================================================
-- TABLA USUARIOS
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT,
    email TEXT UNIQUE,
    foto TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================================
-- AGREGAR usuario_id A TODAS LAS TABLAS
-- ==========================================================

ALTER TABLE productos
ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE;

ALTER TABLE categorias_productos
ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE;

ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE;

ALTER TABLE prestamos
ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE;

ALTER TABLE abonos
ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE;

-- ==========================================================
-- DEFAULT auth.uid()
-- El frontend NO debe enviar usuario_id
-- ==========================================================

ALTER TABLE productos
ALTER COLUMN usuario_id SET DEFAULT auth.uid();

ALTER TABLE categorias_productos
ALTER COLUMN usuario_id SET DEFAULT auth.uid();

ALTER TABLE clientes
ALTER COLUMN usuario_id SET DEFAULT auth.uid();

ALTER TABLE prestamos
ALTER COLUMN usuario_id SET DEFAULT auth.uid();

ALTER TABLE abonos
ALTER COLUMN usuario_id SET DEFAULT auth.uid();

-- ==========================================================
-- usuario_id obligatorio
-- ==========================================================

ALTER TABLE productos
ALTER COLUMN usuario_id SET NOT NULL;

ALTER TABLE categorias_productos
ALTER COLUMN usuario_id SET NOT NULL;

ALTER TABLE clientes
ALTER COLUMN usuario_id SET NOT NULL;

ALTER TABLE prestamos
ALTER COLUMN usuario_id SET NOT NULL;

ALTER TABLE abonos
ALTER COLUMN usuario_id SET NOT NULL;

-- ==========================================================
-- HABILITAR RLS
-- ==========================================================

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestamos ENABLE ROW LEVEL SECURITY;
ALTER TABLE abonos ENABLE ROW LEVEL SECURITY;

-- ==========================================================
-- ELIMINAR POLÍTICAS SI EXISTEN
-- ==========================================================

DROP POLICY IF EXISTS usuarios_policy ON usuarios;
DROP POLICY IF EXISTS productos_policy ON productos;
DROP POLICY IF EXISTS categorias_policy ON categorias_productos;
DROP POLICY IF EXISTS clientes_policy ON clientes;
DROP POLICY IF EXISTS prestamos_policy ON prestamos;
DROP POLICY IF EXISTS abonos_policy ON abonos;

-- ==========================================================
-- TABLA USUARIOS
-- ==========================================================

CREATE POLICY usuarios_policy
ON usuarios
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ==========================================================
-- PRODUCTOS
-- ==========================================================

CREATE POLICY productos_policy
ON productos
FOR ALL
TO authenticated
USING (usuario_id = auth.uid())
WITH CHECK (usuario_id = auth.uid());

-- ==========================================================
-- CATEGORIAS
-- ==========================================================

CREATE POLICY categorias_policy
ON categorias_productos
FOR ALL
TO authenticated
USING (usuario_id = auth.uid())
WITH CHECK (usuario_id = auth.uid());

-- ==========================================================
-- CLIENTES
-- ==========================================================

CREATE POLICY clientes_policy
ON clientes
FOR ALL
TO authenticated
USING (usuario_id = auth.uid())
WITH CHECK (usuario_id = auth.uid());

-- ==========================================================
-- PRESTAMOS
-- ==========================================================

CREATE POLICY prestamos_policy
ON prestamos
FOR ALL
TO authenticated
USING (usuario_id = auth.uid())
WITH CHECK (usuario_id = auth.uid());

-- ==========================================================
-- ABONOS
-- ==========================================================

CREATE POLICY abonos_policy
ON abonos
FOR ALL
TO authenticated
USING (usuario_id = auth.uid())
WITH CHECK (usuario_id = auth.uid());

-- ==========================================================
-- CREAR AUTOMÁTICAMENTE EL USUARIO
-- ==========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN

INSERT INTO public.usuarios(
    id,
    nombre,
    email,
    foto
)
VALUES(
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name',''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url','')
);

RETURN NEW;

END;
$$
LANGUAGE plpgsql
SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- productos-joyeria: jewelry columns + categories seed trigger
-- ============================================================

ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS peso_gramos NUMERIC(10,3) CHECK (peso_gramos IS NULL OR peso_gramos >= 0),
  ADD COLUMN IF NOT EXISTS largo NUMERIC(10,2) CHECK (largo IS NULL OR largo >= 0),
  ADD COLUMN IF NOT EXISTS costo_por_gramo NUMERIC(12,2) CHECK (costo_por_gramo IS NULL OR costo_por_gramo >= 0),
  ADD COLUMN IF NOT EXISTS precio_por_gramo NUMERIC(12,2) CHECK (precio_por_gramo IS NULL OR precio_por_gramo >= 0),
  ADD COLUMN IF NOT EXISTS ganancia_estimada NUMERIC(12,2) CHECK (ganancia_estimada IS NULL OR ganancia_estimada >= 0);

CREATE UNIQUE INDEX IF NOT EXISTS uq_categorias_productos_usuario_nombre
  ON categorias_productos (usuario_id, lower(nombre));

CREATE OR REPLACE FUNCTION handle_new_user_categories()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.categorias_productos (nombre, color, usuario_id) VALUES
    ('Oro',    '#FFD700', NEW.id),
    ('Plata',  '#C0C0C0', NEW.id),
    ('Bronce', '#CD7F32', NEW.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created_categories ON auth.users;
CREATE TRIGGER on_auth_user_created_categories
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_categories();


  -- Agregar columnas de joyería a la tabla de productos si no existen
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS peso_gramos NUMERIC(10,3) CHECK (peso_gramos IS NULL OR peso_gramos >= 0),
  ADD COLUMN IF NOT EXISTS largo NUMERIC(10,2) CHECK (largo IS NULL OR largo >= 0),
  ADD COLUMN IF NOT EXISTS costo_por_gramo NUMERIC(12,2) CHECK (costo_por_gramo IS NULL OR costo_por_gramo >= 0),
  ADD COLUMN IF NOT EXISTS precio_por_gramo NUMERIC(12,2) CHECK (precio_por_gramo IS NULL OR precio_por_gramo >= 0),
  ADD COLUMN IF NOT EXISTS ganancia_estimada NUMERIC(12,2) CHECK (ganancia_estimada IS NULL OR ganancia_estimada >= 0);

-- Recargar la caché de esquema de PostgREST
NOTIFY pgrst, 'reload schema';
