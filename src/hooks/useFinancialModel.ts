import { useMemo } from 'react';
import { buildPureFlow } from '@/lib/finance/puroFlow';
import { buildInvestorFlow } from '@/lib/finance/inversionistaFlow';
import { breakeven } from '@/lib/finance/breakeven';
import { runSensitivity } from '@/lib/finance/sensitivity';
import { buildMonthlyFlow, type MonthlyFlowResult } from '@/lib/finance/monthlyFlow';
import { useProjectStore } from '@/store/projectStore';
import type { FinancialResult, CashFlowYear } from '@/lib/finance/types';
import {
  calcularUbicacion, UBICACIONES, TCC, TASA_IMPUESTO, CAPEX,
} from '@/lib/finance/cafeModel';

export interface FinancialModelOutput {
  flujoPuro: FinancialResult;
  flujoInversionista: FinancialResult;
  breakeven: number;
  sensitivity: ReturnType<typeof runSensitivity>;
  flujoMensualPuro?: MonthlyFlowResult;
  flujoMensualInversionista?: MonthlyFlowResult;
  /** True si los KPIs vienen del cafeModel corregido (zona seleccionada) */
  usandoModeloCorregido: boolean;
}

/**
 * Convierte el detalle anual del cafeModel al formato CashFlowYear
 * que consume el resto de la app (FinancialPanel, charts, exporters).
 */
function detalleAcashFlow(
  detalleAnual: ReturnType<typeof calcularUbicacion>['detalleAnual'],
  inversion: number,
  capitalTrabajo: number,
): CashFlowYear[] {
  return detalleAnual.map((d) => ({
    ano: d.ano,
    ingresos: d.ingresos,
    costosVariables: d.cv,
    // Costos fijos del flujo "viejo" agrupa fijos + comisión tarjetas
    // (la app web los muestra agrupados; el Excel los desglosa)
    costosFijos: d.cf + d.comisiones,
    depreciacion: d.depreciacion,
    intereses: 0, // flujo puro, no hay intereses
    utilidadAntesImpuesto: d.ebit,
    impuesto: d.impuesto,
    utilidadNeta: d.utilidadNeta,
    flujoOperacional: d.flujoOper,
    inversion: d.ano === 0 ? -inversion : 0,
    capitalTrabajo: d.ano === 0 ? -capitalTrabajo : 0,
    recuperoCT: d.recuperoKT ?? 0,
    valorResidual: (d.valorResidual ?? 0) + (d.valorTerminal ?? 0),
    prestamoRecibido: 0,
    amortizacionDeuda: 0,
    flujoCajaNeto: d.flujoNeto,
  }));
}

export function useFinancialModel(): FinancialModelOutput {
  const inputs = useProjectStore((s) => s.inputs);
  const selectedLocationId = useProjectStore((s) => s.selectedLocationId);

  return useMemo(() => {
    // Si hay zona pre-evaluada seleccionada → usar el cafeModel corregido
    const ubic = selectedLocationId
      ? UBICACIONES.find((u) => u.id === selectedLocationId)
      : null;

    if (ubic) {
      const base = calcularUbicacion(ubic, 'base');
      const pesimista = calcularUbicacion(ubic, 'pesimista');

      // Construimos un FinancialResult equivalente desde el detalle anual
      const cashFlow = detalleAcashFlow(base.detalleAnual, CAPEX, base.capitalTrabajo);

      // Break-even: aproximamos como combos/día que iguala el EBITDA año 1 a costos fijos
      // (no exacto pero suficiente para visualización; el Excel tiene el cálculo formal)
      const ebitdaPorCombo = (ubic.ticketPromedio - ubic.costoVariableUnitario)
        * (1 - 0.028); // restamos comisión 2.8%
      const cfDiarios = base.costosFijosTotal * 12 / 312;
      const breakevenCombos = Math.round(cfDiarios / Math.max(ebitdaPorCombo, 1));

      // Sensibilidad cualitativa: usamos el modelo viejo sobre los inputs sincronizados
      // (es solo para el panel sensibilidad — el VAN base ya viene del cafeModel)
      const sensInputs = {
        ...inputs,
        ticketPromedio: ubic.ticketPromedio,
        costoVariableUnitario: ubic.costoVariableUnitario,
        combosPorDiaBase: ubic.combosDiaBase,
        tasaCostoCapital: TCC,
        tasaImpuesto: TASA_IMPUESTO,
      };
      const sens = runSensitivity(sensInputs);

      // Para el flujo del inversionista: aproximamos asumiendo deuda 40%
      // y descontando intereses de los flujos del cafeModel
      const fp: FinancialResult = {
        cashFlow,
        van: base.van,
        tir: base.tir,
        payback: base.payback,
        breakeven: breakevenCombos,
      };

      // Inversionista: re-construye con financiamiento sobre la base del cafeModel
      const fi = construirInversionistaDesdeBase(
        base, pesimista, ubic.id, inputs.porcentajeDeuda,
        inputs.tasaBanco, inputs.plazoDeudaAnos
      );

      return {
        flujoPuro: fp,
        flujoInversionista: fi,
        breakeven: breakevenCombos,
        sensitivity: sens,
        usandoModeloCorregido: true,
      };
    }

    // Sin zona seleccionada → modelo libre con inputs editables (comportamiento clásico)
    const fp = buildPureFlow(inputs);
    const fi = buildInvestorFlow(inputs);
    const be = breakeven(inputs);
    const sens = runSensitivity(inputs);
    const flujoMensualPuro = buildMonthlyFlow(inputs, { conDeuda: false });
    const flujoMensualInversionista = buildMonthlyFlow(inputs, { conDeuda: true });

    return {
      flujoPuro: { ...fp, breakeven: be },
      flujoInversionista: { ...fi, breakeven: be },
      breakeven: be,
      sensitivity: sens,
      flujoMensualPuro,
      flujoMensualInversionista,
      usandoModeloCorregido: false,
    };
  }, [inputs, selectedLocationId]);
}

