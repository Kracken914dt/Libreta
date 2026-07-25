import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Package, 
  Plus, 
  Search, 
  Tag, 
  Edit, 
  Trash2, 
  AlertTriangle,
  FolderPlus,
  Eye,
  X,
  Coins
} from 'lucide-react';

export default function ProductosList({ 
  setOpenNewProducto, 
  setOpenNewCategoria, 
  onEditProducto, 
  onEditCategoria, 
  onRequestDeleteProducto, 
  onRequestDeleteCategoria 
}) {
  const { productos, categorias } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('todos');
  const [showManageCats, setShowManageCats] = useState(false);

  // Formatear Moneda Colombiana
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(val);
  };

  // Formatear gramos: "5.2", "10", "3.567" (sin padding trailing zero)
  const formatGramos = (val) => {
    if (val == null || isNaN(val)) return '';
    const n = parseFloat(val);
    const fixed = n.toFixed(3);
    return fixed.replace(/\.?0+$/, '') || '0';
  };

  // Filtrado de productos
  const filteredProductos = productos.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.descripcion && p.descripcion.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCat = selectedCatId === 'todos' || p.categoria_id === selectedCatId;
    
    return matchesSearch && matchesCat;
  });

  // Conteo de bajo stock
  const getLowStockCount = () => {
    return productos.filter(p => p.stock > 0 && p.stock <= 5).length;
  };

  const getOutOfStockCount = () => {
    return productos.filter(p => p.stock === 0).length;
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Inventario de Productos</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Administra los productos de tu tienda, precios y cantidades.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowManageCats(!showManageCats)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 transition-all"
          >
            <Tag size={14} />
            Categorías
          </button>
          <button
            onClick={() => setOpenNewProducto(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-violet-950/20 dark:shadow-violet-950/40 transition-all transform active:scale-98"
          >
            <Plus size={14} />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Panel de Gestión de Categorías */}
      {showManageCats && (
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl animate-slide-up space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Tag size={16} className="text-violet-500" />
              Gestión de Categorías
            </h3>
            <button
              onClick={() => setOpenNewCategoria(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 text-[11px] font-bold rounded-lg border border-violet-500/20 transition-all"
            >
              <FolderPlus size={12} />
              Agregar Categoría
            </button>
          </div>

          {categorias.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500">No hay categorías creadas. Agrega una para organizar tus productos.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categorias.map(cat => {
                const prodCount = productos.filter(p => p.categoria_id === cat.id).length;
                return (
                  <div 
                    key={cat.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                    style={{ 
                      backgroundColor: cat.color + '09', 
                      borderColor: cat.color + '30',
                      color: cat.color 
                    }}
                  >
                    <span>{cat.nombre} <span className="opacity-60">({prodCount})</span></span>
                    <div className="flex items-center gap-1 ml-1 pl-1 border-l border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() => onEditCategoria(cat)}
                        className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Editar"
                      >
                        <Edit size={10} />
                      </button>
                      <button
                        onClick={() => onRequestDeleteCategoria(cat)}
                        className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-rose-500"
                        title="Eliminar"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Resumen e Indicadores */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Total Productos</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">{productos.length}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Bajo Stock (≤5)</span>
          <span className={`text-xl font-bold mt-1 block ${getLowStockCount() > 0 ? 'text-amber-500' : 'text-slate-500 dark:text-slate-400'}`}>
            {getLowStockCount()}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Agotados</span>
          <span className={`text-xl font-bold mt-1 block ${getOutOfStockCount() > 0 ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>
            {getOutOfStockCount()}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Valor Inventario</span>
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
            {formatCurrency(productos.reduce((sum, p) => sum + (p.precio * p.stock), 0))}
          </span>
        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Barra de búsqueda */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-violet-500 transition-all shadow-sm"
          />
        </div>
        
        {/* Chips de filtro de categoría */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 shrink-0 scrollbar-none">
          <button
            onClick={() => setSelectedCatId('todos')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-semibold border transition-all ${
              selectedCatId === 'todos' 
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
            }`}
          >
            Todos
          </button>
          {categorias.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCatId(cat.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-semibold border transition-all ${
                selectedCatId === cat.id 
                  ? 'text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
              style={selectedCatId === cat.id ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
            >
              {cat.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Productos */}
      {filteredProductos.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 rounded-2xl text-center text-slate-400 dark:text-slate-500 shadow-sm">
          {productos.length === 0 
            ? "No tienes productos en el inventario. Agrega uno con el botón 'Nuevo Producto'."
            : "No se encontraron productos con los filtros aplicados."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProductos.map(p => {
            const cat = categorias.find(c => c.id === p.categoria_id);
            const isOutOfStock = p.stock === 0;
            const isLowStock = p.stock > 0 && p.stock <= 5;
            // Joyería: ganancia derivada, never persisted
            const pg = p.peso_gramos != null ? parseFloat(p.peso_gramos) : null;
            const cg = p.costo_por_gramo != null ? parseFloat(p.costo_por_gramo) : null;
            const vg = p.precio_por_gramo != null ? parseFloat(p.precio_por_gramo) : null;
            const ganancia = (pg != null && cg != null && vg != null) ? (vg - cg) * pg : null;
            const showJewelryLine = pg != null || p.largo != null;
            
            return (
              <div 
                key={p.id}
                className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group relative"
              >
                {/* Imagen del Producto */}
                <div className="h-44 w-full bg-slate-100 dark:bg-slate-950 relative flex items-center justify-center border-b border-slate-100 dark:border-slate-900">
                  {p.imagen_url ? (
                    <img 
                      src={p.imagen_url} 
                      alt={p.nombre} 
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.className = "h-12 w-12 text-slate-300";
                        e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package"><path d="M16.5 9.4 7.55 4.24a1.79 1.79 0 0 0-1.8 0L2.3 6.22a1.79 1.79 0 0 0 0 3.1l3.45 2a1.79 1.79 0 0 0 1.8 0L16.5 9.4z"/><path d="m2.3 9.4 8.7 5a1.79 1.79 0 0 0 1.8 0l8.7-5"/><path d="m21.7 9.4-8.7-5a1.79 1.79 0 0 0-1.8 0l-3.45 2a1.79 1.79 0 0 0 0 3.1l8.7 5a1.79 1.79 0 0 0 1.8 0l3.45-2a1.79 1.79 0 0 0 0-3.1z"/><path d="M12 14.4v6.8"/></svg>';
                      }}
                    />
                  ) : (
                    <Package className="h-12 w-12 text-slate-300 dark:text-slate-700" />
                  )}
                  
                  {/* Etiqueta de Categoría */}
                  {cat && (
                    <span 
                      className="absolute top-3 left-3 px-2 py-0.5 rounded-lg text-[10px] font-bold text-white shadow-sm border border-white/10"
                      style={{ backgroundColor: cat.color }}
                    >
                      {cat.nombre}
                    </span>
                  )}

                  {/* Estado de stock */}
                  {isOutOfStock && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 bg-rose-600 text-white rounded-lg text-[9px] font-bold shadow-md flex items-center gap-1 border border-rose-500">
                      <AlertTriangle size={10} />
                      AGOTADO
                    </span>
                  )}
                  {isLowStock && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 bg-amber-500 text-white rounded-lg text-[9px] font-bold shadow-md flex items-center gap-1 border border-amber-400">
                      <AlertTriangle size={10} />
                      BAJO STOCK
                    </span>
                  )}
                </div>

                {/* Contenido */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {p.nombre}
                    </h4>
                    {p.descripcion && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {p.descripcion}
                      </p>
                    )}

                    {/* Línea joyería: peso + largo */}
                    {showJewelryLine && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
                        {pg != null && <span className="font-bold text-slate-700 dark:text-slate-300">{formatGramos(pg)}g</span>}
                        {pg != null && p.largo != null && <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>}
                        {p.largo != null && <span>{parseFloat(p.largo)}cm</span>}
                      </p>
                    )}

                    {/* Badge de ganancia estimada (derivada, no persistida) */}
                    {ganancia != null && (
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-500/20">
                        <Coins size={10} />
                        Ganancia {formatCurrency(ganancia)}
                      </div>
                    )}
                  </div>
                  
                  {/* Detalles de precio y stock */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block uppercase tracking-wider">Precio</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(p.precio)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block uppercase tracking-wider">Disponibles</span>
                      <span className={`text-xs font-bold ${
                        isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {p.stock} {p.stock === 1 ? 'unidad' : 'unidades'}
                      </span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-900 flex justify-end gap-1.5">
                    <button
                      onClick={() => onEditProducto(p)}
                      className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 rounded-xl border border-slate-200 dark:border-slate-800 transition-all"
                      title="Editar Producto"
                    >
                      <Edit size={13} />
                    </button>
                    <button
                      onClick={() => onRequestDeleteProducto(p)}
                      className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-slate-200 dark:border-slate-800 transition-all"
                      title="Eliminar Producto"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
