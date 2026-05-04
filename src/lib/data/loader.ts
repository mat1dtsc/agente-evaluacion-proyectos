/**
 * Carga y caché de los JSON de /public/data.
 * Cada respuesta incluye el header de origen (_source, _isDemo, etc.)
 * para que la UI pueda mostrar atribución y badges.
 */

const cache = new Map<string, Promise<any>>();

export async function loadDataset<T>(file: string): Promise<T> {
  if (cache.has(file)) return cache.get(file) as Promise<T>;
  const p = (async () => {
    const res = await fetch(`/data/${file}`);
    if (!res.ok) throw new Error(`No se pudo cargar /data/${file}`);
    return res.json() as Promise<T>;
  })();
  cache.set(file, p);
  return p;
}

export interface SourceMeta {
  _source: string;
  _retrieved: string;
  _url: string;
  _license: string;
  _isDemo: boolean;
  _note?: string;
}

export interface DensidadEntry {
  codigo: string;
  comuna: string;
  poblacion2024: number;
  areaKm2: number;
  densidad: number;
  edadMediana: number;
  piramide: Record<string, number>;
}

export interface CasenEntry {
  codigo: string;
  comuna: string;
  ingresoMedio: number;
  ingresoMediano: number;
  quintilDominante: number;
  hogares: number;
  pobrezaIngresos: number;
}

export interface MetroEntry {
  id: string;
  nombre: string;
  linea: string;
  lat: number;
  lng: number;
  afluenciaAnualM: number;
}

export interface ProcafeData {
  consumoPerCapitaKgAno: number;
  tazasPerCapitaAno: number;
  tazasPerCapitaDia: number;
  shareEspresso: number;
  shareTradicional: number;
  shareSoluble: number;
  ticketPromedioCafeteriaCLP: number;
  benchmarks: Record<string, number>;
  tasaCapturaTipica: Record<string, number>;
}

export interface PerfilHorario {
  perfilTransportePublico: { lunes_viernes: number[]; sabado: number[]; domingo: number[] };
  perfilVehicular: { lunes_viernes: number[]; sabado: number[]; domingo: number[] };
}

export interface MetroLine {
  linea: string;
  color: [number, number, number];
  segments: [number, number][][];
}

export interface MetroLineasData {
  lines: MetroLine[];
}

export interface BusRoute {
  /** ID del way OSM */
  wayId: string;
  /** Path real de la calle (un way OSM, sin concatenar con otros para evitar zigzag) */
  path: [number, number][];
  /** Refs de líneas RED que pasan por este segmento */
  refs: string[];
  /** Etiqueta legible para tooltip (refs truncadas si son muchas) */
  refsLabel: string;
  /** Operadores que comparten esta vía */
  operators: string[];
  /** Color de la primera ruta encontrada — varias rutas en un mismo way comparten color visualmente */
  color: [number, number, number];
}

export interface BusRoutesData {
  routes: BusRoute[];
}

export interface DatasetWithMeta<T> extends SourceMeta {
  data: T;
}
