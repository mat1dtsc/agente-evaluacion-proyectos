import { useMemo, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useDensidad, useComunasGeoJSON, useProcafe, useMetro } from '@/hooks/useDatasets';
import { useBusStopsNearby } from '@/hooks/useOSMOverpass';
import { findComuna } from '@/lib/geo/zoneLookup';
import { haversine } from '@/lib/geo/distanceUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Slider } from '../ui/Slider';
import { Label } from '../ui/Label';
import { SourceCite } from '../ui/SourceCite';
import { formatNumber, formatPct } from '@/lib/utils';
import { NoLocationPlaceholder } from './NoLocationPlaceholder';
import { SectorSelector } from './SectorSelector';
import { Sparkles } from 'lucide-react';

export function DemandPanel() {
  const location = useProjectStore((s) => s.location);
  const radius = useProjectStore((s) => s.radiusMeters);
  const tasaCaptura = useProjectStore((s) => s.tasaCaptura);
  const setTasaCaptura = useProjectStore((s) => s.setTasaCaptura);
  const factorResidentes = useProjectStore((s) => s.factorResidentes);
  const setFactorResidentes = useProjectStore((s) => s.setFactorResidentes);
  const flujoPorParadero = useProjectStore((s) => s.flujoPorParadero);
  const setFlujoPorParadero = useProjectStore((s) => s.setFlujoPorParadero);
  const factorCapturaMetro = useProjectStore((s) => s.factorCapturaMetro);
  const setFactorCapturaMetro = useProjectStore((s) => s.setFactorCapturaMetro);
  const inputs = useProjectStore((s) => s.inputs);
  const updateInputs = useProjectStore((s) => s.updateInputs);

  const { data: comunas } = useComunasGeoJSON();
  const { data: densidad } = useDensidad();
  const { data: busStops } = useBusStopsNearby(location, radius);
  const { data: metro } = useMetro();
  const { data: procafe } = useProcafe();

  const flujoDiario = useMemo(() => {
    if (!location) return 0;
    const comuna = findComuna(location, comunas as any);
    const dens = comuna && densidad?.data.find((d) => d.codigo === comuna.properties.codigo);
    const areaKm2 = Math.PI * Math.pow(radius / 1000, 2);
    const poblacionRadio = dens ? dens.densidad * areaKm2 : 0;

    // Residentes que activan el área en un día típico (factor calibrable)
    const flujoResidentes = poblacionRadio * factorResidentes;

    // Aporte transporte público: número de paraderos OSM × flujo por paradero
    const aporteParaderos = (busStops?.length ?? 0) * flujoPorParadero;

    const metroCerca = metro?.data
      .map((m) => ({ ...m, dist: haversine(location, m) }))
      .find((m) => m.dist <= radius * 1.5);
    const aporteMetro = metroCerca ? (metroCerca.afluenciaAnualM * 1_000_000) / 360 * factorCapturaMetro : 0;

    return flujoResidentes + aporteParaderos + aporteMetro;
  }, [location, radius, comunas, densidad, busStops, metro, factorResidentes, flujoPorParadero, factorCapturaMetro]);

  const combosBase = Math.round(flujoDiario * tasaCaptura);
  const combosOptimista = Math.round(combosBase * 1.4);
  const combosPesimista = Math.round(combosBase * 0.6);

  const benchmarks = procafe?.data.tasaCapturaTipica ?? {};

  if (!location) return <NoLocationPlaceholder message="Selecciona un punto para estimar la demanda en su radio." />;

  const [showSectorSelector, setShowSectorSelector] = useState(false);

  return (
    <div className="space-y-3">
      {/* Onboarding: catálogo de sectores predefinidos chilenos */}
      <Card className="border-accent/40 bg-gradient-to-br from-orange-50/60 to-amber-50/40 dark:from-orange-950/20 dark:to-amber-950/10">
        <CardContent className="p-3">
          {!showSectorSelector ? (
            <button
              onClick={() => setShowSectorSelector(true)}
              className="flex w-full items-center justify-between gap-2 rounded-lg p-1 text-left transition hover:bg-card/60"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15">
                  <Sparkles className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <div className="text-xs font-bold">¿No sabes por dónde empezar?</div>
                  <div className="text-[10px] text-muted-foreground">
                    Elige uno de 10 rubros precargados (café, restaurant, panadería, sushi, dark kitchen…)
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-accent">Elegir →</span>
            </button>
          ) : (
            <SectorSelector onClose={() => setShowSectorSelector(false)} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estimación de demanda</CardTitle>
          <CardDescription>Flujo del área × tasa de captura → combos/día</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 p-3 text-xs">
            <div className="flex items-center justify-between">
              <span>Flujo diario estimado en el radio</span>
              <span className="font-mono text-base font-bold text-accent">{formatNumber(flujoDiario)}</span>
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              = residentes (densidad INE × π·r² × {formatPct(factorResidentes, 0)}) + paraderos OSM × {flujoPorParadero} px/día + {formatPct(factorCapturaMetro, 0)} afluencia Metro cercano
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-2 space-y-1.5 text-[10px]">
            <div className="font-semibold text-[11px]">Factores de estimación (editables)</div>
            <div className="flex items-center justify-between gap-2">
              <Label className="text-[10px]">% residentes que activa área</Label>
              <span className="font-mono">{formatPct(factorResidentes, 0)}</span>
            </div>
            <Slider value={factorResidentes} onChange={setFactorResidentes} min={0.1} max={1.0} step={0.05} />
            <div className="flex items-center justify-between gap-2">
              <Label className="text-[10px]">Flujo diario por paradero</Label>
              <span className="font-mono">{flujoPorParadero} px/día</span>
            </div>
            <Slider value={flujoPorParadero} onChange={setFlujoPorParadero} min={100} max={2000} step={100} />
            <div className="flex items-center justify-between gap-2">
              <Label className="text-[10px]">Captura afluencia Metro</Label>
              <span className="font-mono">{formatPct(factorCapturaMetro, 0)}</span>
            </div>
            <Slider value={factorCapturaMetro} onChange={setFactorCapturaMetro} min={0.01} max={0.20} step={0.01} />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs">
              <Label>Tasa de captura</Label>
              <span className="font-mono text-accent">{formatPct(tasaCaptura, 2)}</span>
            </div>
            <Slider value={tasaCaptura} onChange={setTasaCaptura} min={0.001} max={0.10} step={0.001} />
            <div className="mt-1.5 flex flex-wrap gap-1 text-[10px]">
              {Object.entries(benchmarks).map(([k, v]) => (
                <button
                  key={k}
                  className="rounded-full bg-secondary px-2 py-0.5 hover:bg-accent hover:text-accent-foreground transition"
                  onClick={() => setTasaCaptura(v)}
                >
                  {k}: {formatPct(v, 2)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <Scenario label="Pesimista" value={combosPesimista} factor="60%" />
            <Scenario label="Base" value={combosBase} highlight factor="100%" />
            <Scenario label="Optimista" value={combosOptimista} factor="140%" />
          </div>

          <div className="text-[11px]">
            <Label>Ticket promedio (CLP)</Label>
            <Input
              type="number"
              value={inputs.ticketPromedio}
              onChange={(e) => updateInputs({ ticketPromedio: Number(e.target.value) })}
            />
            <div className="mt-1 text-[10px] text-muted-foreground">
              Procafé: ticket promedio cafetería Chile ≈ ${procafe?.data.ticketPromedioCafeteriaCLP.toLocaleString('es-CL')}
            </div>
          </div>

          <button
            className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40 transition"
            onClick={() => updateInputs({ combosPorDiaBase: combosBase })}
          >
            Aplicar al modelo financiero ({formatNumber(combosBase)} combos/día base)
          </button>

          <div className="rounded-lg border bg-muted/30 p-2 text-[11px] text-muted-foreground">
            <strong>Justificación:</strong> demanda = flujo del área × tasa de captura.
            Flujo combina residentes (INE Censo + Proyección 2024), paraderos en radio (OSM live)
            y afluencia Metro (Memoria Metro 2023). Tasa de captura calibrada con benchmarks
            de consumo de café publicados por Procafé/ANCC.
          </div>

          <div className="flex flex-col gap-0.5">
            <SourceCite source="INE — Censo + Proyección 2024" url={densidad?._url} retrieved={densidad?._retrieved} isDemo={densidad?._isDemo} />
            <SourceCite source="OpenStreetMap — Overpass live" url="https://overpass-api.de" />
            <SourceCite source="Metro Santiago — Memoria 2023" url={metro?._url} retrieved={metro?._retrieved} isDemo={metro?._isDemo} />
            <SourceCite source="Procafé / ANCC" url={procafe?._url} retrieved={procafe?._retrieved} isDemo={procafe?._isDemo} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Scenario({ label, value, highlight, factor }: { label: string; value: number; highlight?: boolean; factor: string }) {
  return (
    <div className={`rounded-lg border p-2 text-center transition ${highlight ? 'border-accent bg-gradient-to-br from-accent/10 to-orange-100/50 dark:to-orange-950/30 shadow-sm' : ''}`}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-lg font-bold ${highlight ? 'text-accent' : ''}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground">combos/día · {factor}</div>
    </div>
  );
}
