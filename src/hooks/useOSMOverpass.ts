import { useQuery } from '@tanstack/react-query';
import {
  queryBusStops,
  queryBusinesses,
  queryCafes,
  queryTrafficStreets,
  queryTrafficStreetsRM,
  type OverpassBusStop,
  type OverpassBusiness,
  type OverpassPOI,
  type OverpassRoadSegment,
} from '@/lib/geo/overpassQuery';

export function useCafesNearby(center: { lat: number; lng: number } | null, radiusMeters: number) {
  return useQuery<OverpassPOI[]>({
    queryKey: ['overpass-cafes', center?.lat?.toFixed(4), center?.lng?.toFixed(4), radiusMeters],
    queryFn: () => queryCafes(center!, radiusMeters),
    enabled: !!center,
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });
}

export function useBusStopsNearby(center: { lat: number; lng: number } | null, radiusMeters: number) {
  return useQuery<OverpassBusStop[]>({
    queryKey: ['overpass-busstops', center?.lat?.toFixed(4), center?.lng?.toFixed(4), radiusMeters],
    queryFn: () => queryBusStops(center!, radiusMeters),
    enabled: !!center,
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });
}

/**
 * Carga paraderos OSM para toda la Región Metropolitana usando un radio amplio
 * desde el centro de Santiago. ~30km cubre todas las comunas RM relevantes.
 * Se cachea 1h, se llama solo cuando la capa peatonal está activa.
 */
export function useBusStopsRM(enabled: boolean) {
  return useQuery<OverpassBusStop[]>({
    queryKey: ['overpass-busstops-rm'],
    queryFn: () => queryBusStops({ lat: -33.4489, lng: -70.6693 }, 30000),
    enabled,
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });
}

export interface UrbanPOI {
  id: string;
  lat: number;
  lng: number;
  name: string;
  category: 'hospital' | 'university' | 'school' | 'mall';
}

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

async function queryUrbanEquipment(): Promise<UrbanPOI[]> {
  // bbox RM amplio
  const bbox = '-33.85,-71.0,-33.15,-70.30';
  const query = `
    [out:json][timeout:90];
    (
      node["amenity"="hospital"](${bbox});
      way["amenity"="hospital"](${bbox});
      node["amenity"="university"](${bbox});
      way["amenity"="university"](${bbox});
      node["amenity"="college"](${bbox});
      way["amenity"="college"](${bbox});
      node["amenity"="school"](${bbox});
      node["shop"="mall"](${bbox});
      way["shop"="mall"](${bbox});
    );
    out center;
  `.trim();
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
  const data = await res.json();
  const elements: any[] = data.elements ?? [];
  const out: UrbanPOI[] = [];
  for (const el of elements) {
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (!lat || !lng) continue;
    const tags = el.tags ?? {};
    let cat: UrbanPOI['category'];
    if (tags.amenity === 'hospital') cat = 'hospital';
    else if (tags.amenity === 'university' || tags.amenity === 'college') cat = 'university';
    else if (tags.amenity === 'school') cat = 'school';
    else if (tags.shop === 'mall') cat = 'mall';
    else continue;
    out.push({ id: `${el.type}-${el.id}`, lat, lng, name: tags.name ?? cat, category: cat });
  }
  return out;
}

export function useUrbanEquipmentRM(enabled: boolean) {
  return useQuery<UrbanPOI[]>({
    queryKey: ['overpass-urban-rm'],
    queryFn: queryUrbanEquipment,
    enabled,
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });
}

export function useTrafficStreetsNearby(center: { lat: number; lng: number } | null, radiusMeters: number) {
  return useQuery<OverpassRoadSegment[]>({
    queryKey: ['overpass-roads', center?.lat?.toFixed(4), center?.lng?.toFixed(4), radiusMeters],
    queryFn: () => queryTrafficStreets(center!, radiusMeters),
    enabled: !!center,
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });
}

export function useTrafficStreetsRM(enabled: boolean) {
  return useQuery<OverpassRoadSegment[]>({
    queryKey: ['overpass-roads-rm'],
    queryFn: queryTrafficStreetsRM,
    enabled,
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });
}

/**
 * Empresas y oficinas en el radio. Útil para estimar el flujo de trabajadores
 * que se suma al flujo poblacional residente. Se ejecuta en vivo con Overpass.
 */
export function useBusinessesNearby(center: { lat: number; lng: number } | null, radiusMeters: number) {
  return useQuery<OverpassBusiness[]>({
    queryKey: ['overpass-businesses', center?.lat?.toFixed(4), center?.lng?.toFixed(4), radiusMeters],
    queryFn: () => queryBusinesses(center!, radiusMeters),
    enabled: !!center,
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });
}
