/**
 * Utilidades puras del plan de cuotas y clasificación de pagos.
 *
 * Módulo SIN React y SIN I/O: todos los cálculos son sobre números enteros
 * (los montos ya son enteros en COP) y devuelven siempre datos serializables.
 *
 * Conceptos:
 *  - `construirCuotas` arma la lista de cuotas: las primeras N-1 llevan el
 *    monto fijo y la ÚLTIMA absorbe el remanente. Si el remanente es <= 0 la
 *    última usa el monto de cuota (el acumulado puede sobrepasar el precio,
 *    lo cual es válido por excedentes).
 *  - `calcularEstadoCuotas` aplica los abonos EN ORDEN sobre el acumulado: una
 *    cuota está pagada cuando el acumulado pagado >= acumulado esperado. Así,
 *    lo que falta de una cuota se "suma" a las siguientes y lo que sobra se
 *    "resta" de las siguientes automáticamente.
 *  - `clasificarPago` clasifiica un NUEVO abono contra la fecha de vencimiento
 *    de la cuota objetivo (no contra la fecha de hoy).
 */
import { formatMonto } from './validation';

const MS_POR_DIA = 86400000;

/**
 * Mapea el label de "días de pago sugeridos" de la app a días de frecuencia.
 * Busca con `includes` sobre el label en minúsculas.
 *  - 'semanal' -> 7
 *  - 'quincenal' -> 15
 *  - 'mensual' / '30 días' / '1 mes' / 'fin de mes' -> 30
 *  - default -> 7
 */
export const frecuenciaDiasDesdeLabel = (label) => {
  const l = String(label || '').toLowerCase();
  if (l.includes('semanal')) return 7;
  if (l.includes('quincenal')) return 15;
  if (l.includes('fin de mes')) return 30;
  if (l.includes('mensual') || l.includes('30 días') || l.includes('1 mes')) return 30;
  return 7;
};

/**
 * Construye la lista de cuotas de un plan.
 *
 * @param {Object} params
 * @param {number} params.precioTotal     - Valor total del préstamo (entero)
 * @param {number} params.numeroCuotas    - Cantidad de cuotas (>= 1)
 * @param {number} params.montoCuota      - Monto fijo de cada cuota (entero)
 * @param {number} params.frecuenciaDias  - Días entre cada cuota
 * @param {string} params.primeraFecha    - ISO de la primera cuota (vence)
 * @returns {{ cuotas: Array<{numero:number, fechaISO:string, monto:number}>, numeroCuotas:number, montoCuota:number, frecuenciaDias:number }}
 */
export const construirCuotas = ({ precioTotal, numeroCuotas, montoCuota, frecuenciaDias, primeraFecha }) => {
  const n = Math.max(1, parseInt(numeroCuotas, 10) || 1);
  const mCuota = Math.round(Number(montoCuota) || 0);
  const freq = Math.max(1, parseInt(frecuenciaDias, 10) || 1);
  const precio = Math.max(0, Math.round(Number(precioTotal) || 0));
  const baseMs = new Date(primeraFecha).getTime();

  // La última cuota absorbe el remanente. Si el remanente es <= 0 se usa el
  // monto de cuota: el acumulado puede sobrepasar el precio (excedentes validos).
  const remanente = Math.max(0, precio - mCuota * (n - 1));
  const montoUltima = remanente > 0 ? remanente : mCuota;

  const cuotas = Array.from({ length: n }, (_, idx) => {
    const numero = idx + 1;
    return {
      numero,
      fechaISO: new Date(baseMs + idx * freq * MS_POR_DIA).toISOString(),
      monto: numero === n ? montoUltima : mCuota,
    };
  });

  return { cuotas, numeroCuotas: n, montoCuota: mCuota, frecuenciaDias: freq };
};

/** Devuelve el mismo día a medianoche UTC (compara sólo y-m-d). */
const aMedianocheUTC = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

/** Diferencia entera (positiva) de días entre dos fechas. */
const diasEntre = (a, b) => Math.round(Math.abs(aMedianocheUTC(a).getTime() - aMedianocheUTC(b).getTime()) / MS_POR_DIA);

/**
 * Calcula el estado de cumplimiento de las cuotas de un préstamo.
 *
 * @param {Object} params
 * @param {object} params.prestamo       - { precio_total, plan_cuotas }
 * @param {object[]} params.abonos       - Abonos del préstamo (fecha_abono)
 * @returns {Object}
 */
