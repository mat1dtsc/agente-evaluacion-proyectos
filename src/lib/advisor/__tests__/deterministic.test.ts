import { describe, it, expect } from 'vitest';
import { deterministicAdvisory } from '../deterministic';
import type { AdvisorContext } from '../types';

const base: AdvisorContext = {
  proyecto: 'Café Test',
  ubicacion: { label: 'X', lat: -33.4, lng: -70.6 },
  scoreGeo: { total: 82, densidad: 80, ingreso: 80, transporte: 80, competencia: 90, equipamiento: 70 },
  finanzas: { vanPuro: 50_000_000, tirPuro: 0.30, paybackPuro: 3, vanInv: 60_000_000, tirInv: 0.35, breakevenCombosDia: 60, tcc: 0.14 },
  competencia: { totalCafes: 6 },
  demanda: { combosDiaBase: 120, ticket: 4000 },
  sensibilidadTop: [
    { variable: 'demanda', impactoVan: 30_000_000 },
    { variable: 'precio', impactoVan: 25_000_000 },
    { variable: 'arriendo', impactoVan: -10_000_000 },
    { variable: 'sueldo', impactoVan: -8_000_000 },
  ],
  escenario: 'conservador',
};

describe('deterministicAdvisory', () => {
  it('caso fuerte → Recomendado, con fortalezas y fuente "reglas"', () => {
    const r = deterministicAdvisory(base);
    expect(r.veredicto).toBe('Recomendado');
    expect(r.fuente).toBe('reglas');
    expect(r.fortalezas.length).toBeGreaterThan(0);
    expect(r.resumen).toContain('Café Test');
  });

  it('VAN negativo → No conviene, con un riesgo sobre el VAN', () => {
    const r = deterministicAdvisory({
      ...base,
      finanzas: { ...base.finanzas, vanPuro: -20_000_000, tirPuro: 0.05 },
    });
    expect(r.veredicto).toBe('No conviene');
    expect(r.riesgos.join(' ')).toMatch(/VAN/i);
  });

  it('drivers: top 3 ordenados por impacto absoluto', () => {
    const r = deterministicAdvisory(base);
    expect(r.drivers.length).toBe(3);
    expect(r.drivers[0]).toMatch(/demanda/i);
  });

  it('VAN>0 y TIR>Tcc pero payback largo / score bajo → Aceptable con riesgo', () => {
    const r = deterministicAdvisory({
      ...base,
      scoreGeo: { ...base.scoreGeo!, total: 55 },
      finanzas: { ...base.finanzas, paybackPuro: 4.8 },
    });
    expect(r.veredicto).toBe('Aceptable con riesgo');
  });

  it('siempre entrega al menos una fortaleza y un riesgo', () => {
    const r = deterministicAdvisory(base);
    expect(r.fortalezas.length).toBeGreaterThan(0);
    expect(r.riesgos.length).toBeGreaterThan(0);
  });
});
