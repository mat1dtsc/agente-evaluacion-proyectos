import { describe, it, expect } from 'vitest';
import { runSensitivity } from '../sensitivity';
import type { ProjectInputs } from '../types';

const base: ProjectInputs = {
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
  porcentajeDeuda: 0.4,
  tasaBanco: 0.10,
  plazoDeudaAnos: 5,
  depreciacionAnos: 5,
  valorResidual: 0,
  crecimientoPerpetuidad: 0,
};

describe('runSensitivity', () => {
  it('Devuelve resultados ordenados por |impactoVanPuro| desc', () => {
    const r = runSensitivity(base);
    for (let i = 1; i < r.length; i += 1) {
      expect(Math.abs(r[i - 1].impactoVanPuro)).toBeGreaterThanOrEqual(Math.abs(r[i].impactoVanPuro));
    }
  });

  it('Genera variables × deltas resultados', () => {
    const r = runSensitivity(base, ['precio', 'demanda'], [-0.1, 0.1]);
    expect(r).toHaveLength(4);
  });

  it('Subir el precio mejora el VAN (impacto positivo)', () => {
    const r = runSensitivity(base, ['precio'], [0.1]);
    expect(r[0].impactoVanPuro).toBeGreaterThan(0);
  });

  it('Subir el costo insumo empeora el VAN (impacto negativo)', () => {
    const r = runSensitivity(base, ['costoInsumo'], [0.1]);
    expect(r[0].impactoVanPuro).toBeLessThan(0);
  });

  it('Tasa banco no afecta VAN puro (sólo inversionista)', () => {
    const r = runSensitivity(base, ['tasaBanco'], [0.2]);
    expect(r[0].impactoVanPuro).toBeCloseTo(0, 5);
    expect(Math.abs(r[0].impactoVanInv)).toBeGreaterThan(0);
  });
});
