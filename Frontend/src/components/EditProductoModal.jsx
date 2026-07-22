import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Package, Image as ImageIcon } from 'lucide-react';
import { 
  handleNumberKeyDown, 
  formatNameInput, 
  formatMontoInput 
} from '../utils/validation';

export default function EditProductoModal({ isOpen, onClose, producto }) {
  const { categorias, addProducto, updateProducto, showAlert } = useApp();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (producto) {
      setNombre(producto.nombre || '');
      setDescripcion(producto.descripcion || '');
      setPrecio(producto.precio || '');
      setStock(producto.stock !== undefined ? producto.stock : '');
      setImagenUrl(producto.imagen_url || '');
      setCategoriaId(producto.categoria_id || '');
    } else {
      setNombre('');
      setDescripcion('');
      setPrecio('');
      setStock('');
      setImagenUrl('');
      setCategoriaId('');
    }
  }, [producto, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || precio === '' || stock === '') return;

    setSubmitting(true);
    try {
      const payload = {
        nombre,
        descripcion,
        precio: parseFloat(precio),
        stock: parseInt(stock),
        imagen_url: imagenUrl,
        categoria_id: categoriaId || null,
      };

      if (producto) {
        await updateProducto(producto.id, payload);
      } else {
        await addProducto(payload);
      }
      onClose();
    } catch (err) {
      showAlert('Error al guardar producto: ' + err.message, 'Error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Botón Cerrar */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
        >
          <X size={20} />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Package size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {producto ? 'Editar Producto' : 'Registrar Producto'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {producto ? 'Modifica los detalles del producto' : 'Agrega un nuevo producto a tu inventario'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Nombre del Producto *</label>
            <input 
              type="text" 
              required
              placeholder="Ej. Zapatos Nike Air, Camisa Polo Azul"
              value={nombre}
              onChange={(e) => setNombre(formatNameInput(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500/80 transition-all text-xs"
            />
          </div>

          {/* Categoría */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Categoría</label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/80 transition-all text-xs"
            >
              <option value="" className="bg-white dark:bg-slate-900">-- Sin Categoría --</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id} className="bg-white dark:bg-slate-900">
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Precio y Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Precio Venta ($) *</label>
              <input 
                type="number" 
                required
                min="0"
                placeholder="Ej. 120000"
                value={precio}
                onChange={(e) => setPrecio(formatMontoInput(e.target.value))}
                onKeyDown={handleNumberKeyDown}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500/80 transition-all text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Stock / Cantidad *</label>
              <input 
                type="number" 
                required
                min="0"
                placeholder="Ej. 10"
                value={stock}
                onChange={(e) => setStock(formatMontoInput(e.target.value))}
                onKeyDown={handleNumberKeyDown}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500/80 transition-all text-xs"
              />
            </div>
          </div>

          {/* Imagen URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">URL de Imagen (Opcional)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input 
                  type="url" 
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={imagenUrl}
                  onChange={(e) => setImagenUrl(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500/80 transition-all text-xs"
                />
                <ImageIcon className="absolute left-3 top-3 text-slate-400" size={14} />
              </div>
              {imagenUrl && (
                <div className="h-10 w-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0 bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                  <img 
                    src={imagenUrl} 
                    alt="Preview" 
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/40x40?text=Error';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Descripción (Máx. 100 caracteres)</label>
            <textarea 
              placeholder="Detalles sobre tallas, colores o especificaciones del producto..."
              maxLength={100}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500/80 transition-all text-xs h-20 resize-none"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 px-4 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : producto ? 'Guardar Cambios' : 'Registrar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
