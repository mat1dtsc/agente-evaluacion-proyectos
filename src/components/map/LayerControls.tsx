import { useProjectStore } from '@/store/projectStore';
import { Layers } from 'lucide-react';

const LAYERS: Array<{
  key: keyof ReturnType<typeof getLayers>;
  label: string;
  source: string;
  swatch: 'gradient' | 'dot';
  gradient?: string;
  dotColor?: string;
}> = [
  { key: 'densidad',     label: 'Densidad poblacional',     source: 'INE 2024 · hab/km²',    swatch: 'gradient', gradient: 'from-teal-100 via-teal-400 to-teal-800' },
  { key: 'ingreso',      label: 'Ingreso medio',            source: 'CASEN 2022 · CLP',      swatch: 'gradient', gradient: 'from-purple-100 via-purple-400 to-purple-800' },
  { key: 'peatonal',     label: 'Heatmap flujo peatonal',   source: 'OSM live · ponderado',  swatch: 'gradient', gradient: 'from-blue-300 via-amber-400 to-red-600' },
  { key: 'vehicular',    label: 'Red vial principal',        source: 'OSM live · vías',       swatch: 'gradient', gradient: 'from-green-400 via-amber-400 to-red-600' },
  { key: 'metro',        label: 'Metro',                    source: 'Memoria 2023 · 62 est', swatch: 'dot', dotColor: 'bg-red-600' },
  { key: 'paraderos',    label: 'Paraderos RED',            source: 'OSM live',              swatch: 'dot', dotColor: 'bg-sky-500' },
  { key: 'competencia',  label: 'Competencia (cafés)',      source: 'OSM live',              swatch: 'dot', dotColor: 'bg-amber-400' },
  { key: 'equipamiento', label: 'Equipamiento urbano',      source: 'OSM · hosp/u/colegios', swatch: 'dot', dotColor: 'bg-violet-500' },
  { key: 'busRoutes',    label: 'Rutas RED Movilidad',      source: 'OSM · 222 líneas',      swatch: 'gradient', gradient: 'from-red-500 via-yellow-400 to-blue-500' },
];

function getLayers() {
  return useProjectStore.getState().activeLayers;
}

export function LayerControls() {
  const layers = useProjectStore((s) => s.activeLayers);
  const toggle = useProjectStore((s) => s.toggleLayer);

  return (
    <div className="glass rounded-xl p-3 shadow-xl shadow-black/5">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-bold tracking-tight">
        <Layers className="h-3.5 w-3.5 text-accent" />
        Capas del mapa
      </div>
      <ul className="space-y-0.5">
        {LAYERS.map((l) => (
          <li key={l.key}>
            <label className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1.5 transition hover:bg-secondary/50">
              <input
                type="checkbox"
                checked={layers[l.key]}
                onChange={() => toggle(l.key)}
                className="h-3.5 w-3.5 cursor-pointer accent-accent"
              />
              {l.swatch === 'gradient' ? (
                <span className={`h-3 w-7 rounded-full bg-gradient-to-r ${l.gradient}`} />
              ) : (
                <span className={`h-2.5 w-2.5 rounded-full ring-2 ring-card ${l.dotColor}`} />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-medium leading-tight">{l.label}</div>
                <div className="font-mono text-[9px] leading-tight text-muted-foreground">{l.source}</div>
              </div>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
