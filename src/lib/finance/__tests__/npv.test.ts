import { describe, it, expect } from 'vitest';
import { npv } from '../npv';

describe('npv', () => {
  it('VAN cero cuando flujos cero', () => {
    expect(npv([0, 0, 0, 0, 0], 0.12)).toBe(0);
  });

  it('VAN igual a la suma cuando tasa es cero', () => {
    expect(npv([-100, 30, 40, 50], 0)).toBe(20);
  });

  // TODO: validar contra slide 12 con valores específicos del PPT del curso
  it('VAN clásico: inversión 1000, flujo 300/año por 5 años, tasa 12%', () => {
    const cf = [-1000, 300, 300, 300, 300, 300];
    const result = npv(cf, 0.12);
    // 300 * (1 - 1.12^-5) / 0.12 = 300 * 3.6047762 = 1081.43 → VAN = 81.43
    expect(result).toBeCloseTo(81.43, 1);
  });

  it('VAN negativo cuando proyecto destruye valor', () => {
    const cf = [-1000, 100, 100, 100];
    expect(npv(cf, 0.15)).toBeLessThan(0);
  });

  it('VAN aumenta cuando baja la tasa', () => {
    const cf = [-500, 200, 200, 200];
    expect(npv(cf, 0.05)).toBeGreaterThan(npv(cf, 0.20));
  });
});
