// Convierte relations route=bus de Overpass a segments por línea RED.
//
// FIX: en lugar de concatenar todos los ways de una relation en un único path
// (que produce zigzag porque los ways no vienen geográficamente ordenados),
// emitimos UN SEGMENT POR WAY. PathLayer de deck.gl puede dibujar múltiples
// segments con el mismo color, así la línea visualmente continúa sin saltos.
//
// Reduce 15MB → ~2MB simplificando geometría con paso fijo (max 80 puntos por way).
import { readFileSync, writeFileSync } from 'node:fs';

const raw = JSON.parse(
  readFileSync(new URL('./_cache/bus-routes.json', import.meta.url), 'utf8'),
);

// Color por letra inicial del ref (alimentadoras y troncales tienen colores típicos)
const COLORS = {
  '1': [220, 0, 26], '2': [255, 165, 0], '3': [70, 130, 180], '4': [50, 205, 50],
  '5': [148, 0, 211], '6': [0, 191, 255], '7': [255, 99, 71],
  'A': [255, 215, 0], 'B': [205, 92, 92], 'C': [60, 179, 113], 'D': [100, 149, 237],
  'E': [255, 140, 0], 'F': [186, 85, 211], 'G': [60, 100, 200], 'H': [255, 105, 180],
  'I': [128, 128, 0], 'J': [70, 70, 70],
};

const colorForRef = (ref) => COLORS[ref?.[0]?.toUpperCase()] ?? [120, 120, 120];

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  const n = parseInt(hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Simplificación stride-based (máx N puntos por path)
function simplify(path, maxPoints) {
  if (path.length <= maxPoints) return path;
  const stride = Math.ceil(path.length / maxPoints);
  const out = [];
  for (let i = 0; i < path.length; i += stride) out.push(path[i]);
  if (out[out.length - 1] !== path[path.length - 1]) out.push(path[path.length - 1]);
  return out;
}

// Dedupe por wayId. Si la misma calle es parte de N rutas, la emitimos UNA SOLA
// vez y guardamos las refs en un array. Reduce ~10x el volumen y elimina líneas
// superpuestas duplicadas.
const wayMap = new Map(); // wayId → { path, refs: string[], operators: string[], firstColor }
let totalRoutes = 0;
const refsSeen = new Set();

for (const rel of raw.elements) {
  if (rel.type !== 'relation') continue;
  const ref = rel.tags?.ref;
  if (!ref) continue;

  const color = rel.tags.colour ? hexToRgb(rel.tags.colour) : colorForRef(ref);
  const ways = (rel.members || []).filter((m) =>
    m.type === 'way' && m.geometry && m.geometry.length >= 2
  );
  if (ways.length === 0) continue;

  totalRoutes += 1;
  refsSeen.add(ref);

  for (const w of ways) {
    if (w.role && w.role !== '' && w.role !== 'forward' && w.role !== 'backward') continue;

    const wayKey = String(w.ref ?? w.id);
    if (wayMap.has(wayKey)) {
      const existing = wayMap.get(wayKey);
      if (!existing.refs.includes(ref)) existing.refs.push(ref);
      if (rel.tags.operator && !existing.operators.includes(rel.tags.operator)) {
        existing.operators.push(rel.tags.operator);
      }
    } else {
      const path = w.geometry.map((p) => [p.lon, p.lat]);
      if (path.length < 2) continue;
      // Filtro de longitud mínima ~50m (descarta micro-segments que dan ruido visual)
      const lng0 = path[0][0], lat0 = path[0][1];
      const lngE = path[path.length - 1][0], latE = path[path.length - 1][1];
      const dy = (latE - lat0) * 111320;
      const dx = (lngE - lng0) * 111320 * Math.cos((lat0 * Math.PI) / 180);
      const lenMeters = Math.hypot(dx, dy);
      if (lenMeters < 30) continue;
      wayMap.set(wayKey, {
        wayId: wayKey,
        path: simplify(path, 25),
        refs: [ref],
        operators: rel.tags.operator ? [rel.tags.operator] : [],
        color,
      });
    }
  }
}

const segments = Array.from(wayMap.values()).map((w) => ({
  wayId: w.wayId,
  path: w.path,
  refs: w.refs.sort(),
  refsLabel: w.refs.length > 6 ? `${w.refs.slice(0, 5).join(', ')} +${w.refs.length - 5}` : w.refs.join(', '),
  operators: w.operators.slice(0, 3),
  color: w.color,
}));

const out = {
  _source: 'OpenStreetMap relations route=bus, network=Red Metropolitana de Movilidad RM',
  _retrieved: new Date().toISOString().slice(0, 10),
  _url: 'https://overpass-api.de/api/interpreter',
  _license: 'ODbL',
  _isDemo: false,
  _note: `${segments.length} segments de ${totalRoutes} rutas (${refsSeen.size} refs únicos). Cada segment es un way OSM coherente — no se concatenan ways para evitar zigzag.`,
  // Mantenemos el nombre 'routes' por compatibilidad con BusRoutesData,
  // pero el contenido son segments individuales.
  routes: segments,
};

const target = 'C:/Users/Usuario/Desktop/carpeta casa/agente-evaluacion-proyectos/public/data/bus_red_movilidad.json';
writeFileSync(target, JSON.stringify(out), 'utf8');
const size = readFileSync(target).length;
console.log(`✓ Wrote ${segments.length} segments from ${totalRoutes} routes (${(size / 1024).toFixed(1)} KB)`);
console.log(`Refs únicos: ${refsSeen.size}`);
