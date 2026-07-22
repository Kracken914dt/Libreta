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
