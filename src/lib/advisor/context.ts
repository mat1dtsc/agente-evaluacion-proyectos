/**
 * Ensamblado del `AdvisorContext` a partir de las salidas de los hooks.
 *
 * Es una función PURA: el panel le pasa los datos ya calculados (store +
 * useFinancialModel + computeScore + OSM), de modo que se puede testear sin
 * montar React ni hooks.
 */

import type { AdvisorContext } from './types';
import type { FinancialModelOutput } from '@/hooks/useFinancialModel';
import type { ScoreBreakdown } from '@/lib/score';

export interface BuildAdvisorArgs {
  proyecto: string;
  location: { lat: number; lng: number; label?: string } | null;
  comuna?: string;
  score: ScoreBreakdown | null;
  model: FinancialModelOutput;
  tcc: number;
  cafes: number | null;
  combosDiaBase: number;
  ticket: number;
  escenario: string;
}

export function buildAdvisorContext(a: BuildAdvisorArgs): AdvisorContext {
  return {
    proyecto: a.proyecto,
    ubicacion: a.location
      ? {
          label: a.location.label ?? `${a.location.lat.toFixed(4)}, ${a.location.lng.toFixed(4)}`,
          comuna: a.comuna,
          lat: a.location.lat,
          lng: a.location.lng,
        }
      : null,
    scoreGeo: a.score
      ? {
          total: a.score.total,
          densidad: a.score.densidad,
          ingreso: a.score.ingreso,
          transporte: a.score.transporte,
          competencia: a.score.competencia,
          equipamiento: a.score.equipamiento,
        }
      : null,
    finanzas: {
      vanPuro: a.model.flujoPuro.van,
      tirPuro: a.model.flujoPuro.tir,
      paybackPuro: a.model.flujoPuro.payback,
      vanInv: a.model.flujoInversionista.van,
      tirInv: a.model.flujoInversionista.tir,
      breakevenCombosDia: a.model.breakeven,
      tcc: a.tcc,
    },
    competencia: a.cafes != null ? { totalCafes: a.cafes } : null,
    demanda: { combosDiaBase: a.combosDiaBase, ticket: a.ticket },
    sensibilidadTop: a.model.sensitivity.map((s) => ({
      variable: s.variable,
      impactoVan: s.impactoVanPuro,
    })),
    escenario: a.escenario,
  };
}
