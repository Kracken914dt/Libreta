# 📒 La Libreta Digital — Sistema de Gestión de Préstamos, Fiados e Inventario

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss&logoColor=white)

---

## 📋 Descripción General

**La Libreta Digital** es un aplicativo web diseñado para pequeños comerciantes, tenderos y emprendedores que otorgan productos fiados (a crédito) a sus clientes. Reemplaza la tradicional "libreta de apuntes" física por un sistema digital moderno, seguro y accesible desde cualquier dispositivo.

El sistema permite:

- Registrar clientes con datos personales validados.
- Crear préstamos/fiados seleccionando productos del inventario o ingresándolos manualmente.
- Controlar abonos parciales hasta completar el pago total.
- Gestionar un inventario completo de productos con categorías, precios y stock.
- Visualizar un dashboard en tiempo real con métricas de negocio (total fiado, recaudado, clientes activos, valor del inventario).
- Manejar devoluciones con reembolso automático y restauración de stock.
- Consultar un historial contable de recaudo (libro de caja).

---

## 🏗️ Arquitectura del Sistema

El proyecto sigue una arquitectura **Cliente-Servidor desacoplada**:

| Capa | Tecnología | Descripción |
|---|---|---|
| **Frontend (SPA)** | React 19 + Vite 8 | Aplicación de página única (SPA) que se ejecuta en el navegador |
| **Estilos** | TailwindCSS 3 | Framework CSS utility-first para diseño responsivo y tema oscuro/claro |
| **Estado Global** | React Context API | Gestión centralizada del estado de la aplicación |
| **Backend (BaaS)** | Supabase (PostgreSQL) | Backend-as-a-Service con base de datos PostgreSQL, autenticación y Row Level Security |
| **Autenticación** | Supabase Auth | Autenticación por correo electrónico con OTP (Magic Link) |
| **Seguridad** | Row Level Security (RLS) | Aislamiento completo de datos por usuario a nivel de base de datos |

### Flujo de Datos

```
┌──────────────┐     HTTPS/REST      ┌──────────────────┐
│   Navegador  │ ◄──────────────────► │    Supabase      │
│  (React SPA) │                      │  ┌────────────┐  │
│              │   Auth + CRUD        │  │ PostgreSQL │  │
│  App.jsx     │ ──────────────────►  │  │   + RLS    │  │
│  AppContext  │                      │  └────────────┘  │
│  Components  │ ◄──────────────────  │  ┌────────────┐  │
│              │   JSON Responses     │  │  Auth JWT  │  │
└──────────────┘                      │  └────────────┘  │
                                      └──────────────────┘
```

---

## 📂 Estructura de Carpetas y Archivos

```
soft robert/
│
├── Backend/
│   └── database_schema.sql          # Script SQL completo: tablas, triggers, RLS, índices
│
├── docs/                            # Documentación técnica (diagramas PlantUML)
│   ├── caso_de_uso.puml             # Diagrama de casos de uso
│   ├── arquitectura.puml            # Diagrama de arquitectura del sistema
│   ├── req_funcionales.puml         # Requerimientos funcionales
│   └── req_no_funcionales.puml      # Requerimientos no funcionales
│
├── Frontend/
│   ├── .env                         # Variables de entorno (SUPABASE_URL, SUPABASE_ANON_KEY)
│   ├── index.html                   # Punto de entrada HTML
│   ├── package.json                 # Dependencias y scripts npm
│   ├── postcss.config.js            # Configuración de PostCSS
│   ├── tailwind.config.js           # Configuración de TailwindCSS
│   ├── vite.config.js               # Configuración de Vite
│   │
│   ├── public/                      # Archivos estáticos públicos
│   │
│   └── src/
│       ├── main.jsx                 # Punto de entrada de React
│       ├── App.jsx                  # Componente principal: layout, modales de creación, navegación
│       ├── App.css                  # Estilos globales y animaciones custom
│       ├── index.css                # Estilos base de TailwindCSS
│       ├── supabaseClient.js        # Inicialización y singleton del cliente Supabase
│       │
│       ├── context/
│       │   └── AppContext.jsx       # Estado global: CRUD, auth, alertas, carga de datos
│       │
│       ├── components/
│       │   ├── Dashboard.jsx        # Panel principal: métricas, gráficos, historial de recaudo
│       │   ├── ClientesList.jsx     # Listado de clientes con búsqueda y acciones
│       │   ├── PrestamosList.jsx    # Listado de préstamos/fiados con filtros por estado
│       │   ├── ProductosList.jsx    # Inventario de productos con categorías y gestión de stock
│       │   ├── LoginScreen.jsx      # Pantalla de autenticación por correo (OTP)
│       │   ├── AlertModal.jsx       # Modal reutilizable de alertas y confirmaciones
│       │   ├── ConfirmDeleteModal.jsx  # Modal de confirmación de eliminación
│       │   ├── EditClienteModal.jsx    # Modal de edición de cliente
│       │   ├── EditPrestamoModal.jsx   # Modal de edición de préstamo
│       │   ├── EditProductoModal.jsx   # Modal de creación/edición de producto
│       │   ├── EditCategoriaModal.jsx  # Modal de creación/edición de categoría
│       │   └── SupabaseConfigModal.jsx # Modal de configuración de conexión (legacy)
│       │
│       └── utils/
│           └── validation.js        # Funciones de validación de inputs reutilizables
│
└── README.md                        # Este archivo
```

---

## ⚙️ Funcionalidades Principales

