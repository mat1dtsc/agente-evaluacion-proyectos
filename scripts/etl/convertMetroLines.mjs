// Convierte ways railway=subway de Overpass a paths por línea para PathLayer.
// Cada way tiene tags con `ref` (L1, L2, L4, L4A, L5, L6) y geometría (lat/lon).
import { readFileSync, writeFileSync } from 'node:fs';

const raw = JSON.parse(
  readFileSync(new URL('./_cache/metro-ways.json', import.meta.url), 'utf8'),
);
// L6 viene en archivo aparte — la query global railway=subway no la incluyó
let l6Raw = { elements: [] };
try {
  l6Raw = JSON.parse(readFileSync(new URL('./_cache/metro-l6.json', import.meta.url), 'utf8'));
} catch {}

const COLORS = {
  L1:  [226, 3, 30],
  L2:  [255, 206, 0],
  L3:  [180, 90, 40],
  L4:  [0, 51, 160],
  L4A: [0, 157, 217],
  L5:  [0, 176, 80],
  L6:  [146, 39, 143],
};

const linesMap = new Map(); // ref -> array de paths

const allElements = [...raw.elements, ...l6Raw.elements];
for (const el of allElements) {
  if (el.type !== 'way' || !el.geometry) continue;
  const refTag = (el.tags?.ref || el.tags?.line || '').toString().trim().toUpperCase();
  const nameTag = (el.tags?.name || '').toString();
  // Inferir línea desde ref o desde el name "Línea X"
  let key = refTag;
  if (/^[1-6]$/.test(refTag)) key = `L${refTag}`;
  if (/^L[ÍI]NEA\s*([1-6][A-Z]?)$/i.test(refTag)) {
    const m = refTag.match(/([1-6][A-Z]?)/);
    if (m) key = `L${m[1]}`;
  }
  // Si el ref no funcionó, usar el name
  if (!key.match(/^L[1-6]A?$/)) {
    const m = nameTag.match(/L[íi]nea\s*([1-6][A-Z]?)/i);
    if (m) key = `L${m[1].toUpperCase()}`;
  }
  if (!key.match(/^L[1-6]A?$/)) continue;

  const path = el.geometry.map((p) => [p.lon, p.lat]);
  if (path.length < 2) continue;

  if (!linesMap.has(key)) linesMap.set(key, []);
  linesMap.get(key).push(path);
}

const lines = [];
for (const [linea, paths] of linesMap.entries()) {
  lines.push({
    linea,
    color: COLORS[linea] ?? [128, 128, 128],
    segments: paths,
  });
}

const out = {
  _source: 'OpenStreetMap (railway=subway ways de la RM)',
  _retrieved: new Date().toISOString().slice(0, 10),
  _url: 'https://overpass-api.de/api/interpreter',
  _license: 'ODbL',
  _isDemo: false,
  _note: `Geometrías reales de las líneas de Metro de Santiago. ${lines.length} líneas, ${lines.reduce((s, l) => s + l.segments.length, 0)} segmentos.`,
  lines,
};

writeFileSync(
  'C:/Users/Usuario/Desktop/carpeta casa/agente-evaluacion-proyectos/public/data/metro_lineas.json',
  JSON.stringify(out),
  'utf8',
);

console.log(`Wrote ${lines.length} lines (${lines.map((l) => `${l.linea}: ${l.segments.length}`).join(', ')})`);
