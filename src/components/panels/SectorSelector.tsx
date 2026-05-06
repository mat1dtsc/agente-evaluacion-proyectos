import { motion } from 'framer-motion';
import { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { SECTORES_RETAIL_FOOD, applySectorToInputs, inversionTotal, type SectorPreset } from '@/lib/finance/sectores';
import { formatCLP, formatPct } from '@/lib/utils';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { TrendingUp, Users, Coffee, Calendar, Sparkles, ChevronRight, X } from 'lucide-react';

interface Props {
  onClose?: () => void;
}

export function SectorSelector({ onClose }: Props) {
  const updateInputs = useProjectStore((s) => s.updateInputs);
  const setProjectName = useProjectStore((s) => s.setProjectName);
  const [selected, setSelected] = useState<SectorPreset | null>(null);

  const handleApply = (sector: SectorPreset) => {
    const inputs = applySectorToInputs(sector);
    updateInputs(inputs);
    setProjectName(`${sector.emoji} ${sector.nombre}`);
    onClose?.();
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
            <Sparkles className="h-3 w-3" />
            Onboarding
          </div>
          <h2 className="font-serif-display text-xl leading-tight">
            Empieza con un rubro real
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            10 sectores precargados con equipamiento, ticket, costos y planilla típicos del retail food chileno (referenciales 2024-2025).
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Grid de sectores */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {SECTORES_RETAIL_FOOD.map((s, i) => (
          <motion.button
            key={s.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -2 }}
            onClick={() => setSelected(s)}
            className={`group relative overflow-hidden rounded-xl border p-3 text-left transition-all hover:shadow-md ${
              selected?.id === s.id
                ? 'border-accent ring-2 ring-accent/30 bg-accent/5'
                : 'border-border hover:border-accent/40'
            }`}
          >
            <div className="flex items-start gap-2">
              <div className="text-2xl">{s.emoji}</div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-xs leading-tight">{s.nombre}</div>
                <div className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground leading-snug">
                  {s.descripcion}
                </div>
                <div className="mt-1.5 flex items-center gap-2 font-mono text-[9px] text-muted-foreground">
                  <span>{formatCLP(inversionTotal(s) / 1_000_000).replace('$', '$')}M inv</span>
                  <span>·</span>
                  <span>{formatCLP(s.operacion.ticketPromedio).replace('$', '$')} ticket</span>
                  <span>·</span>
                  <span>Tcc {formatPct(s.financiamiento.tasaCostoCapital, 1)}</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
            {/* Riesgo dots */}
            <div className="absolute bottom-2 right-2 flex gap-0.5">
              {Array.from({ length: 5 }, (_, j) => (
                <span
                  key={j}
                  className={`h-1 w-1 rounded-full ${j < s.riesgo ? 'bg-accent' : 'bg-border'}`}
                />
              ))}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Detalle del sector seleccionado */}
      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-accent/40 bg-gradient-to-br from-accent/5 to-orange-50/40 dark:to-orange-950/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-2xl">{selected.emoji}</div>
                  <h3 className="mt-1 font-bold text-sm">{selected.nombre}</h3>
                  <p className="text-[11px] italic text-muted-foreground">{selected.ejemploReal}</p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Riesgo</div>
                  <div className="flex justify-end gap-0.5">
                    {Array.from({ length: 5 }, (_, j) => (
                      <span
                        key={j}
                        className={`h-1.5 w-1.5 rounded-full ${j < selected.riesgo ? 'bg-accent' : 'bg-border'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* 4 KPIs principales */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <KPI icon={<Coffee className="h-3 w-3" />} label="Ticket" value={formatCLP(selected.operacion.ticketPromedio)} />
                <KPI icon={<TrendingUp className="h-3 w-3" />} label="Demanda" value={`${selected.demanda.base}/d`} />
                <KPI icon={<Users className="h-3 w-3" />} label="Planilla" value={`${selected.personal.reduce((s, p) => s + p.cantidad, 0)} pers.`} />
                <KPI icon={<Calendar className="h-3 w-3" />} label="Horizonte" value={`${selected.operacion.horizonteAnos} años`} />
              </div>

              {/* Inversión desglose */}
              <details className="text-[11px]">
                <summary className="cursor-pointer font-semibold hover:text-accent">
                  📦 Inversión desglosada · total {formatCLP(inversionTotal(selected))}
                </summary>
                <ul className="mt-1.5 space-y-0.5 pl-3">
                  {selected.inversion.desglose.map((e, i) => (
                    <li key={i} className="flex justify-between">
                      <span className="truncate text-muted-foreground">• {e.item}</span>
                      <span className="font-mono">{formatCLP(e.costoCLP)}</span>
                    </li>
                  ))}
                </ul>
              </details>

              {/* Personal desglose */}
              <details className="text-[11px]">
                <summary className="cursor-pointer font-semibold hover:text-accent">
                  👥 Planilla recomendada · {selected.personal.reduce((s, p) => s + p.cantidad, 0)} personas
                </summary>
                <ul className="mt-1.5 space-y-0.5 pl-3">
                  {selected.personal.map((p, i) => (
                    <li key={i} className="flex justify-between">
                      <span className="truncate text-muted-foreground">• {p.cantidad}× {p.cargo}</span>
                      <span className="font-mono">{formatCLP(p.sueldoBrutoMensual)}/mes</span>
                    </li>
                  ))}
                </ul>
              </details>

              {/* Fuentes */}
              {selected.fuentes.length > 0 && (
                <div className="border-t pt-2 text-[9px] text-muted-foreground">
                  <span className="font-semibold">Fuentes:</span> {selected.fuentes.join(' · ')}
                </div>
              )}

              <Button
                onClick={() => handleApply(selected)}
                className="w-full bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-glow-orange hover:opacity-90"
              >
                <Sparkles className="h-4 w-4" />
                Aplicar al modelo y empezar
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

function KPI({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card/60 p-2">
      <div className="mb-0.5 flex items-center justify-center gap-1 text-muted-foreground">
        {icon}
        <span className="text-[8px] uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-[11px] font-bold tabular">{value}</div>
    </div>
  );
}
