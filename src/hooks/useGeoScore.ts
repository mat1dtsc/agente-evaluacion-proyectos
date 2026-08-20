import { useMemo } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useCasen, useComunasGeoJSON, useDensidad, useMetro } from '@/hooks/useDatasets';
import { useBusStopsNearby, useCafesNearby, useUrbanEquipmentRM } from '@/hooks/useOSMOverpass';
import { findComuna } from '@/lib/geo/zoneLookup';
import { haversine } from '@/lib/geo/distanceUtils';
import { computeScore, type ScoreBreakdown } from '@/lib/score';

export interface GeoScoreResult {
  score: ScoreBreakdown | null;
  cafes: number | null;
  comuna: string | null;
}

/**
 * Score geográfico (0-100 por dimensión) del punto seleccionado.
 *
 * Reutiliza los mismos hooks cacheados (react-query) que `DemographicsPanel`,
 * así que no dispara descargas extra. Pensado para alimentar al Asesor IA sin
 * duplicar la capa de datos del panel de demografía.
 */
export function useGeoScore(): GeoScoreResult {
  const location = useProjectStore((s) => s.location);
  const radius = useProjectStore((s) => s.radiusMeters);
  const { data: comunas } = useComunasGeoJSON();
  const { data: densidad } = useDensidad();
  const { data: casen } = useCasen();
  const { data: metro } = useMetro();
  const { data: cafes } = useCafesNearby(location, radius);
  const { data: busStopsLocal } = useBusStopsNearby(location, radius);
  const { data: urbanRM } = useUrbanEquipmentRM(true);

  return useMemo<GeoScoreResult>(() => {
    if (!location) return { score: null, cafes: null, comuna: null };

    const comuna = findComuna(location, comunas ?? null);
    const nombreComuna = comuna?.properties?.nombre ?? null;
    const cafeCount = cafes?.length ?? null;

    const dens = comuna && densidad?.data.find((d) => d.codigo === comuna.properties.codigo);
    const ing = comuna && casen?.data.find((d) => d.codigo === comuna.properties.codigo);
    if (!dens || !ing) return { score: null, cafes: cafeCount, comuna: nombreComuna };

    const closestMetro = metro
      ? [...metro.data].map((m) => ({ ...m, dist: haversine(location, m) })).sort((a, b) => a.dist - b.dist)[0]
      : null;
    const equipamiento = urbanRM ? urbanRM.filter((p) => haversine(location, p) <= radius).length : 0;

    const score = computeScore({
      densidad: dens.densidad,
      ingreso: ing.ingresoMedio,
      paraderos: busStopsLocal?.length ?? 0,
      distMetro: closestMetro?.dist ?? null,
      cafes: cafes?.length ?? 0,
      equipamiento,
    });

    return { score, cafes: cafeCount, comuna: nombreComuna };
  }, [location, radius, comunas, densidad, casen, metro, cafes, busStopsLocal, urbanRM]);
}
