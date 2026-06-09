/**
 * Simulación Monte Carlo del VAN.
 *
 * Perturba las variables más inciertas (demanda, precio/ticket y costo variable)
 * con shocks normales independientes y vuelve a correr el flujo puro en cada
 * iteración, construyendo la distribución del VAN. Complementa al tornado de
 * sensibilidad (que mueve una variable a la vez) con riesgo conjunto.
 *
 * RNG sembrado (mulberry32) → resultados reproducibles para tests y defensa.
 */

import { buildPureFlow } from '@/lib/finance/puroFlow';
import type { ProjectInputs } from '@/lib/finance/types';

export interface MonteCarloResult {
  iterations: number;
  vanMedia: number;
  vanP5: number;
  vanP50: number;
  vanP95: number;
  /** Probabilidad de VAN > 0 (0..1). */
  probVanPositivo: number;
  histogram: Array<{ bin: number; count: number }>;
}

export interface MonteCarloOptions {
  iterations?: number;
  seed?: number;
  /** Desviación estándar relativa de cada shock (0.15 = ±15% típico). */
  sigma?: { demanda?: number; precio?: number; costoVar?: number };
  bins?: number;
}

/** PRNG determinístico (mulberry32). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Normal estándar vía Box-Muller. */
function randNormal(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round((p / 100) * (sorted.length - 1))));
  return sorted[idx];
}

export function monteCarlo(inputs: ProjectInputs, opts: MonteCarloOptions = {}): MonteCarloResult {
  const iterations = opts.iterations ?? 2000;
  const rng = mulberry32(opts.seed ?? 42);
  const sDemanda = opts.sigma?.demanda ?? 0.15;
  const sPrecio = opts.sigma?.precio ?? 0.08;
  const sCosto = opts.sigma?.costoVar ?? 0.1;
  const bins = opts.bins ?? 20;

  const vans: number[] = [];
  for (let i = 0; i < iterations; i += 1) {
    const fDemanda = Math.max(0.1, 1 + randNormal(rng) * sDemanda);
    const fPrecio = Math.max(0.1, 1 + randNormal(rng) * sPrecio);
    const fCosto = Math.max(0.1, 1 + randNormal(rng) * sCosto);
    const sim: ProjectInputs = {
      ...inputs,
      combosPorDiaBase: inputs.combosPorDiaBase * fDemanda,
      ticketPromedio: inputs.ticketPromedio * fPrecio,
      costoVariableUnitario: inputs.costoVariableUnitario * fCosto,
    };
    vans.push(buildPureFlow(sim).van);
  }

  const sorted = [...vans].sort((a, b) => a - b);
  const vanMedia = vans.reduce((s, v) => s + v, 0) / iterations;
  const probVanPositivo = vans.filter((v) => v > 0).length / iterations;

  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const width = (max - min) / bins || 1;
  const histogram = Array.from({ length: bins }, (_, i) => ({
    bin: Math.round(min + width * (i + 0.5)),
    count: 0,
  }));
  for (const v of vans) {
    let idx = Math.floor((v - min) / width);
    if (idx >= bins) idx = bins - 1;
    if (idx < 0) idx = 0;
    histogram[idx].count += 1;
  }

  return {
    iterations,
    vanMedia: Math.round(vanMedia),
    vanP5: Math.round(percentile(sorted, 5)),
    vanP50: Math.round(percentile(sorted, 50)),
    vanP95: Math.round(percentile(sorted, 95)),
    probVanPositivo,
    histogram,
  };
}
