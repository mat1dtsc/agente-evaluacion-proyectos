import { irr } from './irr';
import { npv } from './npv';
import { payback } from './payback';
import type { CashFlowYear, FinancialResult, ProjectInputs } from './types';

/**
 * Flujo de caja puro (sin financiamiento, 100% capital propio).
 * Estructura clásica del curso:
 *   Ingresos
 * - Costos variables
 * - Costos fijos
 * - Depreciación
 * = UAI
 * - Impuesto (sólo si UAI > 0)
 * = Utilidad neta
 * + Depreciación (no es salida de caja)
 * = Flujo operacional
 * - Inversión inicial (período 0)
 * - Capital de trabajo (período 0)
 * + Recupero CT + Valor residual neto de impuesto (último período)
 * + Valor terminal (perpetuidad creciente, último período)
 * = Flujo de caja neto
 */
export function buildPureFlow(inputs: ProjectInputs): FinancialResult {
  const N = inputs.vidaUtilAnos;
  const depreciacionAnual = inputs.inversionInicial / inputs.depreciacionAnos;

  const cashFlow: CashFlowYear[] = [];

  // Año 0
  cashFlow.push(emptyYear(0, {
    inversion: -inputs.inversionInicial,
    capitalTrabajo: -inputs.capitalTrabajo,
    flujoCajaNeto: -inputs.inversionInicial - inputs.capitalTrabajo,
  }));

  const g = inputs.crecimientoPerpetuidad;
  const Tcc = inputs.tasaCostoCapital;

  // Crédito tributario acumulado (Caso 1 — empresa nueva, RUT independiente).
  // Cuando UAI < 0, no se paga impuesto pero se acumula crédito = tasa × |UAI|.
  // Ese crédito descuenta impuestos futuros hasta agotarse.
  let creditoFiscal = 0;

  for (let t = 1; t <= N; t += 1) {
    const combosAno = inputs.combosPorDiaBase
      * inputs.diasOperacionAno
      * Math.pow(1 + inputs.crecimientoDemanda, t - 1);
    const ingresos = combosAno * inputs.ticketPromedio;
    const costosVariables = combosAno * inputs.costoVariableUnitario;
    const costosFijos = inputs.costosFijosMensuales * 12;
    const depreciacion = t <= inputs.depreciacionAnos ? depreciacionAnual : 0;

    const uai = ingresos - costosVariables - costosFijos - depreciacion;

    // Cálculo de impuesto con crédito acumulado (Caso 1 curso EVP):
    //  · UAI < 0 → no se paga impuesto, se acumula crédito = tasa × |UAI|
    //  · UAI > 0 → impuesto teórico = tasa × UAI; se descuenta del crédito acumulado
    //    hasta agotarlo. Si el crédito > impuesto teórico, no se paga y queda saldo.
    let impuesto = 0;
    if (uai < 0) {
      creditoFiscal += -uai * inputs.tasaImpuesto;
    } else if (uai > 0) {
      const impuestoTeorico = uai * inputs.tasaImpuesto;
      if (creditoFiscal >= impuestoTeorico) {
        creditoFiscal -= impuestoTeorico;
        impuesto = 0;
      } else {
        impuesto = impuestoTeorico - creditoFiscal;
        creditoFiscal = 0;
      }
    }

    const utilidadNeta = uai - impuesto;
    const flujoOperacional = utilidadNeta + depreciacion;

    const esUltimo = t === N;
    const recuperoCT = esUltimo ? inputs.capitalTrabajo : 0;

    const valorResidualNeto = esUltimo
      ? inputs.valorResidual * (1 - inputs.tasaImpuesto)
      : 0;

    // Valor terminal por perpetuidad creciente (Gordon Growth).
    // CORRECCIÓN: la base es SOLO el flujo operacional recurrente (lo que se mantiene
    // si el proyecto continúa indefinidamente). NO incluye recuperoCT ni valorResidual
    // porque son one-time: si el proyecto sigue, NO se recupera el KT ni se venden los
    // activos. Tampoco incluye depreciación más allá del horizonte SII (asumimos 0
    // post-vida-útil; el flujo se vuelve constante = utilidad neta sin depreciación).
    //
    // VT = FlujoOperacionalSteadyState × (1+g) / (Tcc - g)
    //
    // Sólo si 0 < g < Tcc (convergencia). Si g >= Tcc se ignora (la perpetuidad
    // diverge matemáticamente).
    const flujoSteadyState = esUltimo
      ? ingresos - costosVariables - costosFijos
        - (ingresos - costosVariables - costosFijos > 0
            ? (ingresos - costosVariables - costosFijos) * inputs.tasaImpuesto
            : 0)
      : 0;
    const valorTerminal = esUltimo && g > 0 && g < Tcc
      ? flujoSteadyState * (1 + g) / (Tcc - g)
      : 0;

    const flujoCajaNeto = flujoOperacional + recuperoCT + valorResidualNeto + valorTerminal;

    cashFlow.push({
      ano: t,
      ingresos,
      costosVariables,
      costosFijos,
      depreciacion,
      intereses: 0,
      utilidadAntesImpuesto: uai,
      impuesto,
      utilidadNeta,
      flujoOperacional,
      inversion: 0,
      capitalTrabajo: 0,
      recuperoCT,
      valorResidual: valorResidualNeto + valorTerminal,
      prestamoRecibido: 0,
      amortizacionDeuda: 0,
      flujoCajaNeto,
    });
  }

  const flujos = cashFlow.map((y) => y.flujoCajaNeto);
  return {
    cashFlow,
    van: npv(flujos, inputs.tasaCostoCapital),
    tir: irr(flujos),
    payback: payback(flujos),
    breakeven: 0, // se calcula aparte con breakeven()
  };
}

function emptyYear(ano: number, overrides: Partial<CashFlowYear>): CashFlowYear {
  return {
    ano,
    ingresos: 0,
    costosVariables: 0,
    costosFijos: 0,
    depreciacion: 0,
    intereses: 0,
    utilidadAntesImpuesto: 0,
    impuesto: 0,
    utilidadNeta: 0,
    flujoOperacional: 0,
    inversion: 0,
    capitalTrabajo: 0,
    recuperoCT: 0,
    valorResidual: 0,
    prestamoRecibido: 0,
    amortizacionDeuda: 0,
    flujoCajaNeto: 0,
    ...overrides,
  };
}
