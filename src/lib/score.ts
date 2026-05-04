/**
 * Score compuesto de atractivo para retail food (0-100).
 * Combina 5 dimensiones normalizadas:
 *  - Densidad poblacional (peso 25%)
 *  - Ingreso (peso 25%) — más ingreso ≈ mejor para café premium
 *  - Acceso transporte público (peso 20%) — paraderos + Metro cercano
 *  - Competencia (peso 15%) — penaliza saturación
 *  - Equipamiento urbano (peso 15%) — universidades, malls atraen flujo
 */

export interface ScoreInputs {
  densidad: number;        // hab/km²
  ingreso: number;         // CLP/mes
  paraderos: number;       // count en radio
  distMetro: number | null; // metros al metro más cercano
  cafes: number;           // competidores en radio
  equipamiento: number;    // count POIs urbanos en radio
}

export interface ScoreBreakdown {
  total: number;
  densidad: number;
  ingreso: number;
  transporte: number;
  competencia: number;
  equipamiento: number;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export function computeScore(inputs: ScoreInputs): ScoreBreakdown {
  // Densidad: 0 → 25k+ hab/km² → 0..100
  const sDensidad = clamp01(inputs.densidad / 22000) * 100;

  // Ingreso: 500k → 4M+ CLP → 0..100 (escala curva)
  const sIngreso = clamp01((inputs.ingreso - 500_000) / 3_500_000) * 100;

  // Transporte: paraderos en radio + bonus si metro <500m
  const baseTransp = clamp01(inputs.paraderos / 25) * 80;
  const bonusMetro = inputs.distMetro !== null
    ? clamp01(1 - inputs.distMetro / 1500) * 20
    : 0;
  const sTransporte = Math.min(100, baseTransp + bonusMetro);

  // Competencia: ideal entre 3 y 12 cafés (validación de zona pero no saturada)
  let sCompetencia = 0;
  if (inputs.cafes === 0) sCompetencia = 35;
  else if (inputs.cafes <= 3) sCompetencia = 80;
  else if (inputs.cafes <= 8) sCompetencia = 100;
  else if (inputs.cafes <= 15) sCompetencia = 70;
  else sCompetencia = Math.max(20, 100 - inputs.cafes * 2);

  // Equipamiento: + por cada hospital/universidad/mall cercano (saturación a 12)
  const sEquipamiento = clamp01(inputs.equipamiento / 12) * 100;

  const total = (
    sDensidad * 0.25 +
    sIngreso * 0.25 +
    sTransporte * 0.20 +
    sCompetencia * 0.15 +
    sEquipamiento * 0.15
  );

  return {
    total: Math.round(total),
    densidad: Math.round(sDensidad),
    ingreso: Math.round(sIngreso),
    transporte: Math.round(sTransporte),
    competencia: Math.round(sCompetencia),
    equipamiento: Math.round(sEquipamiento),
  };
}

export function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 65) return '#eab308';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

export function scoreLabel(score: number): string {
  if (score >= 80) return 'Excelente';
  if (score >= 65) return 'Bueno';
  if (score >= 50) return 'Regular';
  return 'Pobre';
}
