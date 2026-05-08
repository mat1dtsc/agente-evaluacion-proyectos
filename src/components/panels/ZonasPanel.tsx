/**
 * Panel principal del dashboard rediseñado:
 *   Comparativo de las 7 ubicaciones pre-evaluadas con score, KPIs y veredicto.
 *
 * Click en una card → centra el mapa en esa ubicación + carga sus parámetros
 * en el modelo financiero (a través del store).
 */
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, MapPin, Coffee, Crown, Trophy, Shield, Scale, Sparkles } from 'lucide-react';
import {
  calcularTodas, scoreUbicacion, veredicto, ESCENARIOS,
  type ResultadoCompleto, type Escenario,
} from '@/lib/finance/cafeModel';
import { useProjectStore } from '@/store/projectStore';
import { formatCLP, formatPct } from '@/lib/utils';

export function ZonasPanel() {
  const selectedId = useProjectStore((s) => s.selectedLocationId);
  const setSelectedId = useProjectStore((s) => s.setSelectedLocationId);
  const setLocation = useProjectStore((s) => s.setLocation);
  const updateInputs = useProjectStore((s) => s.updateInputs);
  const escenarioActivo = useProjectStore((s) => s.escenarioActivo);
  const setEscenarioActivo = useProjectStore((s) => s.setEscenarioActivo);
  const sup = ESCENARIOS[escenarioActivo];

  const resultados = useMemo(() => {
    const r = calcularTodas(escenarioActivo);
    r.sort((a, b) => b.base.van - a.base.van);
    return r;
  }, [escenarioActivo]);

  const ganadora = resultados[0];

  function handleSelect(r: ResultadoCompleto) {
    setSelectedId(r.u.id);
    setLocation({ lat: r.u.lat, lng: r.u.lng, label: r.u.nombre });
    // Sincronizar inputs financieros con la ubicación + escenario
    updateInputs({
      ticketPromedio: r.u.ticketPromedio,
      costoVariableUnitario: r.u.costoVariableUnitario,
      combosPorDiaBase: r.u.combosDiaBase,
      tasaCostoCapital: sup.tcc,
      crecimientoDemanda: sup.gDemanda,
      crecimientoPerpetuidad: sup.gDemanda,
      tasaImpuesto: 0.25,
      proPyme: true,
    });
  }

  return (
    <div className="space-y-3">
      {/* Banner ganadora */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-50 via-orange-50/60 to-rose-50 p-3 shadow-sm dark:from-amber-950/30 dark:via-orange-950/20 dark:to-rose-950/30"
      >
        <div className="absolute -right-3 -top-3 h-20 w-20 rounded-full bg-gradient-to-br from-amber-400/40 to-rose-400/30 blur-2xl" />
        <div className="relative flex items-start gap-3">
          <motion.div
            animate={{ rotate: [0, -8, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 text-white shadow-md"
          >
            <Crown className="h-4 w-4" strokeWidth={2.5} />
          </motion.div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              <Trophy className="h-3 w-3" /> Ubicación recomendada
            </div>
            <div className="mt-0.5 text-sm font-bold leading-tight">{ganadora.u.nombre}</div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
              <KPI label="VAN base" value={formatCLP(ganadora.base.van)} highlight />
              <KPI label="TIR" value={Number.isFinite(ganadora.base.tir) ? formatPct(ganadora.base.tir, 1) : '—'} />
              <KPI label="Payback" value={Number.isFinite(ganadora.base.payback) ? `${ganadora.base.payback.toFixed(1)}y` : '> 5y'} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Toggle de escenarios — calibración del modelo */}
      <div className="rounded-xl border border-border/60 bg-card/80 p-2.5">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold">
          <Scale className="h-3.5 w-3.5 text-accent" />
          <span>Escenario de evaluación</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {(['conservador', 'intermedio', 'optimista'] as Escenario[]).map((esc) => {
            const active = escenarioActivo === esc;
            const meta = ESCENARIOS[esc];
            const Icon = esc === 'conservador' ? Shield : esc === 'intermedio' ? Scale : Sparkles;
            const tones = {
              conservador: active ? 'border-rose-500 bg-rose-500/15 text-rose-700 dark:text-rose-400' : 'hover:border-rose-500/40 hover:bg-rose-500/5',
              intermedio:  active ? 'border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-400' : 'hover:border-amber-500/40 hover:bg-amber-500/5',
              optimista:   active ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'hover:border-emerald-500/40 hover:bg-emerald-500/5',
            }[esc];
            return (
              <button
                key={esc}
                onClick={() => setEscenarioActivo(esc)}
                className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-all ${active ? tones : `border-border/50 bg-card text-muted-foreground ${tones}`}`}
              >
                <Icon className="h-4 w-4" strokeWidth={2.5} />
                <span className="text-[10.5px] font-bold">{meta.label}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-2 rounded-md bg-muted/40 px-2 py-1.5 text-[10px] text-muted-foreground">
          {sup.descripcion}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[9.5px] text-muted-foreground">
          <span>Tcc <strong className="text-foreground">{formatPct(sup.tcc, 0)}</strong></span>
          <span>·</span>
          <span>g <strong className="text-foreground">{formatPct(sup.gDemanda, 1)}</strong></span>
          <span>·</span>
          <span>Mult VT <strong className="text-foreground">{sup.multTerminal}x</strong></span>
          <span>·</span>
          <span>Días/año <strong className="text-foreground">{sup.diasOper}</strong></span>
          <span>·</span>
          <span>Planilla <strong className="text-foreground">{sup.planillaMensual > 0 ? `${(sup.planillaMensual / 1_000_000).toFixed(1)}M` : '2.94M (3 pers.)'}</strong></span>
          <span>·</span>
          <span>CFNL <strong className="text-foreground">{(sup.costosFijosNoLab / 1_000).toFixed(0)}k</strong></span>
        </div>
      </div>

      {/* Explainer del modelo de demanda */}
      <details className="rounded-lg border border-blue-500/30 bg-blue-50/40 px-3 py-2 text-[10.5px] dark:bg-blue-950/15">
        <summary className="cursor-pointer font-semibold text-blue-700 dark:text-blue-400">
          📊 Cómo se calcula la demanda (clic para detalles)
        </summary>
        <div className="mt-2 space-y-1.5 text-muted-foreground">
          <div><strong className="text-foreground">Combos/día madura</strong> = Flujo peatonal OSM × tasa captura zona (cap a capacidad física 200-280)</div>
          <div><strong className="text-foreground">Captura típica (Procafé 2024):</strong> oficinas premium 0.45-0.65% · transit hub 0.18-0.30% · residencial/plaza 0.45-0.60%</div>
          <div><strong className="text-foreground">Ramp-up (Achiga 2024):</strong> año 1 = 55% · año 2 = 75% · año 3 = 90% · años 4-5 = 100%</div>
          <div><strong className="text-foreground">Crecimiento por zona:</strong> g_INE_proyección_2024 + 1.5% sectorial Procafé (con piso del escenario)</div>
        </div>
      </details>

      {/* Grid de zonas (ordenadas por VAN desc) */}
      <div className="grid grid-cols-1 gap-2.5">
        <AnimatePresence>
          {resultados.map((r, i) => (
            <ZoneCard
              key={r.u.id}
              r={r}
              rank={i + 1}
              selected={selectedId === r.u.id}
              onSelect={() => handleSelect(r)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================================
// CARD POR ZONA
// ============================================================
interface ZoneCardProps {
  r: ResultadoCompleto;
  rank: number;
  selected: boolean;
  onSelect: () => void;
}

function ZoneCard({ r, rank, selected, onSelect }: ZoneCardProps) {
  const escenario = useProjectStore((s) => s.escenarioActivo);
  const tccActivo = ESCENARIOS[escenario].tcc;
  const v = veredicto(r);
  const score = scoreUbicacion(r, escenario);
  const tirOk = Number.isFinite(r.base.tir);
  const pbOk = Number.isFinite(r.base.payback) && r.base.payback > 0 && r.base.payback <= 5;

  // Colores según veredicto
  const toneClasses = {
    positivo: {
      border: 'border-emerald-500/40',
      glow: 'shadow-[0_0_0_1px_rgba(16,185,129,0.15)]',
      ring: 'stroke-emerald-500',
      ringBg: 'stroke-emerald-500/15',
      text: 'text-emerald-600 dark:text-emerald-400',
      badge: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300',
    },
    neutral: {
      border: 'border-amber-500/40',
      glow: 'shadow-[0_0_0_1px_rgba(245,158,11,0.15)]',
      ring: 'stroke-amber-500',
      ringBg: 'stroke-amber-500/15',
      text: 'text-amber-700 dark:text-amber-400',
      badge: 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300',
    },
    negativo: {
      border: 'border-rose-500/40',
      glow: '',
      ring: 'stroke-rose-500',
      ringBg: 'stroke-rose-500/10',
      text: 'text-rose-600 dark:text-rose-400',
      badge: 'bg-rose-500/15 text-rose-700 border-rose-500/30 dark:text-rose-300',
    },
  }[v.tono];

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: rank * 0.04, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      className={`group cursor-pointer rounded-xl border-2 bg-card p-3 transition-all ${toneClasses.border} ${
        selected ? `${toneClasses.glow} ring-2 ring-accent/50` : 'hover:border-accent/50'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Rank + Score Ring */}
        <div className="flex flex-col items-center gap-1">
          <div className="relative">
            <ScoreRing score={score} ringClass={toneClasses.ring} bgClass={toneClasses.ringBg} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-base font-black ${toneClasses.text}`}>{score}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
            #{rank}
            {rank === 1 && <Crown className="h-2.5 w-2.5 text-amber-500" />}
          </div>
        </div>

        {/* Info principal */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-xs font-bold leading-tight">{r.u.nombre}</div>
              <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                <MapPin className="h-2.5 w-2.5" />
                {r.u.comuna} · {r.u.m2} m² · {r.u.arriendoUFm2.toFixed(2)} UF/m²
              </div>
            </div>
            <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${toneClasses.badge}`}>
              {v.tono === 'positivo' && <TrendingUp className="h-2.5 w-2.5" />}
              {v.tono === 'neutral' && <AlertTriangle className="h-2.5 w-2.5" />}
              {v.tono === 'negativo' && <TrendingDown className="h-2.5 w-2.5" />}
              {v.texto}
            </span>
          </div>

          {/* KPIs grid */}
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            <MicroKPI
              label="VAN"
              value={formatCLP(r.base.van, true)}
              accent={r.base.van > 0 ? 'green' : 'red'}
            />
            <MicroKPI
              label="TIR"
              value={tirOk ? formatPct(r.base.tir, 0) : '—'}
              accent={tirOk && r.base.tir > tccActivo ? 'green' : 'red'}
            />
            <MicroKPI
              label="Payback"
              value={pbOk ? `${r.base.payback.toFixed(1)}y` : '> 5'}
              accent={pbOk && r.base.payback < 4 ? 'green' : 'gray'}
            />
            <MicroKPI
              label="EBITDA-1"
              value={formatCLP(r.base.ebitdaAno1, true)}
              accent={r.base.ebitdaAno1 > 0 ? 'green' : 'red'}
            />
          </div>

          {/* Detalles operacionales */}
          <div className="mt-2 grid grid-cols-3 gap-2 text-[9.5px]">
            <Detail icon={<Coffee className="h-2.5 w-2.5" />} label="Combos/día (4y)" value={r.base.combosDia.toString()} />
            <Detail label="Ticket" value={`$${r.u.ticketPromedio.toLocaleString('es-CL')}`} />
            <Detail label="Margen" value={formatPct(r.base.margenContrib, 0)} />
          </div>

          {/* NUEVO: transparencia del modelo de demanda */}
          <div className="mt-1.5 grid grid-cols-3 gap-2 rounded-md border border-blue-500/20 bg-blue-50/40 px-2 py-1.5 text-[9px] dark:bg-blue-950/15">
            <Detail
              label="Captura"
              value={formatPct(r.u.tasaCapturaMadura, 2)}
            />
            <Detail
              label="Ramp y1→y4"
              value={`${Math.round(r.base.combosDia * 0.55)} → ${r.base.combosDia}`}
            />
            <Detail
              label="g INE"
              value={formatPct(r.u.crecimientoPoblacionalAnual, 1)}
            />
          </div>

          {/* Pesimista (resiliencia) */}
          <div className="mt-1.5 flex items-center justify-between rounded-md bg-muted/40 px-2 py-1">
            <span className="text-[9px] uppercase tracking-wide text-muted-foreground">Pesimista</span>
            <span className={`text-[10px] font-mono font-semibold ${r.pes.van > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCLP(r.pes.van, true)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// SUB-COMPONENTES
// ============================================================
function ScoreRing({ score, ringClass, bgClass }: { score: number; ringClass: string; bgClass: string }) {
  const radius = 22;
  const circ = 2 * Math.PI * radius;
  const dash = (score / 100) * circ;
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
      <circle cx="28" cy="28" r={radius} fill="none" strokeWidth="4" className={bgClass} />
      <motion.circle
        cx="28" cy="28" r={radius} fill="none" strokeWidth="4"
        strokeDasharray={circ}
        strokeLinecap="round"
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className={ringClass}
      />
    </svg>
  );
}

function MicroKPI({ label, value, accent }: { label: string; value: string; accent: 'green' | 'red' | 'gray' }) {
  const colorMap = {
    green: 'text-emerald-600 dark:text-emerald-400',
    red: 'text-rose-600 dark:text-rose-400',
    gray: 'text-foreground/70',
  };
  return (
    <div className="rounded-md border border-border/50 bg-card/60 px-1.5 py-1 text-center">
      <div className="text-[8.5px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 font-mono text-[10.5px] font-bold leading-none ${colorMap[accent]}`}>{value}</div>
    </div>
  );
}

function Detail({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-1 truncate text-muted-foreground">
      <span className="flex items-center gap-0.5">{icon}{label}</span>
      <span className="font-mono font-semibold text-foreground/80">{value}</span>
    </div>
  );
}

function KPI({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border px-2 py-1.5 text-center ${highlight ? 'border-amber-500/40 bg-amber-50/60 dark:bg-amber-950/20' : 'border-border/50 bg-card/60'}`}>
      <div className="text-[8.5px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 font-mono text-[12px] font-black leading-tight ${highlight ? 'text-amber-700 dark:text-amber-400' : ''}`}>{value}</div>
    </div>
  );
}
