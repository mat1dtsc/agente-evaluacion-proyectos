import { planillaMensualEnMes, planillaAnual } from './personal';
import type { ProjectInputs, CashFlowYear } from './types';
import { amortFrances } from './amortFrances';

/**
 * Flujo de caja mensual a 60 períodos (5 años) — respeta la estructura del
 * curso de Evaluación de Proyectos UAH MBA 2026 (Mauricio Zúñiga):
 *
 *   + Ingresos afectos
 *   - Costos variables (insumos)
 *   - Costos fijos no laborales
 *   - Costo de personal (con leyes sociales chilenas)
 *   - Costos normativos recurrentes (prorrateados al mes correspondiente)
 *   - Depreciación (no desembolsable)
 *   - Intereses deuda (solo flujo inversionista)
 *   = UAI
 *   - Impuesto (con régimen Pro PYME 25% o General 27%)
 *   = UDI
 *   + Reversión depreciación
 *   - Inversión (mes 0)
 *   - Capital de trabajo (mes 0)
 *   + Recupero CT + Valor residual neto (último mes)
 *   + Préstamo (mes 0) - Amortización capital deuda (cuotas mensuales)
 *   = Flujo neto de caja
 */

export interface CashFlowMonth {
  mes: number;
  ano: number;       // 1..5
  mesEnAno: number;  // 1..12
  ingresos: number;
  costosVariables: number;
  costosFijosNoLaborales: number;
  costoPersonal: number;
  costosNormativos: number;
  depreciacion: number;
  intereses: number;
  utilidadAntesImpuesto: number;
  impuesto: number;
  utilidadNeta: number;
  flujoOperacional: number;
  inversion: number;
  capitalTrabajo: number;
  recuperoCT: number;
  valorResidual: number;
  prestamoRecibido: number;
  amortizacionDeuda: number;
  flujoCajaNeto: number;
}

export interface MonthlyFlowResult {
  cashFlowMonthly: CashFlowMonth[];
  cashFlowYearly: CashFlowYear[];
  /** Tasa mensual equivalente a la tasa de costo de capital anual */
  tasaMensual: number;
}

const monthlyRate = (annualRate: number): number => Math.pow(1 + annualRate, 1 / 12) - 1;

const aggregateToYearly = (monthly: CashFlowMonth[]): CashFlowYear[] => {
  const N = Math.max(...monthly.map((m) => m.ano));
  const yearly: CashFlowYear[] = [];

  // Año 0: solo el mes 0 (inversión inicial)
  const m0 = monthly.find((m) => m.mes === 0);
  if (m0) {
    yearly.push({
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
      inversion: m0.inversion,
      capitalTrabajo: m0.capitalTrabajo,
      recuperoCT: 0,
      valorResidual: 0,
      prestamoRecibido: m0.prestamoRecibido,
      amortizacionDeuda: 0,
      flujoCajaNeto: m0.flujoCajaNeto,
    });
  }

  for (let a = 1; a <= N; a += 1) {
    const meses = monthly.filter((m) => m.ano === a);
    const sum = (k: keyof CashFlowMonth) => meses.reduce((s, x) => s + (x[k] as number), 0);
    yearly.push({
      ano: a,
      ingresos: sum('ingresos'),
      costosVariables: sum('costosVariables'),
      costosFijos: sum('costosFijosNoLaborales') + sum('costoPersonal') + sum('costosNormativos'),
      depreciacion: sum('depreciacion'),
      intereses: sum('intereses'),
      utilidadAntesImpuesto: sum('utilidadAntesImpuesto'),
      impuesto: sum('impuesto'),
      utilidadNeta: sum('utilidadNeta'),
      flujoOperacional: sum('flujoOperacional'),
      inversion: sum('inversion'),
      capitalTrabajo: sum('capitalTrabajo'),
      recuperoCT: sum('recuperoCT'),
      valorResidual: sum('valorResidual'),
      prestamoRecibido: sum('prestamoRecibido'),
      amortizacionDeuda: sum('amortizacionDeuda'),
      flujoCajaNeto: sum('flujoCajaNeto'),
    });
  }
  return yearly;
};