/**
 * Construye el flujo del inversionista cuando se selecciona una zona pre-evaluada.
 * Toma el flujo puro del cafeModel y le suma préstamo + intereses + amortización
 * (con sistema francés). Mantiene el escudo tributario sobre intereses.
 */
function construirInversionistaDesdeBase(
  base: ReturnType<typeof calcularUbicacion>,
  _pesimista: ReturnType<typeof calcularUbicacion>,
  _id: string,
  porcentajeDeuda: number,
  tasaBanco: number,
  plazoAnos: number,
): FinancialResult {
  const inversionTotal = base.inversionTotal;
  const monto = inversionTotal * porcentajeDeuda;
  const i = tasaBanco;
  const n = plazoAnos;
  const cuota = i > 0 ? monto * (i / (1 - Math.pow(1 + i, -n))) : monto / n;

  // Tabla de amortización
  let saldo = monto;
  const tabla: Array<{ intereses: number; amortizacion: number }> = [];
  for (let k = 0; k < n; k += 1) {
    const intAno = saldo * i;
    const amortAno = cuota - intAno;
    tabla.push({ intereses: intAno, amortizacion: amortAno });
    saldo -= amortAno;
  }

  const cashFlow: CashFlowYear[] = base.detalleAnual.map((d) => {
    const tablaAno = d.ano > 0 && d.ano <= n ? tabla[d.ano - 1] : null;
    const intereses = tablaAno?.intereses ?? 0;
    const amortizacion = tablaAno?.amortizacion ?? 0;
    const ebit = d.ebit;
    const uai = ebit - intereses;
    const imp = uai > 0 ? uai * TASA_IMPUESTO : 0;
    const udi = uai - imp;
    const flujoOper = udi + d.depreciacion;

    let flujoNeto = flujoOper - amortizacion;
    if (d.ano === 0) {
      flujoNeto = -inversionTotal + monto;
    } else if (d.ano === base.detalleAnual.length - 1) {
      flujoNeto += (d.recuperoKT ?? 0) + (d.valorResidual ?? 0) + (d.valorTerminal ?? 0);
    }

    return {
      ano: d.ano,
      ingresos: d.ingresos,
      costosVariables: d.cv,
      costosFijos: d.cf + d.comisiones,
      depreciacion: d.depreciacion,
      intereses,
      utilidadAntesImpuesto: uai,
      impuesto: imp,
      utilidadNeta: udi,
      flujoOperacional: flujoOper,
      inversion: d.ano === 0 ? -CAPEX : 0,
      capitalTrabajo: d.ano === 0 ? -base.capitalTrabajo : 0,
      recuperoCT: d.recuperoKT ?? 0,
      valorResidual: (d.valorResidual ?? 0) + (d.valorTerminal ?? 0),
      prestamoRecibido: d.ano === 0 ? monto : 0,
      amortizacionDeuda: amortizacion,
      flujoCajaNeto: flujoNeto,
    };
  });

  // VAN sobre el aporte propio
  const flujos = cashFlow.map((c) => c.flujoCajaNeto);
  const van = flujos.reduce((s, f, idx) => s + f / Math.pow(1 + TCC, idx), 0);

  // TIR
  let r = 0.20;
  for (let it = 0; it < 200; it += 1) {
    let f = 0, df = 0;
    for (let t = 0; t < flujos.length; t += 1) {
      f += flujos[t] / Math.pow(1 + r, t);
      if (t > 0) df -= (t * flujos[t]) / Math.pow(1 + r, t + 1);
    }
    if (Math.abs(f) < 1) break;
    if (df === 0) { r = NaN; break; }
    const nr = r - f / df;
    if (!Number.isFinite(nr) || nr <= -0.99 || nr > 10) { r = NaN; break; }
    r = nr;
  }

  let acc = 0; let payback = Infinity;
  for (let t = 0; t < flujos.length; t += 1) {
    const prev = acc;
    acc += flujos[t];
    if (prev < 0 && acc >= 0) { payback = (t - 1) + (-prev / flujos[t]); break; }
  }

  return {
    cashFlow,
    van: Math.round(van),
    tir: r,
    payback,
    breakeven: 0,
  };
}
