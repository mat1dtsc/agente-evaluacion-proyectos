/**
 * CASEN 2022 — ingreso por comuna.
 * Fuente real: https://observatorio.ministeriodesarrollosocial.gob.cl/encuesta-casen-2022
 * El Observatorio publica un panel con descarga XLSX por comuna.
 */
import { readDataIfExists } from './_utils.ts';
const data = readDataIfExists<{ data?: unknown[] }>('casen_2022_comuna.json');
if (data && Array.isArray(data.data) && data.data.length > 0) {
  console.log(`  ✓ casen_2022_comuna.json con ${data.data.length} comunas (preservado)`);
}
