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
  const escenarioActivo = useProjectStore((s) => s.escenarioActivo);

  return useMemo(() => {
    // Si hay zona pre-evaluada seleccionada → usar el cafeModel corregido
    const ubic = selectedLocationId
      ? UBICACIONES.find((u) => u.id === selectedLocationId)
      : null;

    if (ubic) {
      const base = calcularUbicacion(ubic, 'base', escenarioActivo);
      const pesimista = calcularUbicacion(ubic, 'pesimista', escenarioActivo);

      // Construimos un FinancialResult equivalente desde el detalle anual
      const cashFlow = detalleAcashFlow(base.detalleAnual, CAPEX, base.capitalTrabajo);

      // Break-even REAL: búsqueda binaria sobre combos/día que hace VAN = 0
      const breakevenCombos = (() => {
        let lo = 1, hi = ubic.combosDiaBase * 3;
        if (calcularUbicacion({ ...ubic, combosDiaBase: hi }, 'base', escenarioActivo).van < 0) return Infinity;
        for (let i = 0; i < 40; i += 1) {
          const mid = (lo + hi) / 2;
          const v = calcularUbicacion({ ...ubic, combosDiaBase: mid }, 'base', escenarioActivo).van;
          if (Math.abs(v) < 100_000) return Math.round(mid);
          if (v > 0) hi = mid; else lo = mid;
        }
        return Math.round((lo + hi) / 2);
      })();

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
  }, [inputs, selectedLocationId, escenarioActivo]);
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

  // Construye el cashflow del inversionista con crédito fiscal acumulado
  // (Caso 1 nueva empresa) — coherente con el modelo puro del cafeModel
  let creditoFiscal = 0;
  const cashFlow: CashFlowYear[] = base.detalleAnual.map((d) => {
    const tablaAno = d.ano > 0 && d.ano <= n ? tabla[d.ano - 1] : null;
    const intereses = tablaAno?.intereses ?? 0;
    const amortizacion = tablaAno?.amortizacion ?? 0;
    const uai = d.ebit - intereses;

    let imp = 0;
    if (uai < 0) {
      // Pérdida → acumula crédito fiscal para años futuros
      creditoFiscal += -uai * TASA_IMPUESTO;
    } else if (uai > 0) {
      const teorico = uai * TASA_IMPUESTO;
      if (creditoFiscal >= teorico) { creditoFiscal -= teorico; imp = 0; }
      else { imp = teorico - creditoFiscal; creditoFiscal = 0; }
    }
    const udi = uai - imp;
    const flujoOper = udi + d.depreciacion;

    let flujoNeto: number;
    if (d.ano === 0) {
      // Año 0: salida = inversión total, entrada = préstamo
      flujoNeto = -inversionTotal + monto;
    } else {
      flujoNeto = flujoOper - amortizacion;
      if (d.ano === base.detalleAnual.length - 1) {
        flujoNeto += (d.recuperoKT ?? 0) + (d.valorResidual ?? 0) + (d.valorTerminal ?? 0);
      }
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

  // TIR robusta (mismas protecciones que cafeModel.calcularTIR):
  //   - Si suma de flujos es negativa, no existe TIR real positiva
  //   - Si no hay cambio de signo, no existe TIR
  //   - Si Newton-Raphson no converge en 200 iter, devolver NaN
  const tir = (() => {
    const sum = flujos.reduce((s, v) => s + v, 0);
    if (sum < 0) return NaN;
    let cambios = 0;
    for (let i = 1; i < flujos.length; i += 1) {
      if (Math.sign(flujos[i]) !== Math.sign(flujos[i - 1]) && flujos[i] !== 0) cambios += 1;
    }
    if (cambios === 0) return NaN;

    let r = 0.20;
    for (let it = 0; it < 200; it += 1) {
      let f = 0, df = 0;
      for (let t = 0; t < flujos.length; t += 1) {
        f += flujos[t] / Math.pow(1 + r, t);
        if (t > 0) df -= (t * flujos[t]) / Math.pow(1 + r, t + 1);
      }
      if (Math.abs(f) < 1) return r;
      if (df === 0) return NaN;
      const nr = r - f / df;
      if (!Number.isFinite(nr) || nr <= -0.99 || nr > 10) return NaN;
      r = nr;
    }
    return NaN;
  })();

  let acc = 0; let payback = Infinity;
  for (let t = 0; t < flujos.length; t += 1) {
    const prev = acc;
    acc += flujos[t];
    if (prev < 0 && acc >= 0) { payback = (t - 1) + (-prev / flujos[t]); break; }
  }

  return {
    cashFlow,
    van: Math.round(van),
    tir,
    payback,
    breakeven: 0,
  };
}
