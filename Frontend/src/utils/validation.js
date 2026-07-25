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
 *  - Strip trailing zeros: "10.000" -> "10", "3.500" -> "3.500".
 *  - "0" sólo si el input representa explícitamente 0.
 *
 * Casos de prueba manuales (ejecutar en devTools sin test runner):
 *   formatGramosInput("3.5")             -> "3.5"
 *   formatGramosInput("3,500")           -> "3.500"
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
  // strip trailing zeros & dangling dot: "10.000" -> "10", "3.500" -> "3.500"
  return fixed.replace(/\.?0+$/, '') || '0';
};