export function buildMonthlyFlow(inputs: ProjectInputs, options: { conDeuda?: boolean } = {}): MonthlyFlowResult {
  const conDeuda = options.conDeuda ?? false;
  const N = inputs.vidaUtilAnos;
  const totalMeses = N * 12;
  const tasaMensual = monthlyRate(inputs.tasaCostoCapital);
  const tasaImpuesto = inputs.proPyme ? 0.25 : inputs.tasaImpuesto;

  // Depreciación lineal mensual
  const depMensual = (inputs.inversionInicial / inputs.depreciacionAnos) / 12;

  // Tabla de amortización mensual (francesa) si hay deuda
  const principal = conDeuda ? inputs.inversionInicial * inputs.porcentajeDeuda : 0;
  const tasaBancoMensual = monthlyRate(inputs.tasaBanco);
  const plazoDeudaMeses = inputs.plazoDeudaAnos * 12;
  const tablaDeuda = principal > 0
    ? amortFrances(principal, tasaBancoMensual, plazoDeudaMeses)
    : [];

  // Costos normativos: prorrateamos los anuales en 12 cuotas mensuales
  const costosNormativosMensual = (inputs.costosNormativosAnuales ?? 0) / 12;

  const months: CashFlowMonth[] = [];

  // ---- Mes 0 (inversión + capital de trabajo + permisos iniciales + préstamo) ----
  months.push({
    mes: 0, ano: 0, mesEnAno: 0,
    ingresos: 0, costosVariables: 0, costosFijosNoLaborales: 0,
    costoPersonal: 0, costosNormativos: 0,
    depreciacion: 0, intereses: 0,
    utilidadAntesImpuesto: 0, impuesto: 0, utilidadNeta: 0, flujoOperacional: 0,
    inversion: -(inputs.inversionInicial + (inputs.costosNormativosIniciales ?? 0)),
    capitalTrabajo: -inputs.capitalTrabajo,
    recuperoCT: 0, valorResidual: 0,
    prestamoRecibido: principal,
    amortizacionDeuda: 0,
    flujoCajaNeto: -(inputs.inversionInicial + (inputs.costosNormativosIniciales ?? 0)) - inputs.capitalTrabajo + principal,
  });

  // ---- Meses operativos 1..60 ----
  for (let mes = 1; mes <= totalMeses; mes += 1) {
    const ano = Math.ceil(mes / 12);
    const mesEnAno = ((mes - 1) % 12) + 1;

    // Demanda crece anualmente — el mes específico hereda la demanda del año
    const factorCrecimiento = Math.pow(1 + inputs.crecimientoDemanda, ano - 1);
    const combosMes = inputs.combosPorDiaBase * (inputs.diasOperacionAno / 12) * factorCrecimiento;
    const ingresos = combosMes * inputs.ticketPromedio;
    const costosVariables = combosMes * inputs.costoVariableUnitario;

    // Costo personal: usa planillaMensualEnMes si hay personal definido,
    // si no, usa costosFijosMensuales como aproximación
    const costoPersonal = (inputs.personal && inputs.personal.length > 0)
      ? planillaMensualEnMes(inputs.personal, mes)
      : 0;
    const costosFijosNoLaborales = inputs.costosFijosNoLaboralesMensuales ?? inputs.costosFijosMensuales ?? 0;

    const fijosTotales = (inputs.personal && inputs.personal.length > 0)
      ? costosFijosNoLaborales + costoPersonal
      : inputs.costosFijosMensuales; // fallback compat

    const _costosFijosNoLaboralesEffectivos = (inputs.personal && inputs.personal.length > 0)
      ? costosFijosNoLaborales
      : inputs.costosFijosMensuales - 0;
    const _costoPersonalEffectivo = (inputs.personal && inputs.personal.length > 0) ? costoPersonal : 0;

    const depreciacion = mes <= inputs.depreciacionAnos * 12 ? depMensual : 0;
    const filaDeuda = tablaDeuda[mes - 1];
    const intereses = filaDeuda?.intereses ?? 0;
    const amortizacionCapital = filaDeuda?.amortizacion ?? 0;

    const uai = ingresos - costosVariables - fijosTotales - costosNormativosMensual - depreciacion - intereses;
    const impuesto = uai > 0 ? uai * tasaImpuesto : 0;
    const utilidadNeta = uai - impuesto;
    const flujoOperacional = utilidadNeta + depreciacion;

    const esUltimo = mes === totalMeses;
    const recuperoCT = esUltimo ? inputs.capitalTrabajo : 0;
    const valorResidualNeto = esUltimo
      ? inputs.valorResidual * (1 - tasaImpuesto)
      : 0;

    const flujoCajaNeto = flujoOperacional + recuperoCT + valorResidualNeto - amortizacionCapital;

    months.push({
      mes, ano, mesEnAno,
      ingresos, costosVariables,
      costosFijosNoLaborales: _costosFijosNoLaboralesEffectivos,
      costoPersonal: _costoPersonalEffectivo,
      costosNormativos: costosNormativosMensual,
      depreciacion, intereses,
      utilidadAntesImpuesto: uai, impuesto, utilidadNeta, flujoOperacional,
      inversion: 0, capitalTrabajo: 0,
      recuperoCT, valorResidual: valorResidualNeto,
      prestamoRecibido: 0,
      amortizacionDeuda: amortizacionCapital,
      flujoCajaNeto,
    });
  }

  return {
    cashFlowMonthly: months,
    cashFlowYearly: aggregateToYearly(months),
    tasaMensual,
  };
}

/** Total de planilla anualizado del primer año, útil para resumen */
export function planillaAnualSummary(inputs: ProjectInputs): number {
  if (!inputs.personal) return 0;
  return planillaAnual(inputs.personal);
}
