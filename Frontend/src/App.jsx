import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Dashboard from './components/Dashboard';
import ClientesList from './components/ClientesList';
import PrestamosList from './components/PrestamosList';

import EditClienteModal from './components/EditClienteModal';
import EditPrestamoModal from './components/EditPrestamoModal';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import LoginScreen from './components/LoginScreen';
import ProductosList from './components/ProductosList';
import EditProductoModal from './components/EditProductoModal';
import EditCategoriaModal from './components/EditCategoriaModal';
import AlertModal from './components/AlertModal';
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  Database, 
  Menu, 
  X, 
  BookOpen, 
  Plus, 
  Sun, 
  Moon,
  LogOut,
  UserCheck,
  Package,
  Trash2
} from 'lucide-react';

function AppContent() {
  const { 
    mode, 
    toggleMode, 
    clientes, 
    prestamos, 
    productos,
    categorias,
    addCliente, 
    addPrestamo, 
    addAbono, 
    deleteCliente,
    deletePrestamo,
    deleteAbono,
    deleteProducto,
    deleteCategoria,
    isConfigured,
    user,
    logout,
    loading,
    alertConfig,
    showAlert,
    closeAlert
  } = useApp();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Tema Claro / Oscuro
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  };

  // Estados de Modales de Creación
  const [openConfigModal, setOpenConfigModal] = useState(false);
  const [openNewCliente, setOpenNewCliente] = useState(false);
  const [openNewPrestamo, setOpenNewPrestamo] = useState(false);
  const [openNewAbono, setOpenNewAbono] = useState(false);
  const [openNewProducto, setOpenNewProducto] = useState(false);
  const [openNewCategoria, setOpenNewCategoria] = useState(false);

  // Estados de Modales de Edición
  const [editingCliente, setEditingCliente] = useState(null);
  const [editingPrestamo, setEditingPrestamo] = useState(null);
  const [editingProducto, setEditingProducto] = useState(null);
  const [editingCategoria, setEditingCategoria] = useState(null);

  // Estado del Modal de Eliminación Personalizado
  const [deleteTarget, setDeleteTarget] = useState(null); // { type, data, name, message }

  // Selección rápida para formularios pre-llenados
  const [selectedClienteForPrestamo, setSelectedClienteForPrestamo] = useState(null);
  const [selectedPrestamoForAbono, setSelectedPrestamoForAbono] = useState(null);

  // Helper: generar fecha/hora local en formato YYYY-MM-DDTHH:MM
  const getLocalDateTimeString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Datos de formularios
  const [newClienteData, setNewClienteData] = useState({ nombre: '', cedula: '', telefono: '' });
  const [newPrestamoData, setNewPrestamoData] = useState({
    cliente_id: '',
    producto: '',
    precio_total: '',
    abono_inicial: '',
    dias_pago_sugeridos: '',
    notas: '',
    fecha_prestamo: getLocalDateTimeString()
  });
  const [newAbonoData, setNewAbonoData] = useState({
    prestamo_id: '',
    monto: '',
    notas: '',
    fecha_abono: getLocalDateTimeString()
  });

  const [submitting, setSubmitting] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [isCustomProduct, setIsCustomProduct] = useState(false);
  const [productosAgregados, setProductosAgregados] = useState([]);
  const [currentQty, setCurrentQty] = useState(1);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  // Pre-llenar fecha y hora actual en modales al abrirse
  useEffect(() => {
    if (openNewPrestamo) {
      setNewPrestamoData(prev => ({
        ...prev,
        fecha_prestamo: getLocalDateTimeString()
      }));
    }
  }, [openNewPrestamo]);

  useEffect(() => {
    if (openNewAbono) {
      setNewAbonoData(prev => ({
        ...prev,
        fecha_abono: getLocalDateTimeString()
      }));
    }
  }, [openNewAbono]);

  // Spinner de carga inicial para evitar parpadeos de Auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-slate-200 dark:border-slate-800"></div>
          <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-violet-600 animate-spin"></div>
        </div>
      </div>
    );
  }

  // Interceptar Login de Google con Supabase
  if (mode === 'supabase' && user === null) {
    return <LoginScreen onSkip={() => toggleMode()} />;
  }

  // Métodos de eliminación con modal personalizado
  const onRequestDeleteCliente = (cliente, stats) => {
    setDeleteTarget({
      type: 'cliente',
      data: cliente,
      name: cliente.nombre,
      message: stats.deudaActiva > 0 
        ? `⚠️ ¡ATENCIÓN! Este cliente tiene una deuda pendiente de ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(stats.deudaActiva)}. Si lo eliminas, también se borrarán permanentemente todos sus préstamos (${stats.totalPrestamos}) y abonos.`
        : stats.totalPrestamos > 0 
          ? `Se borrará todo su historial de préstamos (${stats.totalPrestamos}) y abonos de forma permanente.`
          : 'Esta acción no se puede deshacer.'
    });
  };

  const onRequestDeletePrestamo = (prestamo) => {
    setDeleteTarget({
      type: 'prestamo',
      data: prestamo,
      name: prestamo.producto,
      message: 'Se borrarán de forma permanente todos los abonos registrados para este préstamo. Esta acción no se puede deshacer.'
    });
  };

  const onRequestDeleteAbono = (abono) => {
    setDeleteTarget({
      type: 'abono',
      data: abono,
      name: `Abono de ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(abono.monto)}`,
      message: 'Se eliminará el abono de la cuenta del préstamo, aumentando su saldo pendiente. Esta acción no se puede deshacer.'
    });
  };

  const onRequestDeleteProducto = (producto) => {
    setDeleteTarget({
      type: 'producto',
      data: producto,
      name: producto.nombre,
      message: 'Se eliminará este producto de tu inventario permanentemente. Esta acción no se puede deshacer.'
    });
  };

  const onRequestDeleteCategoria = (categoria) => {
    const prodsCount = productos.filter(p => p.categoria_id === categoria.id).length;
    setDeleteTarget({
      type: 'categoria',
      data: categoria,
      name: categoria.nombre,
      message: prodsCount > 0
        ? `Se eliminará esta categoría. Los ${prodsCount} productos asociados a ella no se eliminarán, pero quedarán sin categoría asignada.`
        : 'Se eliminará esta categoría permanentemente. Esta acción no se puede deshacer.'
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const { type, data } = deleteTarget;
    try {
      if (type === 'cliente') {
        await deleteCliente(data.id);
      } else if (type === 'prestamo') {
        await deletePrestamo(data.id);
      } else if (type === 'abono') {
        await deleteAbono(data.id);
      } else if (type === 'producto') {
        await deleteProducto(data.id);
      } else if (type === 'categoria') {
        await deleteCategoria(data.id);
      }
    } catch (err) {
      showAlert(`Error al eliminar: ${err.message}`, 'Error', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  // Manejo de Registro de Cliente
  const handleCreateCliente = async (e) => {
    e.preventDefault();
    if (!newClienteData.nombre.trim()) return;

    setSubmitting(true);
    try {
      await addCliente(newClienteData);
      setNewClienteData({ nombre: '', cedula: '', telefono: '' });
      setOpenNewCliente(false);
    } catch (err) {
      showAlert('Error al crear cliente: ' + err.message, 'Error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Agregar un producto temporalmente al carrito de fiados
  const handleAgregarProducto = (e) => {
    e.preventDefault();
    if (isCustomProduct) {
      if (!customName.trim() || !customPrice) {
        showAlert('Por favor especifica el nombre y precio del producto.', 'Campos incompletos', 'warning');
        return;
      }
      const newItem = {
        id: null,
        nombre: customName,
        cantidad: parseInt(currentQty) || 1,
        precio: parseFloat(customPrice)
      };
      setProductosAgregados(prev => [...prev, newItem]);
      setCustomName('');
      setCustomPrice('');
      setCurrentQty(1);
    } else {
      if (!selectedProductId) {
        showAlert('Por favor selecciona un producto de la lista.', 'Producto requerido', 'warning');
        return;
      }
      const prod = productos.find(p => p.id === selectedProductId);
      if (!prod) return;
      if (prod.stock < currentQty) {
        showAlert(`Stock insuficiente. Solo quedan ${prod.stock} unidades de este producto.`, 'Stock insuficiente', 'warning');
        return;
      }
      
      const existingItemQty = productosAgregados
        .filter(item => item.id === selectedProductId)
        .reduce((sum, item) => sum + item.cantidad, 0);
        
      if (prod.stock < (existingItemQty + parseInt(currentQty))) {
        showAlert(`No puedes agregar más de la cantidad en stock. Ya tienes ${existingItemQty} agregados y el stock es ${prod.stock}.`, 'Stock insuficiente', 'warning');
        return;
      }

      const newItem = {
        id: selectedProductId,
        nombre: prod.nombre,
        cantidad: parseInt(currentQty) || 1,
        precio: prod.precio
      };
      setProductosAgregados(prev => [...prev, newItem]);
      setSelectedProductId('');
      setCurrentQty(1);
    }
  };

  // Manejo de Registro de Préstamo
  const handleCreatePrestamo = async (e) => {
    e.preventDefault();
    const clienteId = selectedClienteForPrestamo?.id || newPrestamoData.cliente_id;
    if (!clienteId) {
      showAlert('Por favor selecciona un cliente.', 'Cliente requerido', 'warning');
      return;
    }
    if (productosAgregados.length === 0) {
      showAlert('Por favor agrega al menos un producto al préstamo.', 'Productos requeridos', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await addPrestamo({
        cliente_id: clienteId,
        productos_seleccionados: productosAgregados,
        dias_pago_sugeridos: newPrestamoData.dias_pago_sugeridos,
        notas: newPrestamoData.notas,
        fecha_prestamo: newPrestamoData.fecha_prestamo,
        abono_inicial: newPrestamoData.abono_inicial
      });
      
      setNewPrestamoData({
        cliente_id: '',
        producto: '',
        precio_total: '',
        abono_inicial: '',
        dias_pago_sugeridos: '',
        notes: '',
        notas: '',
        fecha_prestamo: getLocalDateTimeString()
      });
      setSelectedClienteForPrestamo(null);
      setSelectedProductId('');
      setIsCustomProduct(false);
      setProductosAgregados([]);
      setCurrentQty(1);
      setCustomName('');
      setCustomPrice('');
      setOpenNewPrestamo(false);
    } catch (err) {
      showAlert('Error al registrar préstamo: ' + err.message, 'Error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Manejo de Registro de Abono
  const handleCreateAbono = async (e) => {
    e.preventDefault();
    const prestamoId = selectedPrestamoForAbono?.id || newAbonoData.prestamo_id;
    if (!prestamoId || !newAbonoData.monto) {
      showAlert('Por favor completa los campos obligatorios.', 'Campos incompletos', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const response = await addAbono({
        ...newAbonoData,
        prestamo_id: prestamoId
      });

      if (response && response.prestamo && response.prestamo.estado === 'pagado') {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#6ee7b7']
        });
      } else {
        confetti({ particleCount: 40, spread: 40, colors: ['#14b8a6', '#2dd4bf'] });
      }

      setNewAbonoData({
        prestamo_id: '',
        monto: '',
        notas: '',
        fecha_abono: getLocalDateTimeString()
      });
      setSelectedPrestamoForAbono(null);
      setOpenNewAbono(false);
    } catch (err) {
      showAlert('Error al registrar abono: ' + err.message, 'Error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden transition-colors duration-300">
      
      {/* SIDEBAR PARA PANTALLAS GRANDES */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition-colors duration-300">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-violet-600 to-indigo-600 text-white rounded-xl shadow-md">
            <BookOpen size={20} />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 dark:text-white leading-none text-base">La Libreta</h1>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Roberto Gómez</span>
          </div>
        </div>

        {/* Menú de Navegación */}
        <nav className="flex-1 p-4 space-y-1.5">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/10 dark:border-violet-500/20 shadow-sm' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border border-transparent'
            }`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>

          <button 
            onClick={() => setActiveTab('clientes')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'clientes' 
                ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/10 dark:border-violet-500/20 shadow-sm' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border border-transparent'
            }`}
          >
            <Users size={18} />
            Clientes
          </button>

          <button 
            onClick={() => setActiveTab('prestamos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'prestamos' 
                ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/10 dark:border-violet-500/20 shadow-sm' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border border-transparent'
            }`}
          >
            <DollarSign size={18} />
            Préstamos y Fiados
          </button>

          <button 
            onClick={() => setActiveTab('productos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'productos' 
                ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/10 dark:border-violet-500/20 shadow-sm' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border border-transparent'
            }`}
          >
            <Package size={18} />
            Inventario / Productos
          </button>
        </nav>

        {/* Sección de Usuario de Google / Supabase Info */}
        {mode === 'supabase' && user && (
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20">
            <div className="flex items-center gap-3">
              {user.user_metadata?.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt={user.user_metadata.full_name} 
                  className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-sm">
                  {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
                  {user.user_metadata?.full_name || 'Usuario'}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-none mt-0.5">
                  {user.email}
                </p>
              </div>
              <button 
                onClick={logout}
                title="Cerrar sesión"
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-950/50"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        )}

      </aside>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* BARRA DE NAVEGACIÓN SUPERIOR */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/80 px-4 flex items-center justify-between shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg lg:hidden"
            >
              <Menu size={20} />
            </button>
            <span className="font-bold text-slate-900 dark:text-white text-base lg:hidden">La Libreta</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle de Modo Claro / Oscuro */}
            <button 
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 transition-all shadow-sm dark:shadow-none"
              title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Indicador e Interruptor de Base de Datos */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-1.5 text-xs shadow-sm dark:shadow-none">
              <span className={`w-2 h-2 rounded-full ${mode === 'supabase' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                {mode === 'supabase' ? 'Supabase' : 'Demo'}
              </span>
              {isConfigured && (
                <button 
                  onClick={toggleMode}
                  className="ml-2 font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 border-l border-slate-200 dark:border-slate-850 pl-2 text-[10px] uppercase tracking-wider"
                >
                  Cambiar a {mode === 'demo' ? 'Supabase' : 'Demo'}
                </button>
              )}
            </div>

            </div>
        </header>

        {/* CONTENIDO PRINCIPAL SCROLLABLE */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          <div className="max-w-6xl mx-auto pb-12">
            {activeTab === 'dashboard' && (
              <Dashboard 
                setActiveTab={setActiveTab}
                setOpenNewPrestamo={setOpenNewPrestamo}
                setOpenNewCliente={setOpenNewCliente}
                setOpenNewAbono={setOpenNewAbono}
              />
            )}
            {activeTab === 'clientes' && (
              <ClientesList 
                setOpenNewCliente={setOpenNewCliente}
                setOpenNewPrestamo={setOpenNewPrestamo}
                setOpenNewAbono={setOpenNewAbono}
                setSelectedClienteForPrestamo={setSelectedClienteForPrestamo}
                setSelectedPrestamoForAbono={setSelectedPrestamoForAbono}
                onEditCliente={(c) => setEditingCliente(c)}
                onRequestDeleteCliente={onRequestDeleteCliente}
              />
            )}
            {activeTab === 'prestamos' && (
              <PrestamosList 
                setOpenNewPrestamo={setOpenNewPrestamo}
                setOpenNewAbono={setOpenNewAbono}
                setSelectedPrestamoForAbono={setSelectedPrestamoForAbono}
                onEditPrestamo={(p) => setEditingPrestamo(p)}
                onRequestDeletePrestamo={onRequestDeletePrestamo}
                onRequestDeleteAbono={onRequestDeleteAbono}
              />
            )}
            {activeTab === 'productos' && (
              <ProductosList 
                setOpenNewProducto={setOpenNewProducto}
                setOpenNewCategoria={setOpenNewCategoria}
                onEditProducto={(p) => setEditingProducto(p)}
                onEditCategoria={(c) => setEditingCategoria(c)}
                onRequestDeleteProducto={onRequestDeleteProducto}
                onRequestDeleteCategoria={onRequestDeleteCategoria}
              />
            )}
          </div>
        </main>
      </div>

      {/* MENÚ MÓVIL OVERLAY DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 lg:hidden animate-fade-in">
          <div className="absolute inset-0" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full flex flex-col p-6 animate-slide-up text-slate-700 dark:text-slate-350">
            <div className="flex justify-between items-center pb-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen size={20} className="text-violet-500" />
                <span className="font-bold text-slate-950 dark:text-white">La Libreta</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 mt-6 space-y-1.5">
              <button 
                onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'dashboard' ? 'bg-violet-500/10 text-violet-650 dark:text-violet-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <LayoutDashboard size={18} />
                Dashboard
              </button>
              <button 
                onClick={() => { setActiveTab('clientes'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'clientes' ? 'bg-violet-500/10 text-violet-650 dark:text-violet-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Users size={18} />
                Clientes
              </button>
              <button 
                onClick={() => { setActiveTab('prestamos'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'prestamos' ? 'bg-violet-500/10 text-violet-650 dark:text-violet-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <DollarSign size={18} />
                Préstamos
              </button>
              <button 
                onClick={() => { setActiveTab('productos'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'productos' ? 'bg-violet-500/10 text-violet-650 dark:text-violet-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Package size={18} />
                Inventario
              </button>
            </nav>

            {mode === 'supabase' && user && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 rounded-xl p-3 flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  {user.user_metadata?.avatar_url && (
                    <img 
                      src={user.user_metadata.avatar_url} 
                      alt="" 
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user.user_metadata?.full_name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold rounded-lg transition-colors"
                >
                  <LogOut size={14} />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALES DE DIÁLOGO Y EDICIÓN
          ========================================================================= */}



      {/* MODALES DE EDICIÓN Y CREACIÓN */}
      <EditClienteModal 
        isOpen={!!editingCliente} 
        onClose={() => setEditingCliente(null)} 
        cliente={editingCliente} 
      />

      <EditPrestamoModal 
        isOpen={!!editingPrestamo} 
        onClose={() => setEditingPrestamo(null)} 
        prestamo={editingPrestamo} 
      />

      <EditProductoModal
        isOpen={openNewProducto || !!editingProducto}
        onClose={() => { setOpenNewProducto(false); setEditingProducto(null); }}
        producto={editingProducto}
      />

      <EditCategoriaModal
        isOpen={openNewCategoria || !!editingCategoria}
        onClose={() => { setOpenNewCategoria(false); setEditingCategoria(null); }}
        categoria={editingCategoria}
      />

      {/* MODAL DE ELIMINACIÓN PERSONALIZADO */}
      <ConfirmDeleteModal 
        isOpen={!!deleteTarget}
        title={
          deleteTarget?.type === 'cliente' ? 'Eliminar Cliente' :
          deleteTarget?.type === 'prestamo' ? 'Eliminar Préstamo / Fiado' :
          deleteTarget?.type === 'producto' ? 'Eliminar Producto' :
          deleteTarget?.type === 'categoria' ? 'Eliminar Categoría' : 'Eliminar Abono'
        }
        message={deleteTarget?.message}
        itemName={deleteTarget?.name}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* MODAL NUEVO CLIENTE */}
      {openNewCliente && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-slide-up">
            <button 
              onClick={() => setOpenNewCliente(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Registrar Nuevo Cliente</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Agrega los datos básicos para abrirle su cuenta.</p>

            <form onSubmit={handleCreateCliente} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Nombre Completo *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. Juan Pérez"
                  value={newClienteData.nombre}
                  onChange={(e) => setNewClienteData(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-violet-500/80 transition-all text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Cédula / ID</label>
                  <input 
                    type="text" 
                    placeholder="Ej. 1023456"
                    value={newClienteData.cedula}
                    onChange={(e) => setNewClienteData(prev => ({ ...prev, cedula: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-violet-500/80 transition-all text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Celular / Teléfono</label>
                  <input 
                    type="text" 
                    placeholder="Ej. 3124567890"
                    value={newClienteData.telefono}
                    onChange={(e) => setNewClienteData(prev => ({ ...prev, telefono: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-violet-500/80 transition-all text-xs"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-violet-950/30 dark:shadow-violet-950/45 disabled:opacity-50"
              >
                {submitting ? 'Registrando...' : 'Registrar Cliente'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVO PRÉSTAMO / FIADO */}
      {openNewPrestamo && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative animate-slide-up max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => { setOpenNewPrestamo(false); setSelectedClienteForPrestamo(null); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Registrar Préstamo / Fiado</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Registra un nuevo producto fiado a una cuenta.</p>

            <form onSubmit={handleCreatePrestamo} className="space-y-4">
              {/* Cliente */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Cliente *</label>
                {selectedClienteForPrestamo ? (
                  <div className="p-3 bg-violet-550/[0.07] dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 text-violet-700 dark:text-violet-300 rounded-xl text-xs flex justify-between items-center">
                    <span>Fiar a: <strong>{selectedClienteForPrestamo.nombre}</strong></span>
                    <button 
                      type="button" 
                      onClick={() => setSelectedClienteForPrestamo(null)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-[10px] uppercase font-bold"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <select 
                    required
                    value={newPrestamoData.cliente_id}
                    onChange={(e) => setNewPrestamoData(prev => ({ ...prev, cliente_id: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/80 transition-all text-xs"
                  >
                    <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">-- Selecciona un Cliente --</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        {c.nombre} {c.cedula ? `(C.C. ${c.cedula})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Lista de productos agregados temporalmente */}
              <div className="space-y-2.5 p-4 bg-slate-100/60 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-2xl">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">Artículos agregados:</span>
                
                {productosAgregados.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">No se han agregado productos todavía.</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {productosAgregados.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="flex justify-between items-center text-xs py-1.5 px-2.5 bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 rounded-xl"
                      >
                        <span className="font-medium text-slate-800 dark:text-slate-200 leading-tight">
                          {item.cantidad}x <strong className="font-semibold text-violet-600 dark:text-violet-400">{item.nombre}</strong>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-300 font-medium">
                            Subtotal: ${(item.precio * item.cantidad).toLocaleString('es-CO')}
                          </span>
                          <button
                            type="button"
                            onClick={() => setProductosAgregados(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1 hover:bg-rose-500/10 hover:text-rose-500 text-slate-400 dark:text-slate-500 rounded-lg transition-all"
                            title="Remover"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selector de Producto para agregar */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-850/60 rounded-2xl space-y-4">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Agregar Producto o Servicio:</span>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Producto</label>
                    <select
                      value={isCustomProduct ? 'custom' : selectedProductId}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'custom') {
                          setIsCustomProduct(true);
                          setSelectedProductId('');
                        } else if (val) {
                          setIsCustomProduct(false);
                          setSelectedProductId(val);
                        } else {
                          setIsCustomProduct(false);
                          setSelectedProductId('');
                        }
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/80 transition-all text-xs"
                    >
                      <option value="">-- Selecciona un Producto --</option>
                      {productos.map(p => {
                        const cat = categorias.find(c => c.id === p.categoria_id);
                        const catPrefix = cat ? `[${cat.nombre}] ` : '';
                        const stockText = p.stock === 0 ? '(Agotado)' : `(${p.stock} disp.)`;
                        return (
                          <option 
                            key={p.id} 
                            value={p.id} 
                            disabled={p.stock === 0}
                            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          >
                            {catPrefix}{p.nombre} - ${p.precio.toLocaleString('es-CO')} {stockText}
                          </option>
                        );
                      })}
                      <option value="custom" className="bg-white dark:bg-slate-900 font-semibold text-violet-600 dark:text-violet-400">
                        ✍️ Escribir Manualmente (Otro)
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Cantidad</label>
                    <input 
                      type="number" 
                      min="1"
                      value={currentQty}
                      onChange={(e) => setCurrentQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/80 transition-all text-xs"
                    />
                  </div>
                </div>

                {isCustomProduct && (
                  <div className="grid grid-cols-2 gap-3 animate-slide-up">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Nombre Personalizado *</label>
                      <input 
                        type="text" 
                        placeholder="Ej. Reparación, etc."
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/80 transition-all text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Precio Unitario *</label>
                      <input 
                        type="number" 
                        min="0"
                        placeholder="Ej. 120000"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/80 transition-all text-xs"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAgregarProducto}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-850 dark:hover:bg-slate-100 font-bold rounded-xl border border-slate-850 dark:border-slate-200 transition-all text-xs"
                >
                  <Plus size={14} />
                  Agregar al Detalle
                </button>
              </div>

              {/* Valores y Abono */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Valor Total ($) *</label>
                  <input 
                    type="text" 
                    readOnly
                    disabled
                    value={productosAgregados.reduce((sum, p) => sum + (p.precio * p.cantidad), 0).toLocaleString('es-CO')}
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none font-bold text-xs cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Abono Inicial (Opcional)</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="Ej. 20000"
                    value={newPrestamoData.abono_inicial}
                    onChange={(e) => setNewPrestamoData(prev => ({ ...prev, abono_inicial: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-650 focus:outline-none focus:border-violet-500/80 transition-all text-xs"
                  />
                </div>
              </div>

              {/* Fechas y sugerencia de pago */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Fecha y Hora *</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={newPrestamoData.fecha_prestamo}
                    onChange={(e) => setNewPrestamoData(prev => ({ ...prev, fecha_prestamo: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/80 transition-all text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Días de Pago Sugeridos</label>
                  <select
                    value={newPrestamoData.dias_pago_sugeridos}
                    onChange={(e) => setNewPrestamoData(prev => ({ ...prev, dias_pago_sugeridos: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/80 transition-all text-xs"
                  >
                    <option value="" className="bg-white dark:bg-slate-900">-- Sin especificar --</option>
                    <option value="Semanal (Lunes)" className="bg-white dark:bg-slate-900">Semanal (Lunes)</option>
                    <option value="Semanal (Martes)" className="bg-white dark:bg-slate-900">Semanal (Martes)</option>
                    <option value="Semanal (Miércoles)" className="bg-white dark:bg-slate-900">Semanal (Miércoles)</option>
                    <option value="Semanal (Jueves)" className="bg-white dark:bg-slate-900">Semanal (Jueves)</option>
                    <option value="Semanal (Viernes)" className="bg-white dark:bg-slate-900">Semanal (Viernes)</option>
                    <option value="Semanal (Sábado)" className="bg-white dark:bg-slate-900">Semanal (Sábado)</option>
                    <option value="Semanal (Domingo)" className="bg-white dark:bg-slate-900">Semanal (Domingo)</option>
                    <option value="Quincenal (15 y 30)" className="bg-white dark:bg-slate-900">Quincenal (15 y 30)</option>
                    <option value="Mensual" className="bg-white dark:bg-slate-900">Mensual</option>
                    <option value="Fin de mes" className="bg-white dark:bg-slate-900">Fin de mes</option>
                  </select>
                </div>
              </div>

              {/* Notas */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Notas / Detalles adicionales</label>
                <textarea 
                  placeholder="Ej. Talla 38, Color azul, etc."
                  value={newPrestamoData.notas}
                  onChange={(e) => setNewPrestamoData(prev => ({ ...prev, notas: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-violet-500/80 transition-all text-xs h-20 resize-none"
                />
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-violet-950/30 dark:shadow-violet-950/45 disabled:opacity-50"
              >
                {submitting ? 'Registrando...' : 'Registrar Préstamo'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR ABONO */}
      {openNewAbono && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-slide-up max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => { setOpenNewAbono(false); setSelectedPrestamoForAbono(null); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Registrar Abono</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Ingresa un abono de pago a una deuda pendiente.</p>

            <form onSubmit={handleCreateAbono} className="space-y-4">
              {/* Deuda / Préstamo */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Préstamo / Deuda *</label>
                {selectedPrestamoForAbono ? (() => {
                  const cliente = clientes.find(c => c.id === selectedPrestamoForAbono.cliente_id);
                  return (
                    <div className="p-3 bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-300 rounded-xl text-xs flex justify-between items-center">
                      <div className="min-w-0">
                        <p className="font-semibold">{cliente?.nombre || 'Cliente'}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-[10px]">Producto: {selectedPrestamoForAbono.producto} (Total: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(selectedPrestamoForAbono.precio_total)})</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setSelectedPrestamoForAbono(null)}
                        className="text-slate-400 hover:text-slate-650 dark:hover:text-white text-[10px] uppercase font-bold shrink-0 ml-2"
                      >
                        Cambiar
                      </button>
                    </div>
                  );
                })() : (
                  <select 
                    required
                    value={newAbonoData.prestamo_id}
                    onChange={(e) => setNewAbonoData(prev => ({ ...prev, prestamo_id: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/80 transition-all text-xs"
                  >
                    <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">-- Selecciona un Préstamo Pendiente --</option>
                    {prestamos
                      .filter(p => p.estado === 'pendiente')
                      .map(p => {
                        const cliente = clientes.find(c => c.id === p.cliente_id);
                        return (
                          <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                            {cliente?.nombre || 'Desconocido'} - {p.producto} (${p.precio_total})
                          </option>
                        );
                      })}
                  </select>
                )}
              </div>

              {/* Monto */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Monto del Abono ($) *</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  placeholder="Ej. 30000"
                  value={newAbonoData.monto}
                  onChange={(e) => setNewAbonoData(prev => ({ ...prev, monto: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-violet-500/80 transition-all text-xs"
                />
              </div>

              {/* Fecha */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Fecha y Hora *</label>
                <input 
                  type="datetime-local" 
                  required
                  value={newAbonoData.fecha_abono}
                  onChange={(e) => setNewAbonoData(prev => ({ ...prev, fecha_abono: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/80 transition-all text-xs"
                />
              </div>

              {/* Notas */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Detalles / Notas (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Ej. Pagó en efectivo, transferencia bancaria, etc."
                  value={newAbonoData.notas}
                  onChange={(e) => setNewAbonoData(prev => ({ ...prev, notas: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-violet-500/80 transition-all text-xs"
                />
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-teal-650 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-teal-950/30 dark:shadow-teal-950/45 disabled:opacity-50"
              >
                {submitting ? 'Registrando...' : 'Registrar Abono'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AlertModal Global */}
      <AlertModal isOpen={!!alertConfig} alertConfig={alertConfig} onClose={closeAlert} />

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