export const calcularEstadoCuotas = ({ prestamo, abonos = [] }) => {
  if (!prestamo || !prestamo.plan_cuotas || typeof prestamo.plan_cuotas !== 'object') {
    return { activo: false };
  }

  const plan = prestamo.plan_cuotas;
  const precioTotal = Math.round(Number(prestamo.precio_total) || 0);
  const n = parseInt(plan.numero_cuotas, 10);
  const mCuota = Math.round(Number(plan.monto_cuota) || 0);
  const freq = parseInt(plan.frecuencia_dias, 10);

  if (!n || n < 1 || !(mCuota > 0) || !freq || freq < 1 || !plan.primera_fecha) {
    return { activo: false };
  }

  const { cuotas } = construirCuotas({
    precioTotal,
    numeroCuotas: n,
    montoCuota: mCuota,
    frecuenciaDias: freq,
    primeraFecha: plan.primera_fecha,
  });

  // Ordenamos asc por fecha: el acumulado se aplica en orden cronológico.
  const abonosOrdenados = [...abonos].sort(
    (a, b) => new Date(a.fecha_abono || a.fecha || 0) - new Date(b.fecha_abono || b.fecha || 0)
  );
  const totalAbonado = abonosOrdenados.reduce((sum, a) => sum + (Math.round(Number(a.monto)) || 0), 0);

  let acumuladoEsperado = 0;
  const cuotasEstado = cuotas.map((c) => {
    acumuladoEsperado += c.monto;
    const pagadoHasta = totalAbonado;
    return {
      ...c,
      acumuladoEsperado,
      pagadoHasta,
      saldo: Math.max(0, acumuladoEsperado - pagadoHasta),
      completada: pagadoHasta >= acumuladoEsperado,
    };
  });

  const primeraNoCompletada = cuotasEstado.find((c) => !c.completada);
  const cuotaActual = primeraNoCompletada
    ? {
        numero: primeraNoCompletada.numero,
        fechaISO: primeraNoCompletada.fechaISO,
        monto: primeraNoCompletada.monto,
        saldo: primeraNoCompletada.saldo,
      }
    : null;

  return {
    activo: true,
    cuotas: cuotasEstado,
    cuotaActual,
    saldo: Math.max(0, precioTotal - totalAbonado),
    numeroCuotas: n,
    montoCuota: mCuota,
    frecuenciaDias: freq,
    primeraFecha: plan.primera_fecha,
    todasPagadas: Boolean(cuotaActual) === false,
  };
};

/**
 * Clasificacion extendida para la UI (badges compartidos).
 */
export const TIPO_PAGO_LABEL = {
  adelanto: 'Adelanto',
  a_tiempo: 'A tiempo',
  atrasado: 'Atrasado',
};

export const TIPO_PAGO_CHIP_CLASS = {
  adelanto: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  a_tiempo: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  atrasado: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
};

/**
 * Clasifica un NUEVO abono (no incluido todavía en `abonos`).
 *
 * @param {Object} params
 * @param {object} params.prestamo   - { precio_total, plan_cuotas }
 * @param {object[]} [params.abonos] - Abonos previos del préstamo
 * @param {number} params.monto      - Monto del nuevo abono (entero)
 * @param {string} params.fechaAbono  - ISO/fecha del nuevo abono
 * @returns {object}
 */
export const clasificarPago = ({ prestamo = {}, abonos = [], monto = 0, fechaAbono }) => {
  const estado = calcularEstadoCuotas({ prestamo, abonos });
  if (!estado.activo) return { aplicable: false };

  const montoNum = Math.round(Number(monto) || 0);
  let cuotaObjetivo = estado.cuotaActual;
  // Si todas las cuotas están pagadas, se compara contra la última (excedente).
  if (!cuotaObjetivo) {
    cuotaObjetivo = estado.cuotas[estado.cuotas.length - 1] || null;
  }
  if (!cuotaObjetivo) return { aplicable: false };

  const necesita = cuotaObjetivo.saldo;
  const fechaVenc = new Date(cuotaObjetivo.fechaISO);
  const llegada = fechaAbono ? new Date(fechaAbono) : new Date();

  const msVenc = aMedianocheUTC(fechaVenc).getTime();
  const msLlegada = aMedianocheUTC(llegada).getTime();
  let tipoPago = 'a_tiempo';
  if (msLlegada < msVenc) tipoPago = 'adelanto';
  else if (msLlegada > msVenc) tipoPago = 'atrasado';

  const diasDiferencia = diasEntre(fechaVenc, llegada);
  const faltante = Math.max(0, necesita - montoNum);
  const excedente = Math.max(0, montoNum - necesita);

  const tipoLabel =
    tipoPago === 'adelanto'
      ? 'Adelanto'
      : tipoPago === 'atrasado'
        ? `Atrasado (${diasDiferencia} días)`
        : 'A tiempo';

  let resumen = `Cuota #${cuotaObjetivo.numero} · ${tipoLabel}`;
  if (faltante > 0) {
    resumen += ` · Faltan $${formatMonto(faltante)} (se suman a las siguientes)`;
  } else if (excedente > 0) {
    resumen += ` · Excedente $${formatMonto(excedente)} (se resta de las siguientes)`;
  } else {
    resumen += ` $${formatMonto(montoNum)} OK`;
  }

  return {
    aplicable: true,
    cuotaNumero: cuotaObjetivo.numero,
    tipoPago,
    diasDiferencia,
    faltante,
    excedente,
    necesita,
    resumen,
  };
};