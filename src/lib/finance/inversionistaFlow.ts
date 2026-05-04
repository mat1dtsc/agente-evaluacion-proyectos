import { amortFrances } from './amortFrances';
import { irr } from './irr';
import { npv } from './npv';
import { payback } from './payback';
import type { CashFlowYear, FinancialResult, ProjectInputs } from './types';

/**
 * Flujo de caja del inversionista (con financiamiento bancario).
 * Diferencias respecto al flujo puro:
 *   - El período 0 considera (Inversión - Préstamo recibido) como salida neta
 *   - Cada año se descuentan intereses ANTES de impuesto (escudo tributario)
 *   - Cada año se descuenta amortización DESPUÉS de impuesto (no es gasto)
 *   - Se descuenta con la tasa de costo del capital propio (Tcc) que el usuario
 *     define en inputs.tasaCostoCapital
 */
export function buildInvestorFlow(inputs: ProjectInputs): FinancialResult {
  const N = inputs.vidaUtilAnos;
  const principal = inputs.inversionInicial * inputs.porcentajeDeuda;
  const tabla = amortFrances(principal, inputs.tasaBanco, inputs.plazoDeudaAnos);
  const depreciacionAnual = inputs.inversionInicial / inputs.depreciacionAnos;

  const g = inputs.crecimientoPerpetuidad;
  const Tcc = inputs.tasaCostoCapital;

  const cashFlow: CashFlowYear[] = [];

  // Año 0
  cashFlow.push({
    ano: 0,
    ingresos: 0,
    costosVariables: 0,
    costosFijos: 0,
    depreciacion: 0,
    intereses: 0,
    utilidadAntesImpuesto: 0,
    impuesto: 0,
    utilidadNeta: 0,
    flujoOperacional: 0,
    inversion: -inputs.inversionInicial,
    capitalTrabajo: -inputs.capitalTrabajo,
    recuperoCT: 0,
    valorResidual: 0,
    prestamoRecibido: principal,
    amortizacionDeuda: 0,
    flujoCajaNeto: -inputs.inversionInicial - inputs.capitalTrabajo + principal,
  });

  for (let t = 1; t <= N; t += 1) {
    const combosAno = inputs.combosPorDiaBase
      * inputs.diasOperacionAno
      * Math.pow(1 + inputs.crecimientoDemanda, t - 1);
    const ingresos = combosAno * inputs.ticketPromedio;
    const costosVariables = combosAno * inputs.costoVariableUnitario;
    const costosFijos = inputs.costosFijosMensuales * 12;
    const depreciacion = t <= inputs.depreciacionAnos ? depreciacionAnual : 0;
    const filaDeuda = tabla[t - 1];
    const intereses = filaDeuda?.intereses ?? 0;
    const amortizacionDeuda = filaDeuda?.amortizacion ?? 0;

    const uai = ingresos - costosVariables - costosFijos - depreciacion - intereses;
    const impuesto = uai > 0 ? uai * inputs.tasaImpuesto : 0;
    const utilidadNeta = uai - impuesto;
    const flujoOperacional = utilidadNeta + depreciacion;

    const esUltimo = t === N;
    const recuperoCT = esUltimo ? inputs.capitalTrabajo : 0;
    const valorResidualNeto = esUltimo
      ? inputs.valorResidual * (1 - inputs.tasaImpuesto)
      : 0;

    // Valor terminal por perpetuidad creciente.
    // CORRECCIÓN: la base es el flujo operacional steady-state asumiendo deuda ya
    // cancelada (porque al final del horizonte el préstamo está pagado). NO incluye
    // recuperoCT, valorResidual ni amortización (one-time). El escudo fiscal de
    // intereses tampoco aplica porque no hay deuda en perpetuidad.
    //
    // VT = FlujoOperacionalSinDeuda × (1+g) / (Tcc - g)
    const uaiSinDeuda = ingresos - costosVariables - costosFijos;
    const flujoSteadyState = esUltimo
      ? uaiSinDeuda - (uaiSinDeuda > 0 ? uaiSinDeuda * inputs.tasaImpuesto : 0)
      : 0;
    const valorTerminal = esUltimo && g > 0 && g < Tcc
      ? flujoSteadyState * (1 + g) / (Tcc - g)
      : 0;

    const fcnSinVT = flujoOperacional + recuperoCT + valorResidualNeto - amortizacionDeuda;
    const flujoCajaNeto = fcnSinVT + valorTerminal;

    cashFlow.push({
      ano: t,
      ingresos,
      costosVariables,
      costosFijos,
      depreciacion,
      intereses,
      utilidadAntesImpuesto: uai,
      impuesto,
      utilidadNeta,
      flujoOperacional,
      inversion: 0,
      capitalTrabajo: 0,
      recuperoCT,
      valorResidual: valorResidualNeto + valorTerminal,
      prestamoRecibido: 0,
      amortizacionDeuda,
      flujoCajaNeto,
    });
  }

  const flujos = cashFlow.map((y) => y.flujoCajaNeto);
  return {
    cashFlow,
    van: npv(flujos, inputs.tasaCostoCapital),
    tir: irr(flujos),
    payback: payback(flujos),
    breakeven: 0,
  };
}
