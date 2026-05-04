import { describe, it, expect } from 'vitest';
import { breakeven } from '../breakeven';
import { buildPureFlow } from '../puroFlow';
import type { ProjectInputs } from '../types';

const base: ProjectInputs = {
  inversionInicial: 30_000_000,
  capitalTrabajo: 4_000_000,
  vidaUtilAnos: 5,
  combosPorDiaBase: 80,
  diasOperacionAno: 360,
  crecimientoDemanda: 0,
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

describe('breakeven', () => {
  it('VAN al breakeven es ≈ 0', () => {
    const combos = breakeven(base);
    const r = buildPureFlow({ ...base, combosPorDiaBase: combos });
    expect(Math.abs(r.van)).toBeLessThan(50_000); // tolerancia razonable en CLP
  });

  it('Es positivo y finito para proyecto realista', () => {
    const combos = breakeven(base);
    expect(combos).toBeGreaterThan(0);
    expect(Number.isFinite(combos)).toBe(true);
  });

  it('Sube si suben los costos fijos', () => {
    const masFijos: ProjectInputs = { ...base, costosFijosMensuales: 5_000_000 };
    expect(breakeven(masFijos)).toBeGreaterThan(breakeven(base));
  });

  it('Baja si sube el ticket promedio', () => {
    const masTicket: ProjectInputs = { ...base, ticketPromedio: 4500 };
    expect(breakeven(masTicket)).toBeLessThan(breakeven(base));
  });
});
