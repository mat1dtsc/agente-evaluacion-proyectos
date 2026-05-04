import type { MetroEntry } from '@/lib/data/loader';

/**
 * Colores oficiales del Metro de Santiago.
 * https://www.metro.cl/
 */
export const METRO_COLORS: Record<string, [number, number, number]> = {
  L1: [226, 3, 30],     // Rojo
  L2: [255, 206, 0],    // Amarillo
  L3: [180, 90, 40],    // Café
  L4: [0, 51, 160],     // Azul
  L4A: [0, 157, 217],   // Celeste
  L5: [0, 176, 80],     // Verde
  L6: [146, 39, 143],   // Violeta
};

/**
 * Orden manual de estaciones por línea (de un extremo al otro).
 * Los IDs deben coincidir con los del flujo_metro_estacion.json.
 * Estaciones intermedias compartidas (combinaciones) aparecen en múltiples líneas.
 */
const LINE_ORDER: Record<string, string[]> = {
  L1: [
    'san_pablo', 'neptuno', 'pajaritos', 'las_rejas', 'ecuador', 'san_alberto_h',
    'u_santiago', 'estacion_central', 'u_la_h', 'republica', 'los_heroes', 'moneda',
    'u_chile', 'santa_lucia', 'u_catolica', 'baquedano', 'salvador', 'manuel_montt',
    'pedro_valdivia', 'los_leones', 'tobalaba', 'el_golf', 'alcantara',
    'escuela_militar', 'manquehue', 'hernando_magallanes', 'los_dominicos',
  ],
  L2: [
    'vespucio_norte', 'americo_v_norte', 'zapadores', 'dorsal', 'einstein',
    'cerro_blanco', 'patronato', 'puente_cal', 'santa_ana', 'los_heroes',
    'departamental', 'lo_ovalle', 'el_parron',
  ],
  L4: [
    'tobalaba', 'principe_gales', 'simon_bolivar', 'plaza_egana', 'grecia',
    'macul', 'vicente_valdes', 'rojas_magallanes', 'trinidad', 'san_jose_villa',
    'los_orientales', 'elisa_correa', 'hospital_sotero', 'protectora_inf',
    'las_mercedes', 'plaza_pte_alto',
  ],
  L5: [
    'plaza_egana', 'irarrazaval', 'nuble', 'rodrigo_de_araya', 'carlos_v',
    'camino_agricola', 'san_joaquin', 'mirador', 'bellavista_florida',
    'vicente_valdes', 'baquedano', 'santa_ana', 'puente_cal',
  ],
};

export interface MetroLinePath {
  linea: string;
  color: [number, number, number];
  path: [number, number][];
  stations: string[];
}

export function buildMetroLines(stations: MetroEntry[]): MetroLinePath[] {
  const byId = new Map(stations.map((s) => [s.id, s]));
  const out: MetroLinePath[] = [];
  for (const [linea, ids] of Object.entries(LINE_ORDER)) {
    const path: [number, number][] = [];
    const found: string[] = [];
    for (const id of ids) {
      const st = byId.get(id);
      if (st) {
        path.push([st.lng, st.lat]);
        found.push(id);
      }
    }
    if (path.length >= 2) {
      out.push({ linea, color: METRO_COLORS[linea] ?? [128, 128, 128], path, stations: found });
    }
  }
  return out;
}
