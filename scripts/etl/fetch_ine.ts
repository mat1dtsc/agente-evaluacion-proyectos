/**
 * INE — proyecciones de población por comuna.
 * Fuente real: https://www.ine.gob.cl/estadisticas/sociales/demografia-y-vitales/proyecciones-de-poblacion
 * El INE publica XLSX con proyecciones 2002-2035; descargar y agregar por comuna.
 */
import { readDataIfExists } from './_utils.ts';

const data = readDataIfExists<{ data?: unknown[] }>('densidad_ine_2024.json');
if (data && Array.isArray(data.data) && data.data.length > 0) {
  console.log(`  ✓ densidad_ine_2024.json con ${data.data.length} comunas (preservado)`);
} else {
  console.warn('  ! densidad_ine_2024.json vacío — descargar XLSX desde INE');
}