### 🔐 Autenticación y Seguridad
- Inicio de sesión mediante **correo electrónico con Magic Link** (OTP).
- Aislamiento total de datos por usuario mediante **Row Level Security (RLS)** en PostgreSQL.
- Limpieza automática de datos en memoria al cerrar sesión o cambiar de cuenta.

### 👥 Gestión de Clientes
- Registrar clientes con nombre, cédula (7-10 dígitos) y celular (10 dígitos).
- Editar y eliminar clientes.
- Búsqueda en tiempo real por nombre, cédula o teléfono.
- Visualización del saldo pendiente acumulado por cliente.

### 💳 Gestión de Préstamos / Fiados
- Crear préstamos seleccionando productos del inventario (descuenta stock automáticamente).
- Opción de agregar productos manuales (sin inventario).
- Carrito de productos con cantidades y precios unitarios.
- Registro de abono inicial al momento de crear el préstamo.
- Configuración de días de pago sugeridos (semanal, quincenal, mensual).
- Cambio automático de estado: `pendiente` → `pagado` (mediante trigger en PostgreSQL).
- Devolución de préstamos: restaura stock, reembolsa abonos y marca como `devuelto`.

### 💰 Gestión de Abonos
- Registrar abonos parciales o totales a préstamos activos.
- Fecha y hora por defecto (hora local del usuario).
- Notas opcionales por abono.
- Cálculo automático de saldo restante.

### 📦 Inventario de Productos
- CRUD completo de productos con nombre, precio, stock, imagen y descripción.
- Organización por categorías con colores distintivos.
- Control automático de stock (no permite fiar si el stock es 0).
- Cálculo dinámico del valor total del inventario.

### 📊 Dashboard de Métricas
- **Total Fiado**: Suma de todos los préstamos pendientes.
- **Total Recaudado**: Neto de abonos menos reembolsos (clic para ver historial detallado).
- **Clientes Activos**: Cantidad de clientes con deudas pendientes.
- **Valor del Inventario**: Suma de (stock × precio) de todos los productos.
- Listado de últimas transacciones (fiados, abonos, pagados).

### 🎨 Interfaz de Usuario
- Tema **oscuro/claro** con persistencia en localStorage.
- Diseño completamente **responsivo** (móvil, tablet y escritorio).
- Animaciones suaves de entrada y transiciones.
- Modales premium para alertas, confirmaciones y formularios.
- Iconografía profesional con Lucide React.

### ✅ Validación de Datos
- **Nombres**: Solo letras, tildes y espacios. Máximo 22 caracteres.
- **Cédula**: Solo dígitos. Entre 7 y 10 caracteres.
- **Celular**: Solo dígitos. Exactamente 10 caracteres.
- **Montos**: Solo dígitos. Tope máximo de $99.999.999. Sin `e`, `+`, `-`, `.` ni `,`.
- **Notas/Descripción**: Máximo 100 caracteres.

---

## 🗄️ Modelo de Base de Datos

```
┌─────────────┐     1:N      ┌──────────────┐     1:N      ┌──────────┐
│  clientes   │ ────────────►│  prestamos   │ ────────────►│  abonos  │
│             │              │              │              │          │
│ id (PK)     │              │ id (PK)      │              │ id (PK)  │
│ nombre      │              │ cliente_id   │              │ prestamo │
│ cedula      │              │ producto     │              │ _id (FK) │
│ telefono    │              │ precio_total │              │ monto    │
│ usuario_id  │              │ estado       │              │ fecha    │
└─────────────┘              │ productos_   │              │ notas    │
                             │   fiados     │              └──────────┘
                             │ usuario_id   │
                             └──────────────┘

┌──────────────────┐    N:1    ┌──────────────┐
│    productos     │ ─────────►│  categorias  │
│                  │           │  _productos  │
│ id (PK)          │           │              │
│ nombre           │           │ id (PK)      │
│ precio           │           │ nombre       │
│ stock            │           │ color        │
│ categoria_id(FK) │           │ usuario_id   │
│ usuario_id       │           └──────────────┘
└──────────────────┘

┌──────────────┐
│   usuarios   │  ← Vinculado a auth.users de Supabase
│              │
│ id (PK/FK)   │
│ nombre       │
│ email        │
│ foto         │
└──────────────┘
```

---

## 🚀 Instalación y Ejecución

### Prerrequisitos
- Node.js >= 18
- Cuenta en [Supabase](https://supabase.com)

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd "soft robert"
```

### 2. Configurar variables de entorno
Crear o editar el archivo `Frontend/.env`:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-publica
```

### 3. Ejecutar el script SQL
En el **Editor SQL** del panel de Supabase, ejecutar el contenido de `Backend/database_schema.sql`.

### 4. Instalar dependencias y ejecutar
```bash
cd Frontend
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

---

## 🛠️ Tecnologías y Dependencias

| Paquete | Versión | Propósito |
|---|---|---|
| `react` | 19.2.7 | Librería de UI |
| `react-dom` | 19.2.7 | Renderizado DOM |
| `@supabase/supabase-js` | 2.110.8 | Cliente de Supabase (Auth + DB) |
| `lucide-react` | 1.25.0 | Iconos SVG |
| `canvas-confetti` | 1.9.4 | Animación de confeti al pagar |
| `vite` | 8.1.1 | Bundler y servidor de desarrollo |
| `tailwindcss` | 3.4.19 | Framework de estilos CSS |

---

## 📄 Licencia

Proyecto privado. Todos los derechos reservados.
