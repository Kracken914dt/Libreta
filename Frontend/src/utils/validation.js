/**
 * Utilidades de validación y limpieza de inputs
 */

// Bloquear e, E, +, -, ., y , en inputs de números (onKeyDown)
export const handleNumberKeyDown = (e) => {
  if (['e', 'E', '+', '-', '.', ','].includes(e.key)) {
    e.preventDefault();
  }
};

// Bloquear e, E, + y - en inputs decimales, pero permitir punto y coma (onKeyDown)
export const handleDecimalNumberKeyDown = (e) => {
  if (['e', 'E', '+', '-'].includes(e.key)) {
    e.preventDefault();
  }
};

// Formatear la entrada de texto para admitir decimales (permite punto/coma y dígitos)
export const formatDecimalInput = (val) => {
  if (val == null) return '';
  // Permitir dígitos, puntos y comas
  let clean = String(val).replace(/[^\d.,]/g, '');
  // Convertir comas a puntos para homogeneizar decimales en JS
  clean = clean.replace(',', '.');
  // Asegurar que solo haya un punto decimal
  const parts = clean.split('.');
  if (parts.length > 2) {
    clean = parts[0] + '.' + parts.slice(1).join('');
  }
  return clean;
};

// Convierte un string decimal a un número flotante válido, o null si está vacío/inválido
export const parseDecimalValue = (val) => {
  if (val === '' || val == null) return null;
  const num = parseFloat(String(val));
  return isNaN(num) ? null : num;
};

// Validar nombres (letras y espacios, max 22 caracteres, sin símbolos ni números)
export const formatNameInput = (val) => {
  // Permitir letras, tildes, ñ y espacios
  const clean = val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
  return clean.slice(0, 22);
};

// Nombre de producto: permite letras, números y espacios (sin símbolos)
export const formatProductNameInput = (val) => {
  const clean = val.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '');
  return clean.slice(0, 40);
};

// Validar sólo dígitos (para cédula y teléfono)
export const formatDigitsInput = (val, maxLen) => {
  const clean = val.replace(/\D/g, '');
  return clean.slice(0, maxLen);
};

// Validar montos razonables (max 99 millones, sin decimales)
export const formatMontoInput = (val) => {
  const clean = String(val || '').replace(/\D/g, '');
  if (clean === '') return '';
  const num = parseInt(clean) || 0;
  const limited = Math.min(num, 99999999);
  return new Intl.NumberFormat('es-CO').format(limited);
};

// Convierte montos de inputs ("120.000") a número (120000)
export const parseMontoInputValue = (val) => {
  const clean = String(val || '').replace(/\D/g, '');
  if (clean === '') return 0;
  return parseInt(clean, 10) || 0;
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

  let text = `*La Libreta Digital*\n`;
  text += `Hola *${nombre || ''}*, te saludamos atentamente.\n\n`;

  if (deuda > 0) {
    text += `Te escribimos para recordarte tu estado de cuenta actual:\n`;
    text += `*Saldo Pendiente:* $${formatMonto(deuda)}\n\n`;
    text += `Agradecemos tu atención. Si tienes alguna inquietud o ya realizaste tu pago, con gusto te atendemos por este medio. Muchas gracias.`;
  } else {
    text += `*Estado de cuenta:* Te encuentras al día con todos tus pagos.\n`;
    text += `Muchas gracias por tu excelente cumplimiento y confianza.`;
  }

  return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
};

export const getWhatsAppAbonoLink = (telefono, nombre, montoAbonado, nuevoSaldo) => {
  if (!telefono) return null;
  const cleanPhone = String(telefono).replace(/\D/g, '');
  if (cleanPhone === '') return null;
  const phoneWithCountry = cleanPhone.length === 10 ? `57${cleanPhone}` : cleanPhone;

  let text = `*La Libreta Digital*\n`;
  text += `Hola *${nombre || ''}*\n\n`;
  text += `*Comprobante de Abono Registrado*\n`;
  text += `*Monto Abonado:* $${formatMonto(montoAbonado)}\n`;
  
  if (nuevoSaldo > 0) {
    text += `*Nuevo Saldo Pendiente:* $${formatMonto(nuevoSaldo)}\n\n`;
    text += `Muchas gracias por tu abono.`;
  } else {
    text += `*Tu cuenta ha quedado totalmente cancelada ($0).*\n\n`;
    text += `Muchas gracias por tu preferencia y pago puntual.`;
  }

  return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
};

