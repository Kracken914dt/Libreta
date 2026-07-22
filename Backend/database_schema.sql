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
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado')),
    dias_pago_sugeridos TEXT,
    notas TEXT,
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
BEGIN
    -- Obtener el prestamo_id según la operación (INSERT, UPDATE o DELETE)
    IF TG_OP = 'DELETE' THEN
        v_prestamo_id := OLD.prestamo_id;
    ELSE
        v_prestamo_id := NEW.prestamo_id;
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
