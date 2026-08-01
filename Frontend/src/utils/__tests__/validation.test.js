import { describe, it, expect } from 'vitest';
import {
  formatGramosInput,
  formatMonto,
  getWhatsAppLink,
  isJewelryCategory,
  JEWELRY_CATEGORY_NAMES,
  formatMontoInput,
  parseMontoInputValue,
  formatDigitsInput,
  formatNameInput,
  formatProductNameInput,
  handleNumberKeyDown,
  getNextPaymentDate,
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
    expect(formatMontoInput('12345')).toBe('12.345');
  });

  it('normaliza caracteres y devuelve formato es-CO', () => {
    expect(formatMontoInput('1.234,50')).toBe('123.450');
  });

  it('cappea a 99999999', () => {
    expect(formatMontoInput('100000000')).toBe('99.999.999');
  });

  it('devuelve "" para string vacío', () => {
    expect(formatMontoInput('')).toBe('');
  });
});

describe('parseMontoInputValue', () => {
  it('convierte string con separadores a número', () => {
    expect(parseMontoInputValue('120.000')).toBe(120000);
  });

  it('maneja input vacío', () => {
    expect(parseMontoInputValue('')).toBe(0);
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

describe('formatProductNameInput', () => {
  it('acepta letras, números y espacios', () => {
    expect(formatProductNameInput('Anillo Oro 18K')).toBe('Anillo Oro 18K');
  });

  it('elimina símbolos', () => {
    expect(formatProductNameInput('Cadena #1 @promo!')).toBe('Cadena 1 promo');
  });

  it('trunca a 40 caracteres', () => {
    const long = 'a'.repeat(60);
    expect(formatProductNameInput(long).length).toBe(40);
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

describe('isJewelryCategory', () => {
  it('detecta Oro, Plata, Bronce case-insensitive', () => {
    expect(isJewelryCategory({ nombre: 'Oro' })).toBe(true);
    expect(isJewelryCategory({ nombre: 'Plata' })).toBe(true);
    expect(isJewelryCategory({ nombre: 'Bronce' })).toBe(true);
    expect(isJewelryCategory({ nombre: 'oro' })).toBe(true);
    expect(isJewelryCategory({ nombre: 'ORO' })).toBe(true);
    expect(isJewelryCategory({ nombre: '  Plata  ' })).toBe(true); // trim
  });

  it('rechaza categorías no-joyería', () => {
    expect(isJewelryCategory({ nombre: 'Ropa' })).toBe(false);
    expect(isJewelryCategory({ nombre: 'Calzado' })).toBe(false);
    expect(isJewelryCategory({ nombre: 'Anillos' })).toBe(false); // similar pero no exacto
    expect(isJewelryCategory({ nombre: '' })).toBe(false);
  });

  it('maneja null/undefined/object sin nombre', () => {
    expect(isJewelryCategory(null)).toBe(false);
    expect(isJewelryCategory(undefined)).toBe(false);
    expect(isJewelryCategory({})).toBe(false);
    expect(isJewelryCategory({ id: 'cat1' })).toBe(false);
  });

  it('la constante JEWELRY_CATEGORY_NAMES está exportada y tiene los 3 valores esperados', () => {
    expect(JEWELRY_CATEGORY_NAMES).toEqual(['oro', 'plata', 'bronce']);
  });
});

describe('getNextPaymentDate', () => {
  it('calcula semanal con día explícito', () => {
    const next = getNextPaymentDate({
      fechaPrestamo: '2026-08-01T10:00:00.000Z',
      diasPagoSugeridos: 'Semanal (Viernes)',
      abonos: [],
    });
    expect(next).not.toBeNull();
  });

  it('calcula mensual', () => {
    const next = getNextPaymentDate({
      fechaPrestamo: '2026-08-01T10:00:00.000Z',
      diasPagoSugeridos: 'Mensual',
      abonos: [],
    });
    expect(next).not.toBeNull();
  });
});
