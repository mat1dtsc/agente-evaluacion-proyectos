/**
 * Comparador de ubicaciones pre-evaluadas.
 *
 * Construye filas comparables a partir del modelo financiero corregido
 * (`cafeModel`): cada una de las 7 zonas RM tiene su propio modelo de demanda,
 * así que el VAN/TIR/payback son reales y específicos por zona. La comparación
 * es sensible al escenario de calibración (conservador/intermedio/optimista).
 */

import {
  calcularTodas,
  scoreUbicacion,
  type Escenario,
  type ResultadoCompleto,
} from '@/lib/finance/cafeModel';

export type Tono = 'positivo' | 'neutral' | 'negativo';

export interface CompareRow {
  id: string;
  label: string;
  comuna: string;
  score: number; // 0-100 (scoreUbicacion, sensible al escenario)
  van: number;
  tir: number; // puede ser NaN si no existe TIR real
  payback: number; // puede ser Infinity
  veredicto: 'Recomendado' | 'Aceptable con riesgo' | 'No conviene';
  tono: Tono;
  esGanadora: boolean;
}

/**
 * Veredicto coherente con `cafeModel.veredicto` pero usando el score del
 * escenario activo (en vez del fijo 'conservador' del helper original).
 */
function veredictoEscenario(r: ResultadoCompleto, escenario: Escenario): {
  texto: CompareRow['veredicto'];
  tono: Tono;
  score: number;
} {
  const score = scoreUbicacion(r, escenario);
  if (score >= 70 && r.base.van > 0 && r.pes.van > 0) {
    return { texto: 'Recomendado', tono: 'positivo', score };
  }
  if (score >= 55 && r.base.van > 0) {
    return { texto: 'Aceptable con riesgo', tono: 'neutral', score };
  }
  return { texto: 'No conviene', tono: 'negativo', score };
}

/** Comparación de las 7 zonas pre-evaluadas, ordenada por VAN descendente. */
export function compareZones(escenario: Escenario = 'conservador'): CompareRow[] {
  const rows: CompareRow[] = calcularTodas(escenario).map((r) => {
    const v = veredictoEscenario(r, escenario);
    return {
      id: r.u.id,
      label: r.u.nombre,
      comuna: r.u.comuna,
      score: v.score,
      van: r.base.van,
      tir: r.base.tir,
      payback: r.base.payback,
      veredicto: v.texto,
      tono: v.tono,
      esGanadora: false,
    };
  });

  rows.sort((a, b) => b.van - a.van);
  if (rows.length > 0 && rows[0].van > 0) rows[0].esGanadora = true;
  return rows;
}
