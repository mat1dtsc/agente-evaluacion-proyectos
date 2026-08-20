import { pointInPolygon } from './distanceUtils';
import type { FeatureCollection, Feature, MultiPolygon, Polygon, Position } from 'geojson';

export type ComunaGeometry = Polygon | MultiPolygon;

export interface ComunaProps {
  codigo: string;
  nombre: string;
  region: string;
  areaKm2: number;
}

/** Find the comuna feature whose polygon contains a given point. */
export function findComuna(
  point: { lat: number; lng: number },
  geojson: FeatureCollection<ComunaGeometry, ComunaProps> | null,
): Feature<ComunaGeometry, ComunaProps> | null {
  if (!geojson?.features) return null;
  for (const f of geojson.features) {
    // Polygon: Position[][] (anillos). MultiPolygon: Position[][][] (poligonos).
    // En ambos casos el primer anillo del primer poligono es el contorno exterior.
    const coords = f.geometry?.coordinates as Position[][] | Position[][][] | undefined;
    if (!coords) continue;
    const primero = coords[0];
    const ring = (Array.isArray(primero[0][0]) ? primero[0] : primero) as [number, number][];
    if (pointInPolygon([point.lng, point.lat], ring)) {
      return f;
    }
  }
  return null;
}
