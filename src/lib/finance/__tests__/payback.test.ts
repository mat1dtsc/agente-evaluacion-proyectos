import { describe, it, expect } from 'vitest';
import { payback } from '../payback';

describe('payback', () => {
  it('Payback exacto en año 3 cuando inversión 300 y flujos 100/año', () => {
    expect(payback([-300, 100, 100, 100, 100])).toBe(3);
  });

  it('Payback con interpolación dentro del año', () => {
    // -1000, 400, 400, 400, 400 → al final año 2 acumulado = -200; en año 3 entra 400
    // payback = 2 + 200/400 = 2.5
    expect(payback([-1000, 400, 400, 400, 400])).toBeCloseTo(2.5, 5);
  });

  it('Payback infinito cuando proyecto no se recupera', () => {
    expect(payback([-1000, 100, 100])).toBe(Number.POSITIVE_INFINITY);
  });

  it('Payback en año 1 si flujo cubre la inversión', () => {
    expect(payback([-100, 200])).toBeCloseTo(0.5, 5);
  });
});
