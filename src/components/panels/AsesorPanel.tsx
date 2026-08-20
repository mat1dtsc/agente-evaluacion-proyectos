import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles, TrendingUp, AlertTriangle, Target, Loader2 } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { useFinancialModel } from '@/hooks/useFinancialModel';
import { useGeoScore } from '@/hooks/useGeoScore';
import { useAdvisor } from '@/hooks/useAdvisor';
import { buildAdvisorContext } from '@/lib/advisor/context';
import type { AdvisoryReport } from '@/lib/advisor/types';
import { TCC } from '@/lib/finance/cafeModel';

const TONO: Record<AdvisoryReport['veredicto'], { chip: string; dot: string }> = {
  Recomendado: { chip: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  'Aceptable con riesgo': { chip: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  'No conviene': { chip: 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400', dot: 'bg-rose-500' },
};

export function AsesorPanel() {
  const projectName = useProjectStore((s) => s.projectName);
  const location = useProjectStore((s) => s.location);
  const escenario = useProjectStore((s) => s.escenarioActivo);
  const inputs = useProjectStore((s) => s.inputs);

  const model = useFinancialModel();
  const { score, cafes, comuna } = useGeoScore();
  const { report, loading, run } = useAdvisor();

  const ctx = useMemo(
    () =>
      buildAdvisorContext({
        proyecto: projectName,
        location,
        comuna: comuna ?? undefined,
        score,
        model,
        tcc: model.usandoModeloCorregido ? TCC : inputs.tasaCostoCapital,
        cafes,
        combosDiaBase: inputs.combosPorDiaBase,
        ticket: inputs.ticketPromedio,
        escenario,
      }),
    [projectName, location, comuna, score, model, inputs, cafes, escenario],
  );

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
          <Sparkles className="h-3 w-3" /> Asesor
        </div>
        <h2 className="font-serif-display text-xl leading-tight">Recomendación del agente</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Lee la ubicación, el score geográfico, las finanzas (VAN/TIR/payback) y la sensibilidad, y
          redacta una recomendación ejecutiva. Con API key usa Claude; sin ella, un motor de reglas
          equivalente, sin costo.
        </p>
      </div>

      <button
        onClick={() => run(ctx)}
        disabled={loading}
        aria-label="Generar recomendación del asesor"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-glow-orange transition-all hover:opacity-90 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
        {loading ? 'Analizando…' : report ? 'Regenerar recomendación' : 'Generar recomendación'}
      </button>

      {!report && !loading && (
        <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          Presiona el botón para que el agente analice el caso actual (zona, finanzas y sensibilidad).
        </p>
      )}

      {report && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${TONO[report.veredicto].chip}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${TONO[report.veredicto].dot}`} />
              {report.veredicto}
            </span>
            <span className="rounded-full border border-border px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
              {report.fuente === 'ia' ? '✦ IA · Claude' : '⚙ Reglas'}
            </span>
          </div>

          <p className="rounded-xl border bg-card p-3 text-sm leading-relaxed">{report.resumen}</p>

          <div className="grid gap-2 sm:grid-cols-2">
            <ListaCard titulo="Fortalezas" icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-500" />} items={report.fortalezas} />
            <ListaCard titulo="Riesgos" icon={<AlertTriangle className="h-3.5 w-3.5 text-amber-500" />} items={report.riesgos} />
          </div>

          {report.drivers.length > 0 && (
            <div className="rounded-xl border bg-card p-3">
              <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Drivers de mayor impacto</div>
              <ul className="space-y-1 text-xs">
                {report.drivers.map((d, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span className="text-accent">▸</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/5 p-3">
            <Target className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-accent">Siguiente paso</div>
              <p className="text-xs">{report.siguientePaso}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function ListaCard({ titulo, icon, items }: { titulo: string; icon: React.ReactNode; items: string[] }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {icon} {titulo}
      </div>
      <ul className="space-y-1 text-xs">
        {items.map((t, i) => (
          <li key={i} className="flex gap-1.5">
            <span className="text-muted-foreground">•</span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
