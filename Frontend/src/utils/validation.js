/**
 * Utilidades de validación y limpieza de inputs
 */

// Bloquear e, E, +, -, ., y , en inputs de números (onKeyDown)
export const handleNumberKeyDown = (e) => {
  if (['e', 'E', '+', '-', '.', ','].includes(e.key)) {
    e.preventDefault();
  }
};

// Validar nombres (letras y espacios, max 22 caracteres, sin símbolos ni números)
export const formatNameInput = (val) => {
  // Permitir letras, tildes, ñ y espacios
  const clean = val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
  return clean.slice(0, 22);
};

// Validar sólo dígitos (para cédula y teléfono)
export const formatDigitsInput = (val, maxLen) => {
  const clean = val.replace(/\D/g, '');
  return clean.slice(0, maxLen);
};

// Validar montos razonables (max 99 millones, sin decimales)
export const formatMontoInput = (val) => {
  const clean = val.replace(/\D/g, '');
  if (clean === '') return '';
  const num = parseInt(clean) || 0;
  if (num > 99999999) {
    return '99999999';
  }
  return clean;
};

/**
 * Normaliza entrada libre de gramos/dimensiones a un string canónico
 * con punto decimal y hasta `maxDecimals` decimales redondeados.
 *
 * Comportamiento:
 *  - Acepta tanto "." como "," como separador decimal.
 *  - Descarta todo lo que no sea dígito, punto o coma.
 *  - Si el valor no es parseable, retorna "" (no lanza).
 *  - Strip trailing zeros: "10.000" -> "10", "3.500" -> "3.5".
 *  - En es-CO la coma es separador decimal: "3,500" -> "3.5" (no es miles).
 *  - "0" sólo si el input representa explícitamente 0.
 *
 * Casos de prueba manuales (ejecutar en devTools sin test runner):
 *   formatGramosInput("3.5")             -> "3.5"
 *   formatGramosInput("3,500")           -> "3.5"     (coma = decimal es-CO)
 *   formatGramosInput("3.567", 3)        -> "3.567"
 *   formatGramosInput("3.5678", 3)       -> "3.568"   (rounding)
 *   formatGramosInput("abc")             -> ""        (no throw)
 *   formatGramosInput("10.000")          -> "10"
 *   formatGramosInput("")                -> ""
 */
export const formatGramosInput = (val, maxDecimals = 3) => {
  if (val == null) return '';
  const cleaned = String(val).replace(/[^\d.,]/g, '').replace(',', '.');
  if (cleaned === '' || cleaned === '.') return '';
  const num = parseFloat(cleaned);
  if (isNaN(num)) return '';
  const fixed = num.toFixed(maxDecimals);
  // strip trailing zeros & dangling dot: "10.000" -> "10", "3.500" -> "3.5" (comma as decimal collapses the same way)
  return fixed.replace(/\.?0+$/, '') || '0';
};

/**
 * Formatea un número como monto en es-CO con separador de miles.
 * Sin símbolo de moneda (la UI concatena "$" en el template).
 * - null/undefined/NaN -> "0"
 * - Negativos se formatean con signo
 * - Decimales se redondean al entero más cercano (es-CO no usa centavos en esta app)
 *
 * Ejemplos:
 *   formatMonto(0)            -> "0"
 *   formatMonto(1000)         -> "1.000"
 *   formatMonto(100000)       -> "100.000"
 *   formatMonto(1000000)      -> "1.000.000"
 *   formatMonto(-50000)       -> "-50.000"
 *   formatMonto(null)         -> "0"
 *   formatMonto(undefined)    -> "0"
 */
export const formatMonto = (value) => {
  const num = Math.round(Number(value) || 0);
  return new Intl.NumberFormat('es-CO').format(num);
};

/**
 * Genera un link wa.me listo para <a href>, con mensaje pre-llenado
 * personalizado según si el cliente tiene deuda pendiente.
 *
 * Comportamiento:
 * - Si `telefono` es falsy (null/undefined/""), retorna null (la UI debe
 *   condicionar el render del link).
 * - Acepta teléfonos de 10 dígitos (Colombia) y les antepone el prefijo
 *   país 57. Si ya tiene prefijo o más dígitos, lo deja como está.
 * - Mensaje con deuda: "Hola {nombre}, te saludo de la tienda. Te escribo
 *   para recordarte que tienes un saldo pendiente de ${monto}..."
 * - Mensaje sin deuda: "Hola {nombre}, te saludo de la tienda. ¡Gracias
 *   por tu compra y estar al día!..."
 *
 * Ejemplos:
 *   getWhatsAppLink("3124567890", "María", 50000)
 *     -> "https://wa.me/573124567890?text=Hola%20Mar%C3%ADa%20..."
 *   getWhatsAppLink("+573124567890", "Carlos", 0)
 *     -> "https://wa.me/573124567890?text=...al%20d%C3%ADa..."
 *   getWhatsAppLink(null, "X", 100)   -> null
 *   getWhatsAppLink("",   "X", 100)   -> null
 */
export const getWhatsAppLink = (telefono, nombre, deuda = 0) => {
  if (!telefono) return null;
  const cleanPhone = String(telefono).replace(/\D/g, '');
  if (cleanPhone === '') return null;
  const phoneWithCountry = cleanPhone.length === 10 ? `57${cleanPhone}` : cleanPhone;

  let text = `Hola ${nombre || ''}, te saludo de la tienda. `;
  if (deuda > 0) {
    text += `Te escribo para recordarte que tienes un saldo pendiente de $${formatMonto(deuda)} en tu cuenta. ¡Que tengas un feliz día!`;
  } else {
    text += `¡Gracias por tu compra y estar al día! Que tengas un excelente día.`;
  }

  return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
};

/**
 * Categorías que disparan los campos de joyería (peso, largo, costo/g, precio/g).
 * Comparación case-insensitive contra el nombre. Si el usuario renombra la
 * categoría, debe mantener "Oro", "Plata" o "Bronce" para que la detección siga
 * funcionando — alternativa futura: agregar flag `es_joyeria` a la categoría.
 */
export const JEWELRY_CATEGORY_NAMES = ['oro', 'plata', 'bronce'];

/**
 * Detecta si una categoría es de joyería (peso por gramo aplica).
 * - Acepta `null`/`undefined` (retorna false)
 * - Match case-insensitive contra JEWELRY_CATEGORY_NAMES
 * - Match contra `nombre` (con o sin acentos)
 *
 * @param {{ nombre?: string } | null | undefined} categoria
 * @returns {boolean}
 */
export const isJewelryCategory = (categoria) => {
  if (!categoria || !categoria.nombre) return false;
  const nombre = String(categoria.nombre).toLowerCase().trim();
  return JEWELRY_CATEGORY_NAMES.includes(nombre);
};
