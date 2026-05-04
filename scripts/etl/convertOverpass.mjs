// Convierte el output de Overpass relations a GeoJSON FeatureCollection
// usable por deck.gl. Filtra a 34 comunas RM con código BCN/INE.
import { readFileSync, writeFileSync } from 'node:fs';

const COMUNAS_RM = {
  'Santiago': '13101',
  'Cerrillos': '13102',
  'Cerro Navia': '13103',
  'Conchalí': '13104',
  'El Bosque': '13105',
  'Estación Central': '13106',
  'Huechuraba': '13107',
  'Independencia': '13108',
  'La Cisterna': '13109',
  'La Florida': '13110',
  'La Granja': '13111',
  'La Pintana': '13112',
  'La Reina': '13113',
  'Las Condes': '13114',
  'Lo Barnechea': '13115',
  'Lo Espejo': '13116',
  'Lo Prado': '13117',
  'Macul': '13118',
  'Maipú': '13119',
  'Ñuñoa': '13120',
  'Pedro Aguirre Cerda': '13121',
  'Peñalolén': '13122',
  'Providencia': '13123',
  'Pudahuel': '13124',
  'Quilicura': '13125',
  'Quinta Normal': '13126',
  'Recoleta': '13127',
  'Renca': '13128',
  'San Joaquín': '13129',
  'San Miguel': '13130',
  'San Ramón': '13131',
  'Vitacura': '13132',
  'Puente Alto': '13201',
  'San Bernardo': '13301',
};

const AREAS = {
  'Santiago': 23.2, 'Cerrillos': 21.0, 'Cerro Navia': 11.1, 'Conchalí': 10.7,
  'El Bosque': 14.1, 'Estación Central': 14.1, 'Huechuraba': 44.8, 'Independencia': 7.4,
  'La Cisterna': 10.0, 'La Florida': 70.8, 'La Granja': 10.1, 'La Pintana': 30.6,
  'La Reina': 23.4, 'Las Condes': 99.4, 'Lo Barnechea': 1024.0, 'Lo Espejo': 7.2,
  'Lo Prado': 6.7, 'Macul': 12.9, 'Maipú': 133.0, 'Ñuñoa': 16.9,
  'Pedro Aguirre Cerda': 9.7, 'Peñalolén': 54.2, 'Providencia': 14.4, 'Pudahuel': 197.4,
  'Quilicura': 57.5, 'Quinta Normal': 12.4, 'Recoleta': 16.2, 'Renca': 24.2,
  'San Joaquín': 9.7, 'San Miguel': 9.5, 'San Ramón': 6.5, 'Vitacura': 28.3,
  'Puente Alto': 88.0, 'San Bernardo': 155.1,
};

const raw = JSON.parse(readFileSync(new URL('./_cache/comunas-rm.json', import.meta.url), 'utf8'));

function buildPolygon(rel) {
  // OSM relations can have multiple outer/inner ways. Reconstruct ring(s) from members.
  const outerRings = [];
  const innerRings = [];
  const ways = rel.members.filter((m) => m.type === 'way' && m.geometry);

  // Naive reconstruction: connect ways with role=outer in sequence to form a closed ring.
  // We try: pop ways, link by matching endpoints, if can't close with one set, start new ring.
  const remaining = ways.filter((w) => w.role === 'outer').map((w) => w.geometry.map((p) => [p.lon, p.lat]));
  const inners = ways.filter((w) => w.role === 'inner').map((w) => w.geometry.map((p) => [p.lon, p.lat]));

  while (remaining.length > 0) {
    let ring = remaining.shift();
    let extended = true;
    while (extended) {
      extended = false;
      const last = ring[ring.length - 1];
      const first = ring[0];
      // Check if already closed
      if (last[0] === first[0] && last[1] === first[1]) break;
      for (let i = 0; i < remaining.length; i += 1) {
        const w = remaining[i];
        const wFirst = w[0];
        const wLast = w[w.length - 1];
        if (wFirst[0] === last[0] && wFirst[1] === last[1]) {
          ring = ring.concat(w.slice(1));
          remaining.splice(i, 1);
          extended = true;
          break;
        }
        if (wLast[0] === last[0] && wLast[1] === last[1]) {
          ring = ring.concat(w.slice(0, -1).reverse());
          remaining.splice(i, 1);
          extended = true;
          break;
        }
        if (wLast[0] === first[0] && wLast[1] === first[1]) {
          ring = w.slice(0, -1).concat(ring);
          remaining.splice(i, 1);
          extended = true;
          break;
        }
        if (wFirst[0] === first[0] && wFirst[1] === first[1]) {
          ring = w.slice(1).reverse().concat(ring);
          remaining.splice(i, 1);
          extended = true;
          break;
        }
      }
    }
    // Close ring if not closed
    if (ring.length > 2) {
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) ring.push(first);
      outerRings.push(ring);
    }
  }
  // Inner rings (holes) — same logic, simpler: each inner way is its own ring
  for (const w of inners) {
    if (w.length > 2) {
      if (w[0][0] !== w[w.length - 1][0] || w[0][1] !== w[w.length - 1][1]) w.push(w[0]);
      innerRings.push(w);
    }
  }
  if (outerRings.length === 0) return null;
  if (outerRings.length === 1) {
    const coords = [outerRings[0]];
    if (innerRings.length) coords.push(...innerRings);
    return { type: 'Polygon', coordinates: coords };
  }
  return { type: 'MultiPolygon', coordinates: outerRings.map((r) => [r]) };
}

const features = [];
for (const rel of raw.elements) {
  if (rel.type !== 'relation') continue;
  const name = rel.tags?.name;
  const codigo = COMUNAS_RM[name];
  if (!codigo) continue;
  const geom = buildPolygon(rel);
  if (!geom) continue;
  features.push({
    type: 'Feature',
    properties: {
      codigo,
      nombre: name,
      region: 'Metropolitana',
      areaKm2: AREAS[name] ?? 0,
      osmId: rel.id,
    },
    geometry: geom,
  });
}

const fc = {
  type: 'FeatureCollection',
  _source: 'OpenStreetMap (relations admin_level=8) — polígonos reales de comunas RM',
  _retrieved: new Date().toISOString().slice(0, 10),
  _url: 'https://overpass-api.de/api/interpreter',
  _license: 'ODbL',
  _isDemo: false,
  _note: 'Geometrías reales descargadas vía Overpass API. Reconstrucción de rings outer/inner desde members de cada relation.',
  features,
};

writeFileSync(
  'C:/Users/Usuario/Desktop/carpeta casa/agente-evaluacion-proyectos/public/data/comunas_chile.geojson',
  JSON.stringify(fc),
  'utf8',
);

console.log(`Wrote ${features.length} comunas RM. File:`, 'public/data/comunas_chile.geojson');
console.log('Comunas:', features.map((f) => f.properties.nombre).join(', '));
