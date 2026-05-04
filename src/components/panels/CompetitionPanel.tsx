import { useMemo } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useCafesNearby } from '@/hooks/useOSMOverpass';
import { haversine } from '@/lib/geo/distanceUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { SourceCite } from '../ui/SourceCite';
import { CompetitionDonut } from '../charts/CompetitionDonut';
import { NoLocationPlaceholder } from './NoLocationPlaceholder';

const KNOWN_CHAINS = ['starbucks', 'juan valdez', 'café altura', 'tavelli', 'dunkin', 'moca', 'espresso americano', 'tostado', 'the coffee', 'café del mundo'];

function isChain(name: string, brand?: string): boolean {
  const haystack = `${brand ?? ''} ${name}`.toLowerCase();
  return KNOWN_CHAINS.some((c) => haystack.includes(c));
}

export function CompetitionPanel() {
  const location = useProjectStore((s) => s.location);
  const radius = useProjectStore((s) => s.radiusMeters);
  const { data: cafes, isLoading, isError } = useCafesNearby(location, radius);

  const stats = useMemo(() => {
    if (!cafes || !location) return null;
    let cadena = 0;
    let independiente = 0;
    const enriched = cafes.map((c) => {
      const dist = haversine(location, c);
      const chain = isChain(c.name, c.brand);
      if (chain) cadena += 1; else independiente += 1;
      return { ...c, dist, chain };
    }).sort((a, b) => a.dist - b.dist);
    const areaKm2 = Math.PI * Math.pow(radius / 1000, 2);
    return {
      total: cafes.length,
      cadena,
      independiente,
      densidad: cafes.length / Math.max(0.01, areaKm2),
      closest: enriched[0],
      list: enriched,
    };
  }, [cafes, location, radius]);

  if (!location) return <NoLocationPlaceholder />;

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>Competencia en {radius} m</CardTitle>
          <CardDescription>Cafeterías y tiendas de café detectadas en OpenStreetMap (live)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <div className="py-4 text-center text-xs text-muted-foreground">Consultando Overpass…</div>}
          {isError && <div className="py-2 text-xs text-destructive">Error consultando Overpass. Revisa la conexión y reintenta.</div>}
          {stats && (
            <>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <Stat label="Total" value={stats.total.toString()} highlight />
                <Stat label="Cadena" value={stats.cadena.toString()} />
                <Stat label="Independiente" value={stats.independiente.toString()} />
                <Stat label="Densidad" value={`${stats.densidad.toFixed(1)} /km²`} />
                {stats.closest && (
                  <Stat label="Más cercano" value={`${Math.round(stats.closest.dist)}m`} />
                )}
              </div>
              <CompetitionDonut cadena={stats.cadena} independiente={stats.independiente} />
              <div className="border-t pt-2">
                <div className="text-xs font-semibold">Listado</div>
                <ul className="mt-1 max-h-44 space-y-0.5 overflow-y-auto text-[11px]">
                  {stats.list.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-2">
                      <span className="truncate">
                        <span className={`mr-1 inline-block h-2 w-2 rounded-full ${c.chain ? 'bg-yellow-500' : 'bg-sky-500'}`} />
                        {c.name}
                      </span>
                      <span className="font-mono text-muted-foreground">{Math.round(c.dist)}m</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
          <SourceCite source="OpenStreetMap (Overpass API)" url="https://overpass-api.de" />
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded border p-2 ${highlight ? 'border-accent bg-accent/5' : ''}`}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-0.5 font-semibold ${highlight ? 'text-accent' : ''}`}>{value}</div>
    </div>
  );
}
