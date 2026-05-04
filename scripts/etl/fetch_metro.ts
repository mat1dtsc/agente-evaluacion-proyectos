/**
 * Metro Santiago — afluencia anual por estación.
 * Fuente real: https://www.metro.cl/corporativo/memoria-anual (PDF, extraer tabla)
 * O dataset comunitario en GitHub si existe.
 */
import { readDataIfExists } from './_utils.ts';
const data = readDataIfExists<{ data?: unknown[] }>('flujo_metro_estacion.json');
if (data && Array.isArray(data.data) && data.data.length > 0) {
  console.log(`  ✓ flujo_metro_estacion.json con ${data.data.length} estaciones (preservado)`);
}
