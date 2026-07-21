# Plan de Implementación - Libreta Digital de Préstamos y Fiados

Este plan detalla el diseño e implementación de un sistema de registro de préstamos y fiados a cuotas sin intereses para Roberto. El software funcionará como una libreta digital premium, permitiendo a los comerciantes registrar deudas de clientes, abonos, y llevar un control total de los saldos pendientes.

## Diseño e Interfaz Premium

La aplicación contará con un diseño moderno, intuitivo y estéticamente impactante:
- **Tema Oscuro/Claro Curado**: Panel en tonos pizarra profunda con detalles en verde esmeralda y violeta para denotar transacciones financieras y estados de pago.
- **Modo Demo (Prueba Instantánea)**: Si no se configuran las credenciales de Supabase de inmediato, la aplicación iniciará en un "Modo de Prueba" interactivo utilizando `localStorage`. Esto permite al usuario usar y evaluar la aplicación al instante.
- **Acceso a Configuración de Supabase**: Pantalla dedicada para introducir la URL y la Anon Key de Supabase que se guardarán en `localStorage`, facilitando la conexión sin tocar código.
- **Pantalla de Estadísticas**: Resumen de Saldo Ocupado (Fiado), Cobrado, Deudores Activos e Historial de transacciones con visualizaciones.

---

## Estructura de Datos (Supabase / LocalStorage)

### 1. Clientes (`clientes`)
- `id` (UUID, Primary Key)
- `nombre` (Texto, Requerido)
- `cedula` (Texto, Único/Opcional para identificar al cliente)
- `telefono` (Texto, Opcional)
- `created_at` (Fecha de registro)

### 2. Préstamos / Fiados (`prestamos`)
- `id` (UUID, Primary Key)
- `cliente_id` (UUID, Foreign Key)
- `producto` (Texto, Detalle del producto prestado)
- `precio_total` (Numérico, Monto total del fiado)
- `fecha_prestamo` (Fecha y Hora, por defecto la actual)
- `estado` (Texto: `'pendiente'` o `'pagado'`)
- `dias_pago_sugeridos` (Texto, e.g., "Sábados", "Quincenal" - Opcional)
- `notas` (Texto, Opcional)

### 3. Abonos (`abonos`)
- `id` (UUID, Primary Key)
- `prestamo_id` (UUID, Foreign Key)
- `monto` (Numérico, Valor del abono)
- `fecha_abono` (Fecha y Hora, por defecto la actual)
- `notas` (Texto, Opcional)

---

## Cambios Propuestos

### Componente Frontend (React + Vite + Tailwind v3)

#### [NEW] [database_schema.sql](file:///c:/Users/DT/Desktop/soft%20robert/Backend/database_schema.sql)
Código SQL para crear las tablas, índices y habilitar RLS (Row Level Security) o políticas de acceso rápido en Supabase.

#### [NEW] [Vite Initializer]
Crearemos el proyecto en la carpeta `Frontend` mediante Vite.

#### [NEW] [tailwind.config.js](file:///c:/Users/DT/Desktop/soft%20robert/Frontend/tailwind.config.js)
Configuración de Tailwind CSS v3 para la carga de componentes y colores.

#### [NEW] [src/supabaseClient.js](file:///c:/Users/DT/Desktop/soft%20robert/Frontend/src/supabaseClient.js)
Cliente de Supabase dinámico que lee de variables de entorno (`.env`) o de la configuración del usuario en `localStorage`.

#### [NEW] [src/context/AppContext.jsx](file:///c:/Users/DT/Desktop/soft%20robert/Frontend/src/context/AppContext.jsx)
Estado global de la aplicación (clientes, deudas, abonos) con soporte híbrido: modo Supabase y modo Demo local.

#### [NEW] [src/components/Dashboard.jsx](file:///c:/Users/DT/Desktop/soft%20robert/Frontend/src/components/Dashboard.jsx)
Vista principal con indicadores (total prestado, total cobrado, deudores activos) y gráfico de barras/actividad de cobros recientes.

#### [NEW] [src/components/ClientesList.jsx](file:///c:/Users/DT/Desktop/soft%20robert/Frontend/src/components/ClientesList.jsx)
Gestión de clientes, búsqueda por nombre o cédula, detalle de historial de préstamos y abonos de cada uno.

#### [NEW] [src/components/PrestamosList.jsx](file:///c:/Users/DT/Desktop/soft%20robert/Frontend/src/components/PrestamosList.jsx)
Listado de deudas activas y pagadas, con filtros rápidos y registro de abonos directos.

#### [NEW] [src/components/SupabaseConfigModal.jsx](file:///c:/Users/DT/Desktop/soft%20robert/Frontend/src/components/SupabaseConfigModal.jsx)
Modal interactivo para conectar la aplicación a un proyecto propio de Supabase de manera sencilla.

#### [NEW] [src/App.jsx](file:///c:/Users/DT/Desktop/soft%20robert/Frontend/src/App.jsx)
Layout principal, barra lateral de navegación y ruteo de pestañas.

---

## Plan de Verificación

### Pruebas Manuales
1. **Inicio en Modo Demo**: Validar que la aplicación inicie con datos de ejemplo ficticios, permitiendo registrar clientes, préstamos y abonos guardándolos en `localStorage`.
2. **Cálculo de Deudas**: Verificar que al realizar un abono parcial, el saldo pendiente disminuya correctamente, y que al completar el total de la deuda, el estado del préstamo cambie automáticamente a "Pagado" (con efecto visual de celebración de confetti).
3. **Conexión a Supabase**: Proporcionar el script SQL, configurar la conexión en la UI y validar la sincronización correcta de los registros en tiempo real en las tablas de Supabase.
