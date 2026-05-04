import { pointInPolygon } from './distanceUtils';
import type { FeatureCollection, Feature } from 'geojson';

interface ComunaProps {
  codigo: string;
  nombre: string;
  region: string;
  areaKm2: number;
}

/** Find the comuna feature whose polygon contains a given point. */
export function findComuna(
  point: { lat: number; lng: number },
  geojson: FeatureCollection<any, ComunaProps> | null,
): Feature<any, ComunaProps> | null {
  if (!geojson?.features) return null;
  for (const f of geojson.features) {
    const coords: number[][][] = (f.geometry as any).coordinates;
    if (!coords) continue;
    const ring = coords[0] as [number, number][];
    if (pointInPolygon([point.lng, point.lat], ring)) {
      return f as Feature<any, ComunaProps>;
    }
  }
  return null;
}
