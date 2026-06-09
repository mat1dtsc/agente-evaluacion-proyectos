import { useCallback, useState } from 'react';
import type { AdvisorContext, AdvisoryReport } from '@/lib/advisor/types';
import { deterministicAdvisory } from '@/lib/advisor/deterministic';

export interface UseAdvisor {
  report: AdvisoryReport | null;
  loading: boolean;
  run: (ctx: AdvisorContext) => Promise<void>;
}

function esReporteValido(d: unknown): d is AdvisoryReport {
  if (!d || typeof d !== 'object') return false;
  const r = d as Record<string, unknown>;
  return typeof r.veredicto === 'string' && Array.isArray(r.fortalezas) && Array.isArray(r.riesgos);
}

/**
 * Pide la recomendación a la función serverless `/api/asesor`.
 * Ante cualquier fallo (sin API key → 503, error del modelo → 502, o en
 * `vite dev` donde el endpoint no existe) cae al motor determinístico local,
 * de modo que el Asesor SIEMPRE entrega un resultado.
 */
export function useAdvisor(): UseAdvisor {
  const [report, setReport] = useState<AdvisoryReport | null>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async (ctx: AdvisorContext) => {
    setLoading(true);
    try {
      const res = await fetch('/api/asesor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ctx),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();
      if (!esReporteValido(data)) throw new Error('forma de respuesta inválida');
      setReport({ ...data, fuente: 'ia' });
    } catch {
      setReport(deterministicAdvisory(ctx));
    } finally {
      setLoading(false);
    }
  }, []);

  return { report, loading, run };
}
