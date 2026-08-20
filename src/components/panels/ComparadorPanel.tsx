import { motion } from 'framer-motion';
import { Trophy, ArrowRight } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { compareZones, type Tono } from '@/lib/compare/comparison';
import { formatCLP, formatPct } from '@/lib/utils';
import { scoreColor } from '@/lib/score';
import type { Escenario } from '@/lib/finance/cafeModel';

const TONO_CLASS: Record<Tono, string> = {
  positivo: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  neutral: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  negativo: 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400',
};

const ESCENARIOS: { id: Escenario; label: string }[] = [
  { id: 'conservador', label: 'Conservador' },
  { id: 'intermedio', label: 'Intermedio' },
  { id: 'optimista', label: 'Optimista' },
];

export function ComparadorPanel() {
  const escenario = useProjectStore((s) => s.escenarioActivo);
  const setEscenario = useProjectStore((s) => s.setEscenarioActivo);
  const setSelectedLocationId = useProjectStore((s) => s.setSelectedLocationId);
  const setActiveTab = useProjectStore((s) => s.setActiveTab);

  const rows = compareZones(escenario);

  const abrirEnFinanciero = (id: string) => {
    setSelectedLocationId(id);
    setActiveTab('financiero');
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-serif-display text-xl leading-tight">Comparador de ubicaciones</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Las 7 zonas RM pre-evaluadas, ordenadas por VAN. Cada zona usa su propio modelo de
          demanda (flujo peatonal × tasa de captura). Cambia el escenario para ver cuán sensible es
          la decisión a los supuestos macro.
        </p>
        <div className="mt-2 flex gap-1.5" role="group" aria-label="Escenario de calibración">
          {ESCENARIOS.map((e) => (
            <button
              key={e.id}
              onClick={() => setEscenario(e.id)}
              aria-pressed={escenario === e.id}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
                escenario === e.id
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {rows.map((r, i) => (
          <motion.button
            key={r.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => abrirEnFinanciero(r.id)}
            aria-label={`Abrir ${r.label} en panel financiero`}
            className={`group block w-full rounded-xl border p-3 text-left transition-all hover:shadow-md ${
              r.esGanadora
                ? 'border-amber-400/60 bg-amber-50/40 ring-1 ring-amber-400/40 dark:bg-amber-950/10'
                : 'border-border hover:border-accent/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex w-8 flex-col items-center">
                <span className="font-mono text-[10px] text-muted-foreground">#{i + 1}</span>
                <span className="font-mono text-lg font-bold tabular" style={{ color: scoreColor(r.score) }}>
                  {r.score}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {r.esGanadora && <Trophy className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />}
                  <span className="truncate text-xs font-semibold">{r.label}</span>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[10px] text-muted-foreground">
                  <span>VAN <b className="text-foreground">{formatCLP(r.van, true)}</b></span>
                  <span>·</span>
                  <span>TIR <b className="text-foreground">{Number.isFinite(r.tir) ? formatPct(r.tir, 0) : '—'}</b></span>
                  <span>·</span>
                  <span>Payback <b className="text-foreground">{Number.isFinite(r.payback) ? `${r.payback.toFixed(1)}a` : '—'}</b></span>
                </div>
              </div>
              <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${TONO_CLASS[r.tono]}`}>
                {r.veredicto}
              </span>
              <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
          </motion.button>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground">
        Click en una zona para cargarla en el panel <span className="font-medium text-foreground/80">Financiero</span>.
        El detalle del modelo y los supuestos viven en las pestañas Financiero y Sensibilidad.
      </p>
    </div>
  );
}
