import { useMemo } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useMetro, usePerfilHorario } from '@/hooks/useDatasets';
import { useBusStopsNearby } from '@/hooks/useOSMOverpass';
import { haversine } from '@/lib/geo/distanceUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { SourceCite } from '../ui/SourceCite';
import { HourlyFlowChart } from '../charts/HourlyFlowChart';
import { formatNumber } from '@/lib/utils';
import { NoLocationPlaceholder } from './NoLocationPlaceholder';

export function FlowPanel() {
  const location = useProjectStore((s) => s.location);
  const radius = useProjectStore((s) => s.radiusMeters);
  const dayType = useProjectStore((s) => s.dayType);
  const hour = useProjectStore((s) => s.hour);
  const setDayType = useProjectStore((s) => s.setDayType);
  const setHour = useProjectStore((s) => s.setHour);
  const { data: metro } = useMetro();
  const { data: busStops, isLoading: loadingBusStops } = useBusStopsNearby(location, radius);
  const { data: perfil } = usePerfilHorario();

  const flujoPeatonalAhora = perfil?.perfilTransportePublico[dayType]?.[hour] ?? 0;
  const flujoVehicularAhora = perfil?.perfilVehicular[dayType]?.[hour] ?? 0;
  const peakPeatonal = perfil ? Math.max(...perfil.perfilTransportePublico[dayType]) : 1;
  const peakVehicular = perfil ? Math.max(...perfil.perfilVehicular[dayType]) : 1;
  const intensidadPeatonal = peakPeatonal > 0 ? flujoPeatonalAhora / peakPeatonal : 0;
  const intensidadVehicular = peakVehicular > 0 ? flujoVehicularAhora / peakVehicular : 0;
  const dayLabel = { lunes_viernes: 'Lun-Vie', sabado: 'Sábado', domingo: 'Domingo' }[dayType];
  const periodoLabel = (h: number): string => {
    if (h < 6) return 'Madrugada';
    if (h < 12) return 'Mañana';
    if (h < 15) return 'Mediodía';
    if (h < 19) return 'Tarde';
    if (h < 22) return 'Punta tarde';
    return 'Noche';
  };

  const closestMetro = useMemo(() => {
    if (!location || !metro) return null;
    return [...metro.data]
      .map((m) => ({ ...m, dist: haversine(location, m) }))
      .sort((a, b) => a.dist - b.dist)[0];
  }, [location, metro]);

  const closestParadero = useMemo(() => {
    if (!location || !busStops || busStops.length === 0) return null;
    return [...busStops]
      .map((p) => ({ ...p, dist: haversine(location, p) }))
      .sort((a, b) => a.dist - b.dist)[0];
  }, [location, busStops]);

  if (!location) return <NoLocationPlaceholder />;

  const tabs: Array<{ key: 'lunes_viernes' | 'sabado' | 'domingo'; label: string }> = [
    { key: 'lunes_viernes', label: 'L-V' },
    { key: 'sabado', label: 'Sáb' },
    { key: 'domingo', label: 'Dom' },
  ];

  return (
    <div className="space-y-3">
      {/* CONTROL DEL FILTRO TEMPORAL — espejo del sidebar del mapa */}
      <Card>
        <CardHeader>
          <CardTitle>Filtro temporal · {dayLabel} · {String(hour).padStart(2, '0')}:00</CardTitle>
          <CardDescription>{periodoLabel(hour)} — los gráficos se sincronizan con esta selección</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-1 rounded-md bg-muted/40 p-0.5">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setDayType(t.key)}
                className={`rounded px-2 py-1 text-xs font-semibold transition-colors ${
                  dayType === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Slider hora con marcadores cada 3h */}
          <div>
            <div className="mb-1 flex justify-between font-mono text-[9px] text-muted-foreground">
              <span>00h</span><span>06h</span><span>12h</span><span>18h</span><span>23h</span>
            </div>
            <input
              type="range"
              min={0}
              max={23}
              step={1}
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              className="w-full cursor-pointer accent-accent"
            />
          </div>

          {/* KPIs en vivo: flujo a la hora seleccionada */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-orange-500/30 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 p-2.5">
              <div className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Peatonal ahora</div>
              <div className="mt-0.5 font-mono text-base font-bold tabular text-orange-600 dark:text-orange-400">
                {formatNumber(flujoPeatonalAhora)}
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-orange-200/40">
                <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${intensidadPeatonal * 100}%` }} />
              </div>
              <div className="mt-1 text-[9px] text-muted-foreground">{(intensidadPeatonal * 100).toFixed(0)}% del peak</div>
            </div>
            <div className="rounded-lg border border-sky-500/30 bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/30 p-2.5">
              <div className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Vehicular ahora</div>
              <div className="mt-0.5 font-mono text-base font-bold tabular text-sky-600 dark:text-sky-400">
                {formatNumber(flujoVehicularAhora)}
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-sky-200/40">
                <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${intensidadVehicular * 100}%` }} />
              </div>
              <div className="mt-1 text-[9px] text-muted-foreground">{(intensidadVehicular * 100).toFixed(0)}% del peak</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transporte público cercano</CardTitle>
          <CardDescription>Metro y paradero más próximos al punto fijado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          {closestMetro && (
            <div className="flex items-center justify-between rounded-lg border bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 p-2.5">
              <div>
                <div className="font-semibold">🚇 {closestMetro.nombre}</div>
                <div className="text-muted-foreground">Línea {closestMetro.linea} · a {Math.round(closestMetro.dist)} m</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-lg font-bold text-accent">{closestMetro.afluenciaAnualM.toFixed(1)}M</div>
                <div className="text-[10px] text-muted-foreground">pasajeros/año</div>
              </div>
            </div>
          )}
          {loadingBusStops && (
            <div className="rounded-lg border p-2.5 text-muted-foreground">Cargando paraderos OSM live…</div>
          )}
          {closestParadero && (
            <div className="flex items-center justify-between rounded-lg border bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/30 p-2.5">
              <div>
                <div className="font-semibold">🚌 {closestParadero.name}</div>
                <div className="text-muted-foreground">a {Math.round(closestParadero.dist)} m {closestParadero.ref ? `· ${closestParadero.ref}` : ''}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-lg font-bold text-accent">{busStops?.length ?? 0}</div>
                <div className="text-[10px] text-muted-foreground">paraderos en radio</div>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-0.5 pt-1">
            <SourceCite source="Metro de Santiago — Memoria 2023" url={metro?._url} retrieved={metro?._retrieved} isDemo={metro?._isDemo} />
            <SourceCite source="OpenStreetMap — Overpass live (highway=bus_stop)" url="https://overpass-api.de" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Perfil horario peatonal</CardTitle>
          <CardDescription>Distribución de viajes en transporte público a lo largo del día</CardDescription>
        </CardHeader>
        <CardContent>
          {perfil && (
            <HourlyFlowChart
              laborales={perfil.perfilTransportePublico.lunes_viernes}
              sabado={perfil.perfilTransportePublico.sabado}
              domingo={perfil.perfilTransportePublico.domingo}
              activeDay={dayType}
              activeHour={hour}
            />
          )}
          <SourceCite source="SECTRA — EOD 2012, distribución horaria publicada" url={perfil?._url} retrieved={perfil?._retrieved} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Perfil horario vehicular</CardTitle>
          <CardDescription>Patrón de viajes en auto privado en la RM</CardDescription>
        </CardHeader>
        <CardContent>
          {perfil && (
            <HourlyFlowChart
              laborales={perfil.perfilVehicular.lunes_viernes}
              sabado={perfil.perfilVehicular.sabado}
              domingo={perfil.perfilVehicular.domingo}
              activeDay={dayType}
              activeHour={hour}
            />
          )}
          <SourceCite source="SECTRA — EOD 2012" url={perfil?._url} retrieved={perfil?._retrieved} />
        </CardContent>
      </Card>

      {busStops && busStops.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Paraderos en el radio ({busStops.length})</CardTitle>
            <CardDescription>OpenStreetMap live · ordenados por distancia</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="max-h-44 space-y-0.5 overflow-y-auto text-[11px]">
              {busStops
                .map((p) => ({ ...p, dist: haversine(location, p) }))
                .sort((a, b) => a.dist - b.dist)
                .slice(0, 30)
                .map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 rounded px-1 py-0.5 hover:bg-secondary/40">
                    <span className="truncate">
                      <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-sky-500" />
                      {p.name}
                    </span>
                    <span className="font-mono text-muted-foreground">{formatNumber(p.dist)}m</span>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
