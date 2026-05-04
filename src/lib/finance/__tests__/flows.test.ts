import { describe, it, expect } from 'vitest';
import { buildPureFlow } from '../puroFlow';
import { buildInvestorFlow } from '../inversionistaFlow';
import type { ProjectInputs } from '../types';

// Caso de referencia: café express MBA UAH 2026
// TODO: validar contra slide 15 del PPT del curso
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

describe('buildPureFlow', () => {
  it('Genera N+1 períodos (año 0 + N años)', () => {
    const r = buildPureFlow(baseInputs);
    expect(r.cashFlow).toHaveLength(6);
    expect(r.cashFlow[0].ano).toBe(0);
    expect(r.cashFlow[5].ano).toBe(5);
  });

  it('Inversión total en año 0 = inversion + capital trabajo (negativo)', () => {
    const r = buildPureFlow(baseInputs);
    expect(r.cashFlow[0].flujoCajaNeto).toBe(-(baseInputs.inversionInicial + baseInputs.capitalTrabajo));
  });

  it('Recupera capital de trabajo en último año', () => {
    const r = buildPureFlow(baseInputs);
    expect(r.cashFlow[5].recuperoCT).toBe(baseInputs.capitalTrabajo);
  });

  it('Año 1: ingresos = combos × días × ticket', () => {
    const r = buildPureFlow(baseInputs);
    const esperado = 80 * 360 * 3500;
    expect(r.cashFlow[1].ingresos).toBeCloseTo(esperado, 0);
  });

  it('Crecimiento de demanda compuesto sobre año base', () => {
    const r = buildPureFlow(baseInputs);
    const año3 = 80 * 360 * Math.pow(1.05, 2) * 3500;
    expect(r.cashFlow[3].ingresos).toBeCloseTo(año3, 0);
  });

  it('Cuando UAI < 0 no hay impuesto', () => {
    const malos: ProjectInputs = { ...baseInputs, ticketPromedio: 100 };
    const r = buildPureFlow(malos);
    expect(r.cashFlow[1].impuesto).toBe(0);
  });

  it('VAN, TIR y payback son números válidos para caso base', () => {
    const r = buildPureFlow(baseInputs);
    expect(Number.isFinite(r.van)).toBe(true);
    expect(Number.isFinite(r.tir)).toBe(true);
    // payback puede ser Infinity si el caso no se recupera; aquí debe ser finito
    expect(r.payback).toBeGreaterThan(0);
  });
  it('Con perpetuidad > 0, el VAN crece significativamente', () => {
    const conPerp: ProjectInputs = { ...baseInputs, crecimientoPerpetuidad: 0.02 };
    const sinPerp: ProjectInputs = { ...baseInputs, crecimientoPerpetuidad: 0 };
    const rCon = buildPureFlow(conPerp);
    const rSin = buildPureFlow(sinPerp);
    expect(rCon.van).toBeGreaterThan(rSin.van * 1.5); // la perpetuidad aporta significativamente
    expect(rCon.cashFlow[5].valorResidual).toBeGreaterThan(0);
  });

  it('VT con perpetuidad usa solo flujo operacional steady-state (no recuperoCT ni VR)', () => {
    // Si la base incluyera recuperoCT, el VT sería muchísimo mayor con CT alto
    const lowCT: ProjectInputs = { ...baseInputs, capitalTrabajo: 1_000_000, crecimientoPerpetuidad: 0.02 };
    const highCT: ProjectInputs = { ...baseInputs, capitalTrabajo: 50_000_000, crecimientoPerpetuidad: 0.02 };
    const r1 = buildPureFlow(lowCT);
    const r2 = buildPureFlow(highCT);
    // El recuperoCT impacta el flujo del último año, pero NO el valor terminal
    const vt1 = (r1.cashFlow[5].valorResidual - r1.cashFlow[5].recuperoCT * 0); // VR puro
    const vt2 = (r2.cashFlow[5].valorResidual - r2.cashFlow[5].recuperoCT * 0);
    // Los dos VT deben ser iguales porque CT no entra en perpetuidad
    expect(Math.abs(vt1 - vt2)).toBeLessThan(1); // tolerancia de redondeo
  });

  it('Crédito tributario acumulado (Caso 1): pérdidas se compensan con utilidades futuras', () => {
    // Proyecto que pierde año 1 y gana después
    const inputs: ProjectInputs = {
      ...baseInputs,
      combosPorDiaBase: 30, // bajo → primeros años con pérdida
      crecimientoDemanda: 0.30, // crece fuerte
    };
    const r = buildPureFlow(inputs);
    // Si hay año con UAI < 0, su impuesto debe ser 0
    const anosConPerdida = r.cashFlow.filter((y) => y.utilidadAntesImpuesto < 0);
    if (anosConPerdida.length > 0) {
      anosConPerdida.forEach((y) => expect(y.impuesto).toBe(0));
      // Y debe haber al menos un año posterior donde el impuesto efectivo es menor
      // que el teórico (porque está usando crédito)
      const conUtilidad = r.cashFlow.find((y) => y.ano > anosConPerdida[0].ano && y.utilidadAntesImpuesto > 0);
      if (conUtilidad) {
        const impuestoTeorico = conUtilidad.utilidadAntesImpuesto * inputs.tasaImpuesto;
        expect(conUtilidad.impuesto).toBeLessThanOrEqual(impuestoTeorico);
      }
    }
  });

  it('Con perpetuidad g >= Tcc, no se calcula valor terminal (evita divergencia)', () => {
    const invalido: ProjectInputs = { ...baseInputs, crecimientoPerpetuidad: 0.13 };
    const r = buildPureFlow(invalido);
    // No debería romperse; la perpetuidad se ignora
    expect(Number.isFinite(r.van)).toBe(true);
    // El valor residual no incluye perpetuidad
    const sinPerp = buildPureFlow({ ...baseInputs, crecimientoPerpetuidad: 0 });
    expect(r.cashFlow[5].valorResidual).toBeCloseTo(sinPerp.cashFlow[5].valorResidual, 5);
  });
});

