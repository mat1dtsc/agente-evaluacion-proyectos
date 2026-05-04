/**
 * DTPM RED — subidas/bajadas por paradero.
 * Fuente real: https://datos.gob.cl/dataset/subidas-y-bajadas-por-paradero-en-la-red-bus
 * V1: DEMO_DATA. Descarga manual del CSV (~5GB), procesar con pandas en Python o
 * un script de muestreo a paraderos de la RM oriente y poniente.
 */
import { readDataIfExists } from './_utils.ts';
const data = readDataIfExists<{ data?: unknown[]; _isDemo?: boolean }>('paradero_red_dtpm.json');
if (data?._isDemo) {
  console.log('  ⚠ paradero_red_dtpm.json es DEMO_DATA — promover en V2 con CSV real');
}