export const getWhatsAppPrestamoLink = (telefono, nombre, producto, precioTotal) => {
  if (!telefono) return null;
  const cleanPhone = String(telefono).replace(/\D/g, '');
  if (cleanPhone === '') return null;
  const phoneWithCountry = cleanPhone.length === 10 ? `57${cleanPhone}` : cleanPhone;

  let text = `*La Libreta Digital*\n`;
  text += `Hola *${nombre || ''}*\n\n`;
  text += `*Comprobante de Fiado / Préstamo*\n`;
  text += `*Detalle:* ${producto}\n`;
  text += `*Valor Total:* $${formatMonto(precioTotal)}\n\n`;
  text += `Muchas gracias por tu compra y confianza.`;

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

const addDays = (baseDate, days) => {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + days);
  return d;
};

const toLastDayOfMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0).getDate();

export const getNextPaymentDate = ({ fechaPrestamo, diasPagoSugeridos, abonos = [] }) => {
  if (!fechaPrestamo || !diasPagoSugeridos) return null;
  const baseDate = new Date(fechaPrestamo);
  if (isNaN(baseDate.getTime())) return null;

  const latestAbono = abonos
    .map(a => new Date(a.fecha_abono || a.fecha))
    .filter(d => !isNaN(d.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const anchor = latestAbono && latestAbono > baseDate ? latestAbono : baseDate;
  const label = String(diasPagoSugeridos).toLowerCase();

  if (label.includes('15 días')) return addDays(anchor, 15);
  if (label.includes('30 días') || label.includes('1 mes')) return addDays(anchor, 30);

  if (label.includes('semanal')) {
    const weekdayMap = {
      lunes: 1, martes: 2, 'miércoles': 3, miercoles: 3, jueves: 4, viernes: 5, sábado: 6, sabado: 6, domingo: 0
    };
    const found = Object.entries(weekdayMap).find(([k]) => label.includes(k));
    if (!found) return addDays(anchor, 7);
    const targetDay = found[1];
    const currentDay = anchor.getDay();
    let diff = targetDay - currentDay;
    if (diff <= 0) diff += 7;
    return addDays(anchor, diff);
  }

  if (label.includes('quincenal')) {
    const y = anchor.getFullYear();
    const m = anchor.getMonth();
    const d = anchor.getDate();
    const lastDay = toLastDayOfMonth(y, m);
    if (d < 15) return new Date(y, m, 15, anchor.getHours(), anchor.getMinutes());
    if (d < 30) return new Date(y, m, Math.min(30, lastDay), anchor.getHours(), anchor.getMinutes());
    const nextMonth = m + 1;
    return new Date(y, nextMonth, 15, anchor.getHours(), anchor.getMinutes());
  }

  if (label.includes('mensual')) {
    const y = anchor.getFullYear();
    const nextM = anchor.getMonth() + 1;
    const day = Math.min(anchor.getDate(), toLastDayOfMonth(y + Math.floor(nextM / 12), nextM % 12));
    return new Date(y, nextM, day, anchor.getHours(), anchor.getMinutes());
  }

  if (label.includes('fin de mes')) {
    const y = anchor.getFullYear();
    const m = anchor.getMonth();
    const lastDay = toLastDayOfMonth(y, m);
    if (anchor.getDate() < lastDay) {
      return new Date(y, m, lastDay, anchor.getHours(), anchor.getMinutes());
    }
    const nextM = m + 1;
    const nextLast = toLastDayOfMonth(y + Math.floor(nextM / 12), nextM % 12);
    return new Date(y, nextM, nextLast, anchor.getHours(), anchor.getMinutes());
  }

  return null;
};
