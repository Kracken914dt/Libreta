import { describe, it, expect } from 'vitest';
import {
  frecuenciaDiasDesdeLabel,
  construirCuotas,
  calcularEstadoCuotas,
  clasificarPago,
} from '../planCuotas';

const PRESTAMO = {
  precio_total: 150000,
  plan_cuotas: {
    numero_cuotas: 3,
    monto_cuota: 50000,
    frecuencia_dias: 30,
    primera_fecha: '2025-01-01T00:00:00.000Z',
  },
};

const VENC_CUOTA_1 = '2025-01-01T00:00:00.000Z'; // venc de la cuota 1

describe('frecuenciaDiasDesdeLabel', () => {
  it('mapea labels a días de frecuencia', () => {
    expect(frecuenciaDiasDesdeLabel('Semanal (Viernes)')).toBe(7);
    expect(frecuenciaDiasDesdeLabel('Quincenal (15 y 30)')).toBe(15);
    expect(frecuenciaDiasDesdeLabel('Mensual')).toBe(30);
    expect(frecuenciaDiasDesdeLabel('30 días')).toBe(30);
    expect(frecuenciaDiasDesdeLabel('Fin de mes')).toBe(30);
    expect(frecuenciaDiasDesdeLabel('')).toBe(7);
  });
});

describe('construirCuotas', () => {
  it('montos iguales cuando el total se divide exacto', () => {
    const r = construirCuotas({
      precioTotal: 150000,
      numeroCuotas: 3,
      montoCuota: 50000,
      frecuenciaDias: 30,
      primeraFecha: '2025-01-01T00:00:00.000Z',
    });
    expect(r.cuotas.map((c) => c.monto)).toEqual([50000, 50000, 50000]);
    expect(r.numeroCuotas).toBe(3);
    // Las fechas avanzan 30 días por cuota
    expect(r.cuotas[1].fechaISO).toBe('2025-01-31T00:00:00.000Z');
  });

  it('la última cuota absorbe el remanente', () => {
    const r = construirCuotas({
      precioTotal: 200003,
      numeroCuotas: 3,
      montoCuota: 66668,
      frecuenciaDias: 30,
      primeraFecha: '2025-01-01T00:00:00.000Z',
    });
    expect(r.cuotas.map((c) => c.monto)).toEqual([66668, 66668, 66667]);
    expect(r.cuotas.reduce((s, c) => s + c.monto, 0)).toBe(200003);
  });
});

describe('clasificarPago', () => {
  it('inactivo si el préstamo no tiene plan', () => {
    expect(clasificarPago({ prestamo: { precio_total: 100 }, abonos: [], monto: 50, fechaAbono: '2025-01-01' })).toEqual({ aplicable: false });
  });

  it('a_tiempo en la fecha exacta sin faltante ni excedente', () => {
    const r = clasificarPago({
      prestamo: PRESTAMO,
      abonos: [],
      monto: 50000,
      fechaAbono: VENC_CUOTA_1,
    });
    expect(r).toMatchObject({ aplicable: true, cuotaNumero: 1, tipoPago: 'a_tiempo', faltante: 0, excedente: 0, necesita: 50000 });
    expect(r.resumen).toContain('A tiempo');
    expect(r.resumen).toContain('$50.000 OK');
  });

  it('adelanto cuando el pago llega antes del vencimiento', () => {
    const r = clasificarPago({
      prestamo: PRESTAMO,
      abonos: [],
      monto: 50000,
      fechaAbono: '2024-12-30T00:00:00.000Z',
    });
    expect(r.tipoPago).toBe('adelanto');
    expect(r.diasDiferencia).toBe(2);
    expect(r.resumen).toContain('Adelanto');
  });

  it('atrasado cuando el pago llega después del vencimiento', () => {
    const r = clasificarPago({
      prestamo: PRESTAMO,
      abonos: [],
      monto: 50000,
      fechaAbono: '2025-01-10T00:00:00.000Z',
    });
    expect(r.tipoPago).toBe('atrasado');
    expect(r.diasDiferencia).toBe(9);
    expect(r.resumen).toContain('Atrasado (9 días)');
  });

  it('pago parcial el día del vencimiento -> faltante > 0 y excedente === 0', () => {
    const r = clasificarPago({
      prestamo: PRESTAMO,
      abonos: [],
      monto: 30000,
      fechaAbono: VENC_CUOTA_1,
    });
    expect(r.tipoPago).toBe('a_tiempo');
    expect(r.faltante).toBe(20000);
    expect(r.excedente).toBe(0);
    expect(r.resumen).toContain('Faltan $20.000');
  });

  it('pago mayor que la cuota -> excedente > 0 y faltante === 0', () => {
    const r = clasificarPago({
      prestamo: PRESTAMO,
      abonos: [],
      monto: 70000,
      fechaAbono: VENC_CUOTA_1,
    });
    expect(r.faltante).toBe(0);
    expect(r.excedente).toBe(20000);
    expect(r.resumen).toContain('Excedente $20.000');
  });
});

describe('calcularEstadoCuotas', () => {
  it('activo: false si no hay plan', () => {
    expect(calcularEstadoCuotas({ prestamo: { precio_total: 100 }, abonos: [] })).toEqual({ activo: false });
  });

  it('tras un pago parcial la cuota actual sigue siendo 1 con el resto pendiente', () => {
    const st = calcularEstadoCuotas({
      prestamo: PRESTAMO,
      abonos: [{ monto: 30000, fecha_abono: '2025-01-01T00:00:00.000Z' }],
    });
    expect(st.activo).toBe(true);
    expect(st.cuotaActual).toMatchObject({ numero: 1, saldo: 20000 });
    expect(st.saldo).toBe(120000);
  });

  it('cuotaActual salta a la 3 cuando el excedente resta de las siguientes', () => {
    const st = calcularEstadoCuotas({
      prestamo: PRESTAMO,
      abonos: [
        { monto: 30000, fecha_abono: '2025-01-01T00:00:00.000Z' },
        { monto: 70000, fecha_abono: '2025-01-15T00:00:00.000Z' },
      ],
    });
    // 30000 -> cuota 1 (falta 20000); 70000 -> cubre cuota 1 y cuota 2 (50000)
    expect(st.cuotaActual.numero).toBe(3);
    expect(st.cuotas[0].completada).toBe(true);
    expect(st.cuotas[1].completada).toBe(true);
    expect(st.cuotas[2].completada).toBe(false);
    expect(st.cuotaActual.saldo).toBe(50000);
  });

  it('todas las cuotas pagadas -> cuotaActual null', () => {
    const st = calcularEstadoCuotas({
      prestamo: PRESTAMO,
      abonos: [{ monto: 150000, fecha_abono: '2025-01-01T00:00:00.000Z' }],
    });
    expect(st.cuotaActual).toBeNull();
    expect(st.todasPagadas).toBe(true);
  });
});