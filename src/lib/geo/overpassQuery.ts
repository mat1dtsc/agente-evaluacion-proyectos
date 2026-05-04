import { bboxFromRadius } from './distanceUtils';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

export interface OverpassPOI {
  id: string;
  lat: number;
  lng: number;
  name: string;
  type: string;
  brand?: string;
  cuisine?: string;
}

export interface OverpassBusStop {
  id: string;
  lat: number;
  lng: number;
  name: string;
  network?: string;
  ref?: string;
}

export interface OverpassRoadSegment {
  id: string;
  /** path completo del segmento [lng, lat][] */
  path: [number, number][];
  name: string;
  highway: string;
  lanes?: string;
  maxspeed?: string;
}

export interface OverpassBusiness {
  id: string;
  lat: number;
  lng: number;
  name: string;
  /** Categoría inferida desde tags */
  category: 'office' | 'industrial' | 'commercial' | 'retail' | 'bank' | 'company';
  /** Estimación de empleados típicos según categoría */
  estimatedEmployees: number;
  /** Tag relevante para tooltip */
  detail?: string;
}

async function postOverpass(query: string): Promise<any[]> {
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
  const data = await res.json();
  return data.elements ?? [];
}

/** Cafés y tiendas de café reales en el radio. */
export async function queryCafes(center: { lat: number; lng: number }, radiusMeters: number): Promise<OverpassPOI[]> {
  const [s, w, n, e] = bboxFromRadius(center, radiusMeters);
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="cafe"](${s},${w},${n},${e});
      node["shop"="coffee"](${s},${w},${n},${e});
      node["amenity"="restaurant"]["cuisine"~"coffee_shop|cafe"](${s},${w},${n},${e});
    );
    out body;
  `.trim();
  const elements = await postOverpass(query);
  return elements.map((el: any) => ({
    id: String(el.id),
    lat: el.lat,
    lng: el.lon,
    name: el.tags?.name ?? 'Sin nombre',
    type: el.tags?.amenity ?? el.tags?.shop ?? 'cafe',
    brand: el.tags?.brand,
    cuisine: el.tags?.cuisine,
  }));
}

/**
 * Paraderos de buses reales (RED en Santiago + cualquier paradero etiquetado en OSM).
 * Devuelve nodos con highway=bus_stop o public_transport=platform/stop_position.
 */
export async function queryBusStops(center: { lat: number; lng: number }, radiusMeters: number): Promise<OverpassBusStop[]> {
  const [s, w, n, e] = bboxFromRadius(center, radiusMeters);
  const query = `
    [out:json][timeout:25];
    (
      node["highway"="bus_stop"](${s},${w},${n},${e});
      node["public_transport"="platform"]["bus"="yes"](${s},${w},${n},${e});
    );
    out body;
  `.trim();
  const elements = await postOverpass(query);
  // Dedupe by name+coords (OSM a veces tiene el mismo paradero como bus_stop y como platform)
  const seen = new Set<string>();
  const out: OverpassBusStop[] = [];
  for (const el of elements) {
    const key = `${el.tags?.name ?? el.id}-${el.lat?.toFixed(5)}-${el.lon?.toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: String(el.id),
      lat: el.lat,
      lng: el.lon,
      name: el.tags?.name ?? `Paradero ${el.tags?.ref ?? el.id}`,
      network: el.tags?.network ?? el.tags?.operator,
      ref: el.tags?.ref,
    });
  }
  return out;
}

/** Vías troncales (motorway/trunk) de toda la RM, para vista global. */
export async function queryTrafficStreetsRM(): Promise<OverpassRoadSegment[]> {
  const query = `
    [out:json][timeout:60];
    (
      way["highway"~"^(motorway|trunk|primary)$"](-33.85,-71.0,-33.15,-70.30);
    );
    out geom tags;
  `.trim();
  const elements = await postOverpass(query);
  return elements
    .filter((el: any) => el.geometry && el.geometry.length >= 2)
    .map((el: any) => ({
      id: String(el.id),
      path: el.geometry.map((p: any) => [p.lon, p.lat]) as [number, number][],
      name: el.tags?.name ?? el.tags?.ref ?? `way/${el.id}`,
      highway: el.tags?.highway,
      lanes: el.tags?.lanes,
      maxspeed: el.tags?.maxspeed,
    }));
}

