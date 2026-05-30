import { describe, it, expect } from 'vitest';
import { compareZones } from '../comparison';

describe('compareZones', () => {
  it('devuelve una fila por ubicación (7 zonas RM)', () => {
    expect(compareZones('conservador').length).toBe(7);
  });

  it('ordena por VAN descendente', () => {
    const rows = compareZones('conservador');
    for (let i = 1; i < rows.length; i += 1) {
      expect(rows[i - 1].van).toBeGreaterThanOrEqual(rows[i].van);
    }
  });

  it('marca a lo más una ganadora, y sólo si su VAN > 0', () => {
    const rows = compareZones('conservador');
    const ganadoras = rows.filter((r) => r.esGanadora);
    expect(ganadoras.length).toBeLessThanOrEqual(1);
    if (ganadoras.length === 1) {
      expect(ganadoras[0].van).toBeGreaterThan(0);
      // La ganadora debe ser la primera (mayor VAN)
      expect(rows[0].esGanadora).toBe(true);
    }
  });

  it('ids únicos y score en rango 0-100', () => {
    const rows = compareZones('optimista');
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
    for (const r of rows) {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
    }
  });

  it('el escenario optimista no empeora el VAN de la ganadora vs conservador', () => {
    const cons = compareZones('conservador');
    const opt = compareZones('optimista');
    expect(opt[0].van).toBeGreaterThanOrEqual(cons[0].van);
  });
});
