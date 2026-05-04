/**
 * BCN — geojson de comunas de Chile.
 * Fuente real: https://www.bcn.cl/siit/mapas_vectoriales (descarga manual de shp/geojson)
 * V1: el JSON pre-poblado en /public/data/comunas_chile.geojson cubre las comunas
 * RM principales con bounding boxes. Promover a polígonos reales en V2.
 */
import { readDataIfExists } from './_utils.ts';

const existing = readDataIfExists<{ features?: unknown[] }>('comunas_chile.geojson');
if (existing && Array.isArray(existing.features) && existing.features.length > 0) {
  console.log(`  ✓ comunas_chile.geojson ya tiene ${existing.features.length} comunas (preservado)`);
} else {
  console.warn('  ! comunas_chile.geojson vacío — descargar manualmente de BCN');
}
