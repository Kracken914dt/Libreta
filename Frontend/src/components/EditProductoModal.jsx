import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../hooks/useToast';
import { X, Package, Image as ImageIcon, Coins, Upload } from 'lucide-react';
import {
  formatProductNameInput,
  formatDigitsInput,
  formatMontoInput,
  parseMontoInputValue,
  formatGramosInput,
  isJewelryCategory,
  handleDecimalNumberKeyDown,
  formatDecimalInput,
  parseDecimalValue
} from '../utils/validation';
import { useModalA11y } from '../hooks/useModalA11y';

export default function EditProductoModal({ isOpen, onClose, producto }) {
  const { categorias, addProducto, updateProducto, mode } = useApp();
  const { showToast } = useToast();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  // Jewelry fields (R-joy-4): optional, sent as null when empty
  const [pesoGramos, setPesoGramos] = useState('');
  const [largo, setLargo] = useState('');
  const [costoPorGramo, setCostoPorGramo] = useState('');
  const [precioPorGramo, setPrecioPorGramo] = useState('');
  const [gananciaEstimada, setGananciaEstimada] = useState('');
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const modalRef = useRef(null);
  const { titleId } = useModalA11y({ isOpen, onClose, modalRef });

  useEffect(() => {
    if (producto) {
      setNombre(producto.nombre || '');
      setDescripcion(producto.descripcion || '');
      setPrecio(producto.precio != null ? formatMontoInput(producto.precio) : '');
      setStock(producto.stock !== undefined ? String(producto.stock) : '');
      setImagenUrl(producto.imagen_url || '');
      setCategoriaId(producto.categoria_id || '');
      
      const isJew = producto.peso_gramos != null || producto.precio_por_gramo != null || producto.costo_por_gramo != null;
      setUseCustomPrice(!isJew);

      setPesoGramos(producto.peso_gramos != null ? String(producto.peso_gramos) : '');
      setLargo(producto.largo != null ? String(producto.largo) : '');
      setCostoPorGramo(producto.costo_por_gramo != null ? formatMontoInput(producto.costo_por_gramo) : '');
      setPrecioPorGramo(producto.precio_por_gramo != null ? formatMontoInput(producto.precio_por_gramo) : '');
      setGananciaEstimada(producto.ganancia_estimada != null ? formatMontoInput(producto.ganancia_estimada) : '');
    } else {
      setNombre('');
      setDescripcion('');
      setPrecio('');
      setStock('');
      setImagenUrl('');
      setCategoriaId('');
      setPesoGramos('');
      setLargo('');
      setCostoPorGramo('');
      setPrecioPorGramo('');
      setGananciaEstimada('');
      setUseCustomPrice(false); // Default to jewelry mode
    }
  }, [producto, isOpen]);

  // Cambiar useCustomPrice dinámicamente si cambia la categoría y no hay producto cargado
  useEffect(() => {
    if (!producto && categoriaId) {
      const selectedCategory = categorias.find(c => c.id === categoriaId);
      const isJew = isJewelryCategory(selectedCategory);
      setUseCustomPrice(!isJew);
    }
  }, [categoriaId, categorias, producto]);

  if (!isOpen) return null;

  const selectedCategory = categorias.find(c => c.id === categoriaId);
  const isJewelry = isJewelryCategory(selectedCategory);

  // Live ganancia y precio para joyería
  const parseDecimal = (v) => {
    if (v === '' || v == null) return null;
    const n = parseFloat(String(v));
    return isNaN(n) ? null : n;
  };
  const p = parseDecimal(pesoGramos);
  const c = costoPorGramo ? parseMontoInputValue(costoPorGramo) : null;
  const v = precioPorGramo ? parseMontoInputValue(precioPorGramo) : null;
  
  const calculatedPrecio = (p != null && v != null) ? p * v : null;
  const calculatedGanancia = (p != null && c != null && v != null) ? (v - c) * p : null;

  const formatCurrency = (n) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0
    }).format(n);
  };

  const handleImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast({ type: 'warning', title: 'Archivo inválido', message: 'Solo puedes cargar imágenes.' });
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showToast({ type: 'warning', title: 'Imagen muy pesada', message: 'La imagen debe pesar máximo 3MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setImagenUrl(reader.result);
    };
    reader.onerror = () => {
      showToast({ type: 'error', title: 'Error', message: 'No se pudo leer la imagen seleccionada.' });
    };
    reader.readAsDataURL(file);
  };

  const handleDropImage = (event) => {
    event.preventDefault();
    setIsDraggingImage(false);
    const file = event.dataTransfer?.files?.[0];
    handleImageFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || stock === '') return;

    let finalPrecio = 0;
    let finalGanancia = null;
    let finalPeso = null;
    let finalLargo = null;
    let finalCostoGramo = null;
    let finalPrecioGramo = null;

    const parsedLargo = parseDecimal(largo);

    if (useCustomPrice) {
      if (precio === '') {
        showToast({ type: 'warning', title: 'Precio requerido', message: 'Por favor ingresa el precio de venta.' });
        return;
      }
      finalPrecio = parseMontoInputValue(precio);
      finalGanancia = gananciaEstimada ? parseMontoInputValue(gananciaEstimada) : null;
      finalLargo = parsedLargo;
      finalPeso = parseDecimal(pesoGramos);
      finalCostoGramo = costoPorGramo ? parseMontoInputValue(costoPorGramo) : null;
    } else {
      const parsedPeso = parseDecimal(pesoGramos);
      const parsedCosto = costoPorGramo ? parseMontoInputValue(costoPorGramo) : null;
      const parsedPrecioGramo = precioPorGramo ? parseMontoInputValue(precioPorGramo) : null;

      if (parsedPeso === null || parsedCosto === null || parsedPrecioGramo === null) {
        showToast({ type: 'warning', title: 'Campos requeridos', message: 'Peso, Costo/gramo y Precio/gramo son obligatorios en joyería.' });
        return;
      }

      finalPeso = parsedPeso;
      finalLargo = parsedLargo;
      finalCostoGramo = parsedCosto;
      finalPrecioGramo = parsedPrecioGramo;
      
      finalPrecio = finalPeso * finalPrecioGramo;
      finalGanancia = (finalPrecioGramo - finalCostoGramo) * finalPeso;
    }

    setSubmitting(true);
    try {
      const payload = {
        nombre,
        descripcion,
        precio: finalPrecio,
        stock: parseInt(stock, 10),
        imagen_url: imagenUrl,
        categoria_id: categoriaId || null,
        peso_gramos: finalPeso,
        largo: finalLargo,
        costo_por_gramo: finalCostoGramo,
        precio_por_gramo: finalPrecioGramo,
        ganancia_estimada: finalGanancia,
      };

      if (producto) {
        await updateProducto(producto.id, payload);
      } else {
        await addProducto(payload);
      }
      onClose();
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: 'Error al guardar producto: ' + err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-slide-up max-h-[90vh] overflow-y-auto"
      >
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          aria-label="Cerrar"
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
            <h2 id={titleId} className="text-lg font-bold text-slate-900 dark:text-white">
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
              onChange={(e) => setNombre(formatProductNameInput(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:border-transparent transition-all text-xs"
            />
          </div>


          {/* Categoría */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Categoría</label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:border-transparent transition-all text-xs"
            >
              <option value="" className="bg-white dark:bg-slate-900">-- Sin Categoría --</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id} className="bg-white dark:bg-slate-900">
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle de Precio Personalizado */}
          <div className="flex items-center gap-2 py-2 border-t border-b border-slate-100 dark:border-slate-800/60">
            <input
              type="checkbox"
              id="useCustomPrice"
              checked={useCustomPrice}
              onChange={(e) => setUseCustomPrice(e.target.checked)}
              className="rounded text-violet-650 focus:ring-violet-500 h-4 w-4 bg-slate-50 dark:bg-slate-950/60 border-slate-300 dark:border-slate-800"
            />
            <label htmlFor="useCustomPrice" className="text-xs font-semibold text-slate-700 dark:text-slate-350 cursor-pointer select-none">
              Usar precio de venta personalizado (No calculado por gramos)
            </label>
          </div>

          {/* Precio y Stock Personalizado */}
          {useCustomPrice && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Precio Venta ($) *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="Ej. 120.000"
                    value={precio}
                    onChange={(e) => setPrecio(formatMontoInput(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:border-transparent transition-all text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ganancia ($)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Ej. 45.000"
                    value={gananciaEstimada}
                    onChange={(e) => setGananciaEstimada(formatMontoInput(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:border-transparent transition-all text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Stock / Cantidad *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="Ej. 10"
                    value={stock}
                    onChange={(e) => setStock(formatDigitsInput(e.target.value, 6))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:border-transparent transition-all text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Largo (cm)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Ej. 18"
                    value={largo}
                    onChange={(e) => setLargo(formatDecimalInput(e.target.value))}
                    onKeyDown={handleDecimalNumberKeyDown}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:border-transparent transition-all text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Peso (gr)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Ej. 5.2"
                    value={pesoGramos}
                    onChange={(e) => setPesoGramos(formatDecimalInput(e.target.value))}
                    onKeyDown={handleDecimalNumberKeyDown}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:border-transparent transition-all text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Costo / gr ($)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Ej. 80.000"
                    value={costoPorGramo}
                    onChange={(e) => setCostoPorGramo(formatMontoInput(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:border-transparent transition-all text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Joyería por Defecto */}
          {!useCustomPrice && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Stock / Cantidad *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="Ej. 10"
                    value={stock}
                    onChange={(e) => setStock(formatDigitsInput(e.target.value, 6))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:border-transparent transition-all text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Largo (cm)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Ej. 18"
                    value={largo}
                    onChange={(e) => setLargo(formatDecimalInput(e.target.value))}
                    onKeyDown={handleDecimalNumberKeyDown}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:border-transparent transition-all text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Coins size={11} /> Datos de Joyería
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3">
                  Peso, Costo/gramo y Precio/gramo son obligatorios en este modo (Largo es opcional).
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Peso (gr) *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="Ej. 5.2"
                    value={pesoGramos}
                    onChange={(e) => setPesoGramos(formatDecimalInput(e.target.value))}
                    onKeyDown={handleDecimalNumberKeyDown}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:border-transparent transition-all text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Costo / gr ($) *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="Ej. 80.000"
                    value={costoPorGramo}
                    onChange={(e) => setCostoPorGramo(formatMontoInput(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:border-transparent transition-all text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Precio / gr ($) *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="Ej. 120.000"
                    value={precioPorGramo}
                    onChange={(e) => setPrecioPorGramo(formatMontoInput(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:border-transparent transition-all text-xs"
                  />
                </div>
              </div>

              {/* Valores Calculados */}
              {(calculatedPrecio !== null || calculatedGanancia !== null) && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  {calculatedPrecio !== null && (
                    <div className="flex flex-col p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Precio Venta calculado:</span>
                      <span className="text-sm font-bold text-slate-950 dark:text-white mt-1">
                        {formatCurrency(calculatedPrecio)}
                      </span>
                    </div>
                  )}
                  {calculatedGanancia !== null && (
                    <div className="flex flex-col p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Ganancia estimada:</span>
                      <span className={`text-sm font-bold mt-1 ${calculatedGanancia >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {formatCurrency(calculatedGanancia)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Imagen URL + Dropzone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">URL de Imagen (Opcional)</label>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDraggingImage(true); }}
              onDragLeave={() => setIsDraggingImage(false)}
              onDrop={handleDropImage}
              onClick={() => fileInputRef.current?.click()}
              className={`px-3.5 py-3 border border-dashed rounded-xl cursor-pointer text-xs transition-all ${
                isDraggingImage
                  ? 'border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-300'
                  : 'border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-violet-400'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Upload size={14} />
                <span>Suelta una imagen aquí o haz clic para cargar</span>
              </div>
              <p className="text-[10px] text-center mt-1 opacity-80">PNG, JPG, WEBP (máximo 3MB)</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageFile(e.target.files?.[0])}
            />
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="url"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={imagenUrl}
                  onChange={(e) => setImagenUrl(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:border-transparent transition-all text-xs"
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
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:border-transparent transition-all text-xs h-20 resize-none"
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
