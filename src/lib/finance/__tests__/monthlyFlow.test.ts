import { describe, it, expect } from 'vitest';
import { buildMonthlyFlow } from '../monthlyFlow';
import { buildPureFlow } from '../puroFlow';
import type { ProjectInputs } from '../types';

const baseInputs: ProjectInputs = {
  inversionInicial: 30_000_000,
  capitalTrabajo: 4_000_000,
  vidaUtilAnos: 5,
  combosPorDiaBase: 80,
  diasOperacionAno: 360,
  crecimientoDemanda: 0.05,
  ticketPromedio: 3500,
  costoVariableUnitario: 900,
  costosFijosMensuales: 3_500_000,
  tasaImpuesto: 0.27,
  tasaCostoCapital: 0.12,
  porcentajeDeuda: 0,
  tasaBanco: 0.10,
  plazoDeudaAnos: 5,
  depreciacionAnos: 5,
  valorResidual: 0,
  crecimientoPerpetuidad: 0,
};

describe('buildMonthlyFlow', () => {
  it('Genera 61 períodos (mes 0 + 60 meses operativos)', () => {
    const r = buildMonthlyFlow(baseInputs);
    expect(r.cashFlowMonthly).toHaveLength(61);
    expect(r.cashFlowMonthly[0].mes).toBe(0);
    expect(r.cashFlowMonthly[60].mes).toBe(60);
  });

  it('Tasa mensual equivalente a la anual', () => {
    const r = buildMonthlyFlow(baseInputs);
    const reconstructedAnnual = Math.pow(1 + r.tasaMensual, 12) - 1;
    expect(reconstructedAnnual).toBeCloseTo(baseInputs.tasaCostoCapital, 4);
  });

  it('Ingresos del año 1 (suma 12 meses) coherente con cálculo anual', () => {
    const r = buildMonthlyFlow(baseInputs);
    const ingresosAnuales = r.cashFlowMonthly
      .filter((m) => m.ano === 1)
      .reduce((s, m) => s + m.ingresos, 0);
    const expected = baseInputs.combosPorDiaBase * baseInputs.diasOperacionAno * baseInputs.ticketPromedio;
    expect(ingresosAnuales).toBeCloseTo(expected, 0);
  });

  it('Agregación anual coherente con flujo puro tradicional (caso sin personal/normativos)', () => {
    const monthly = buildMonthlyFlow(baseInputs);
    const annual = buildPureFlow(baseInputs);

    // Año 1 ingresos deben coincidir entre las dos vistas
    const m1 = monthly.cashFlowYearly.find((y) => y.ano === 1)!;
    const a1 = annual.cashFlow.find((y) => y.ano === 1)!;
    expect(m1.ingresos).toBeCloseTo(a1.ingresos, -2); // tolerancia de 100 CLP por redondeo
  });

  it('Recupera capital de trabajo en último mes', () => {
    const r = buildMonthlyFlow(baseInputs);
    const ultimo = r.cashFlowMonthly[r.cashFlowMonthly.length - 1];
    expect(ultimo.recuperoCT).toBe(baseInputs.capitalTrabajo);
  });

  it('Pro PYME: usa 25% en lugar de 27%', () => {
    const conPyme: ProjectInputs = { ...baseInputs, proPyme: true };
    const sinPyme: ProjectInputs = { ...baseInputs, proPyme: false };
    const r1 = buildMonthlyFlow(conPyme);
    const r2 = buildMonthlyFlow(sinPyme);
    // El flujo con Pro PYME debe pagar menos impuesto (más utilidad neta)
    const utilPyme = r1.cashFlowMonthly[12].utilidadNeta;
    const utilGral = r2.cashFlowMonthly[12].utilidadNeta;
    expect(utilPyme).toBeGreaterThan(utilGral);
  });
});