/**
 * Vías principales en el radio con geometría completa para PathLayer.
 * highway: motorway | trunk | primary | secondary (jerarquía urbana RM)
 */
export async function queryTrafficStreets(center: { lat: number; lng: number }, radiusMeters: number): Promise<OverpassRoadSegment[]> {
  const [s, w, n, e] = bboxFromRadius(center, radiusMeters);
  const query = `
    [out:json][timeout:25];
    (
      way["highway"~"^(motorway|trunk|primary|secondary)$"](${s},${w},${n},${e});
    );
    out geom tags;
  `.trim();
  const elements = await postOverpass(query);
  return elements
    .filter((el: any) => el.geometry && el.geometry.length >= 2)
    .map((el: any) => ({
      id: String(el.id),
      path: el.geometry.map((p: any) => [p.lon, p.lat]) as [number, number][],
      name: el.tags?.name ?? el.tags?.ref ?? `way/${el.id}`,
      highway: el.tags?.highway,
      lanes: el.tags?.lanes,
      maxspeed: el.tags?.maxspeed,
    }));
}

/**
 * Empresas y oficinas en el radio. Cubre tres categorías OSM relevantes para
 * estimar el flujo de trabajadores:
 *  - office=*           → oficinas individuales (consultoras, abogados, IT)
 *  - building=office    → edificios completos de oficinas (corporativo)
 *  - landuse=commercial → distritos comerciales / centros financieros
 *  - landuse=industrial → polígonos industriales / fábricas
 *  - landuse=retail     → centros comerciales / strip centers
 *  - amenity=bank       → sucursales bancarias (alta densidad de empleados)
 *
 * Estimaciones de empleados por categoría (referenciales para Chile, pueden
 * iterarse con datos SII o estudios laborales sectoriales):
 */
const EMPLOYEES_BY_CATEGORY: Record<OverpassBusiness['category'], number> = {
  office: 8,        // oficina mediana (1 piso típico)
  industrial: 60,   // promedio para lote industrial RM
  commercial: 40,   // edificio corporativo / centro financiero
  retail: 12,       // centro comercial / strip mall
  bank: 15,         // sucursal bancaria típica
  company: 25,      // empresa genérica con name pero sin landuse
};

export async function queryBusinesses(
  center: { lat: number; lng: number },
  radiusMeters: number,
): Promise<OverpassBusiness[]> {
  const [s, w, n, e] = bboxFromRadius(center, radiusMeters);
  const query = `
    [out:json][timeout:30];
    (
      node["office"](${s},${w},${n},${e});
      way["office"](${s},${w},${n},${e});
      way["building"="office"](${s},${w},${n},${e});
      way["landuse"="commercial"](${s},${w},${n},${e});
      way["landuse"="industrial"](${s},${w},${n},${e});
      way["landuse"="retail"](${s},${w},${n},${e});
      node["amenity"="bank"](${s},${w},${n},${e});
      way["amenity"="bank"](${s},${w},${n},${e});
    );
    out center tags;
  `.trim();
  const elements = await postOverpass(query);
  const out: OverpassBusiness[] = [];
  const seen = new Set<string>();

  for (const el of elements) {
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (!lat || !lng) continue;
    const tags = el.tags ?? {};

    let category: OverpassBusiness['category'];
    let detail: string | undefined;

    if (tags.amenity === 'bank') { category = 'bank'; detail = tags.operator ?? tags.brand; }
    else if (tags.landuse === 'industrial') { category = 'industrial'; detail = 'Industria'; }
    else if (tags.landuse === 'commercial') { category = 'commercial'; detail = 'Distrito comercial'; }
    else if (tags.landuse === 'retail') { category = 'retail'; detail = 'Centro comercial'; }
    else if (tags.building === 'office') { category = 'commercial'; detail = 'Edificio oficinas'; }
    else if (tags.office) { category = 'office'; detail = tags.office; }
    else continue;

    const key = `${lat.toFixed(5)}-${lng.toFixed(5)}-${category}`;
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      id: `${el.type}-${el.id}`,
      lat, lng,
      name: tags.name ?? tags.brand ?? tags['name:es'] ?? `${category}`,
      category,
      estimatedEmployees: EMPLOYEES_BY_CATEGORY[category],
      detail,
    });
  }
  return out;
}