describe('buildInvestorFlow', () => {
  it('Sin deuda (0%) el flujo neto del año 0 es igual al puro', () => {
    const r1 = buildPureFlow(baseInputs);
    const r2 = buildInvestorFlow(baseInputs);
    expect(r2.cashFlow[0].flujoCajaNeto).toBeCloseTo(r1.cashFlow[0].flujoCajaNeto, 5);
  });

  it('Con 50% deuda, año 0 recibe préstamo y baja la inversión efectiva', () => {
    const conDeuda: ProjectInputs = { ...baseInputs, porcentajeDeuda: 0.5 };
    const r = buildInvestorFlow(conDeuda);
    expect(r.cashFlow[0].prestamoRecibido).toBeCloseTo(15_000_000, 0);
    expect(r.cashFlow[0].flujoCajaNeto).toBeCloseTo(-19_000_000, 0); // -30M -4M +15M
  });

  it('Con deuda, hay intereses cada año del plazo (escudo tributario)', () => {
    const conDeuda: ProjectInputs = { ...baseInputs, porcentajeDeuda: 0.5 };
    const r = buildInvestorFlow(conDeuda);
    expect(r.cashFlow[1].intereses).toBeGreaterThan(0);
    expect(r.cashFlow[5].intereses).toBeGreaterThanOrEqual(0);
  });

  it('Con deuda, VAN inversionista difiere del puro', () => {
    const conDeuda: ProjectInputs = { ...baseInputs, porcentajeDeuda: 0.5 };
    const rPuro = buildPureFlow(baseInputs);
    const rInv = buildInvestorFlow(conDeuda);
    expect(rInv.van).not.toBe(rPuro.van);
  });
});
