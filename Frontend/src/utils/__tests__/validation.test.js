import { describe, it, expect } from 'vitest';
import {
  formatGramosInput,
  formatMonto,
  getWhatsAppLink,
  formatMontoInput,
  formatDigitsInput,
  formatNameInput,
  handleNumberKeyDown,
} from '../validation';

describe('formatGramosInput', () => {
  it('acepta punto como separador decimal', () => {
    expect(formatGramosInput('3.5')).toBe('3.5');
  });

  it('interpreta coma como decimal es-CO', () => {
    expect(formatGramosInput('3,500')).toBe('3.5');
  });

  it('preserva hasta maxDecimals', () => {
    expect(formatGramosInput('3.567', 3)).toBe('3.567');
  });

  it('redondea si excede maxDecimals', () => {
    expect(formatGramosInput('3.5678', 3)).toBe('3.568');
  });

  it('devuelve "" para input no parseable', () => {
    expect(formatGramosInput('abc')).toBe('');
  });

  it('hace strip de trailing zeros', () => {
    expect(formatGramosInput('10.000')).toBe('10');
  });

  it('devuelve "" para string vacío', () => {
    expect(formatGramosInput('')).toBe('');
  });

  it('maneja null y undefined', () => {
    expect(formatGramosInput(null)).toBe('');
    expect(formatGramosInput(undefined)).toBe('');
  });
});

describe('formatMonto', () => {
  it('formatea 0 como "0"', () => {
    expect(formatMonto(0)).toBe('0');
  });

  it('agrega separador de miles para miles', () => {
    expect(formatMonto(1000)).toBe('1.000');
  });

  it('formatea cientos de miles', () => {
    expect(formatMonto(100000)).toBe('100.000');
  });

  it('formatea millones', () => {
    expect(formatMonto(1000000)).toBe('1.000.000');
  });

  it('formatea números negativos con signo', () => {
    expect(formatMonto(-50000)).toBe('-50.000');
  });

  it('devuelve "0" para null/undefined/NaN', () => {
    expect(formatMonto(null)).toBe('0');
    expect(formatMonto(undefined)).toBe('0');
    expect(formatMonto(NaN)).toBe('0');
  });

  it('redondea decimales al entero más cercano', () => {
    expect(formatMonto(1234.7)).toBe('1.235');
    expect(formatMonto(1234.4)).toBe('1.234');
  });
});

describe('getWhatsAppLink', () => {
  it('agrega prefijo 57 a teléfonos colombianos de 10 dígitos', () => {
    const link = getWhatsAppLink('3124567890', 'María', 50000);
    expect(link).toContain('wa.me/573124567890');
  });

  it('no duplica prefijo si el teléfono ya lo tiene', () => {
    const link = getWhatsAppLink('573124567890', 'Carlos', 0);
    expect(link).toContain('wa.me/573124567890');
    expect(link).not.toContain('wa.me/57573');
  });

  it('incluye el monto en el mensaje cuando hay deuda', () => {
    const link = getWhatsAppLink('3124567890', 'María', 50000);
    // El monto formateado aparece en el texto
    const match = link.match(/text=([^&]+)/);
    expect(match).not.toBeNull();
    const decoded = decodeURIComponent(match[1]);
    expect(decoded).toContain('50.000');
    expect(decoded).toContain('pendiente');
  });

  it('incluye mensaje de "al día" cuando deuda es 0', () => {
    const link = getWhatsAppLink('3124567890', 'Carlos', 0);
    const match = link.match(/text=([^&]+)/);
    expect(match).not.toBeNull();
    const decoded = decodeURIComponent(match[1]);
    expect(decoded).toContain('al día');
    expect(decoded).not.toContain('pendiente');
  });

  it('incluye el nombre del cliente en el mensaje', () => {
    const link = getWhatsAppLink('3124567890', 'María José', 10000);
    const match = link.match(/text=([^&]+)/);
    expect(match).not.toBeNull();
    const decoded = decodeURIComponent(match[1]);
    expect(decoded).toContain('María José');
  });

  it('retorna null si el teléfono es null/undefined/empty', () => {
    expect(getWhatsAppLink(null, 'X', 100)).toBeNull();
    expect(getWhatsAppLink(undefined, 'X', 100)).toBeNull();
    expect(getWhatsAppLink('', 'X', 100)).toBeNull();
  });

  it('retorna null si el teléfono sólo tiene caracteres no numéricos', () => {
    expect(getWhatsAppLink('abc-def', 'X', 100)).toBeNull();
  });

  it('URL-encoda correctamente tildes y caracteres especiales', () => {
    const link = getWhatsAppLink('3124567890', 'María José Ñoño', 10000);
    expect(link).toContain(encodeURIComponent('María José Ñoño').split('María')[0]); // %C3%AD
  });
});

describe('formatMontoInput (existente, regression)', () => {
  it('acepta sólo dígitos', () => {
    expect(formatMontoInput('12345')).toBe('12345');
  });

  it('elimina caracteres no numéricos', () => {
    expect(formatMontoInput('1.234,50')).toBe('123450');
  });

  it('cappea a 99999999', () => {
    expect(formatMontoInput('100000000')).toBe('99999999');
  });

  it('devuelve "" para string vacío', () => {
    expect(formatMontoInput('')).toBe('');
  });
});

describe('formatDigitsInput (existente, regression)', () => {
  it('acepta sólo dígitos hasta maxLen', () => {
    expect(formatDigitsInput('1234567890', 10)).toBe('1234567890');
  });

  it('trunca a maxLen', () => {
    expect(formatDigitsInput('12345678901', 10)).toBe('1234567890');
  });

  it('elimina caracteres no numéricos', () => {
    expect(formatDigitsInput('12-34-56', 10)).toBe('123456');
  });
});

describe('formatNameInput (existente, regression)', () => {
  it('acepta letras, tildes y espacios', () => {
    expect(formatNameInput('María José')).toBe('María José');
  });

  it('elimina números y símbolos', () => {
    expect(formatNameInput('Juan123!@#')).toBe('Juan');
  });

  it('trunca a 22 caracteres', () => {
    const long = 'a'.repeat(30);
    expect(formatNameInput(long).length).toBe(22);
  });
});

describe('handleNumberKeyDown (existente, regression)', () => {
  it('previene default para teclas no permitidas', () => {
    const preventDefault = vi.fn();
    ['e', 'E', '+', '-', '.', ','].forEach(key => {
      handleNumberKeyDown({ key, preventDefault });
    });
    expect(preventDefault).toHaveBeenCalledTimes(6);
  });

  it('no previene default para dígitos y backspace', () => {
    const preventDefault = vi.fn();
    ['0', '1', '2', 'Backspace'].forEach(key => {
      handleNumberKeyDown({ key, preventDefault });
    });
    expect(preventDefault).not.toHaveBeenCalled();
  });
});
