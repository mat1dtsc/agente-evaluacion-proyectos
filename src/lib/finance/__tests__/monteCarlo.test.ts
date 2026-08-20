import { describe, it, expect } from 'vitest';
import { monteCarlo } from '../monteCarlo';
import { defaultInputs } from '@/store/projectStore';

const opts = { iterations: 500, seed: 123 } as const;

describe('monteCarlo', () => {
  it('percentiles ordenados y probabilidad en [0,1]', () => {
    const r = monteCarlo(defaultInputs, opts);
    expect(r.iterations).toBe(500);
    expect(r.vanP5).toBeLessThanOrEqual(r.vanP50);
    expect(r.vanP50).toBeLessThanOrEqual(r.vanP95);
    expect(r.probVanPositivo).toBeGreaterThanOrEqual(0);
    expect(r.probVanPositivo).toBeLessThanOrEqual(1);
  });

  it('el histograma suma exactamente las iteraciones', () => {
    const r = monteCarlo(defaultInputs, opts);
    expect(r.histogram.reduce((s, h) => s + h.count, 0)).toBe(500);
  });

  it('es reproducible con la misma semilla', () => {
    const a = monteCarlo(defaultInputs, opts);
    const b = monteCarlo(defaultInputs, opts);
    expect(a.vanMedia).toBe(b.vanMedia);
    expect(a.probVanPositivo).toBe(b.probVanPositivo);
  });

  it('semillas distintas producen resultados distintos', () => {
    const a = monteCarlo(defaultInputs, { iterations: 500, seed: 1 });
    const b = monteCarlo(defaultInputs, { iterations: 500, seed: 2 });
    expect(a.vanMedia).not.toBe(b.vanMedia);
  });
});
