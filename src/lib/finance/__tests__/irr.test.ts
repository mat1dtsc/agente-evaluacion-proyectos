import { describe, it, expect } from 'vitest';
import { irr } from '../irr';
import { npv } from '../npv';

describe('irr', () => {
  // TODO: validar contra slide 13 con valores específicos del PPT del curso
  it('TIR clásica: -1000 + 300×5 ≈ 15.24%', () => {
    const cf = [-1000, 300, 300, 300, 300, 300];
    const r = irr(cf);
    expect(r).toBeCloseTo(0.1524, 3);
    // Coherencia: VAN(TIR) ≈ 0
    expect(npv(cf, r)).toBeCloseTo(0, 3);
  });

  it('TIR positiva con flujos crecientes', () => {
    const cf = [-1000, 200, 300, 400, 500];
    const r = irr(cf);
    expect(r).toBeGreaterThan(0);
    expect(npv(cf, r)).toBeCloseTo(0, 3);
  });

  it('TIR = tasa cuando VAN es cero a esa tasa', () => {
    // Construyo flujos cuyo VAN al 10% es 0
    const r0 = 0.1;
    const cf = [-1000, 1100]; // VAN(0.1) = -1000 + 1100/1.1 = 0
    expect(irr(cf)).toBeCloseTo(r0, 4);
  });

  it('Devuelve NaN cuando todos los flujos son positivos', () => {
    expect(Number.isNaN(irr([100, 200, 300]))).toBe(true);
  });

  it('Devuelve NaN cuando todos los flujos son negativos', () => {
    expect(Number.isNaN(irr([-100, -200, -300]))).toBe(true);
  });
});
