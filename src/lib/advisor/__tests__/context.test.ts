import { describe, it, expect } from 'vitest';
import { buildAdvisorContext } from '../context';
import type { FinancialModelOutput } from '@/hooks/useFinancialModel';
import type { FinancialResult } from '@/lib/finance/types';

const fr = (van: number, tir: number, payback: number): FinancialResult => ({
  cashFlow: [],
  van,
  tir,
  payback,
  breakeven: 60,
});

const model: FinancialModelOutput = {
  flujoPuro: fr(50_000_000, 0.3, 3),
  flujoInversionista: fr(60_000_000, 0.35, 2.8),
  breakeven: 60,
  sensitivity: [
    { variable: 'demanda', delta: 0.1, vanPuro: 80_000_000, vanInversionista: 90_000_000, impactoVanPuro: 30_000_000, impactoVanInv: 30_000_000 },
    { variable: 'precio', delta: 0.1, vanPuro: 75_000_000, vanInversionista: 85_000_000, impactoVanPuro: 25_000_000, impactoVanInv: 25_000_000 },
  ],
  usandoModeloCorregido: true,
};

describe('buildAdvisorContext', () => {
  it('arma un contexto bien formado desde las salidas de los hooks', () => {
    const ctx = buildAdvisorContext({
      proyecto: 'Café X',
      location: { lat: -33.4, lng: -70.6, label: 'El Golf' },
      comuna: 'Las Condes',
      score: { total: 80, densidad: 70, ingreso: 90, transporte: 80, competencia: 85, equipamiento: 60 },
      model,
      tcc: 0.14,
      cafes: 6,
      combosDiaBase: 120,
      ticket: 4500,
      escenario: 'conservador',
    });

    expect(ctx.proyecto).toBe('Café X');
    expect(ctx.ubicacion?.comuna).toBe('Las Condes');
    expect(ctx.finanzas.vanPuro).toBe(50_000_000);
    expect(ctx.finanzas.tcc).toBe(0.14);
    expect(ctx.competencia?.totalCafes).toBe(6);
    expect(ctx.sensibilidadTop).toHaveLength(2);
    expect(ctx.sensibilidadTop[0]).toEqual({ variable: 'demanda', impactoVan: 30_000_000 });
  });

  it('tolera ausencia de ubicación y score (modelo libre)', () => {
    const ctx = buildAdvisorContext({
      proyecto: 'Libre',
      location: null,
      score: null,
      model,
      tcc: 0.14,
      cafes: null,
      combosDiaBase: 90,
      ticket: 3800,
      escenario: 'intermedio',
    });
    expect(ctx.ubicacion).toBeNull();
    expect(ctx.scoreGeo).toBeNull();
    expect(ctx.competencia).toBeNull();
  });
});
