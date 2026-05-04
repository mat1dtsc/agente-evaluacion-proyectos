import { useProjectStore } from '@/store/projectStore';
import { usePerfilHorario } from '@/hooks/useDatasets';
import { Slider } from '../ui/Slider';
import { Clock } from 'lucide-react';

const periodLabel = (h: number): string => {
  if (h < 6) return 'NOCHE';
  if (h < 12) return 'MAÑANA';
  if (h < 15) return 'ALMUERZO';
  if (h < 19) return 'TARDE';
  if (h < 22) return 'PUNTA TARDE';
  return 'NOCHE';
};

const dayTabs = [
  { value: 'lunes_viernes' as const, label: 'L-V' },
  { value: 'sabado' as const, label: 'Sáb' },
  { value: 'domingo' as const, label: 'Dom' },
];

export function TimeFilter() {
  const dayType = useProjectStore((s) => s.dayType);
  const hour = useProjectStore((s) => s.hour);
  const setDayType = useProjectStore((s) => s.setDayType);
  const setHour = useProjectStore((s) => s.setHour);
  const { data: perfil } = usePerfilHorario();

  const series = perfil?.perfilTransportePublico[dayType] ?? [];
  const max = Math.max(...series, 1);

  return (
    <div className="glass rounded-xl p-3 shadow-xl shadow-black/5">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-bold tracking-tight">
          <Clock className="h-3.5 w-3.5 text-accent" />
          Filtro temporal
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">SECTRA EOD 2012</span>
      </div>

      {/* Day tabs */}
      <div className="mb-3 grid grid-cols-3 gap-1 rounded-md bg-muted/50 p-0.5">
        {dayTabs.map((d) => (
          <button
            key={d.value}
            onClick={() => setDayType(d.value)}
            className={`rounded px-2 py-1 text-[11px] font-semibold transition-colors ${
              dayType === d.value
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Hour mini-histogram */}
      <div className="mb-1.5 flex h-8 items-end gap-[2px]">
        {Array.from({ length: 18 }, (_, i) => i + 6).map((h) => {
          const v = series[h] ?? 0;
          const heightPct = Math.max(8, (v / max) * 100);
          const isActive = h === hour;
          return (
            <button
              key={h}
              onClick={() => setHour(h)}
              className="group relative flex-1 hover:opacity-100"
              style={{ height: '100%' }}
            >
              <div
                className={`absolute bottom-0 w-full rounded-sm transition-all ${
                  isActive
                    ? 'bg-accent'
                    : 'bg-muted-foreground/30 group-hover:bg-muted-foreground/60'
                }`}
                style={{ height: `${heightPct}%` }}
              />
            </button>
          );
        })}
      </div>
      <div className="mb-2 flex justify-between font-mono text-[9px] text-muted-foreground">
        <span>06h</span><span>12h</span><span>18h</span><span>23h</span>
      </div>

      {/* Hour slider */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono tabular text-accent font-bold">{String(hour).padStart(2, '0')}:00</span>
        <span className="font-mono text-[10px] tracking-wider text-muted-foreground">{periodLabel(hour)}</span>
      </div>
      <Slider value={hour} onChange={setHour} min={6} max={23} step={1} />
    </div>
  );
}
