/** UOCT — flujo vehicular. V1: DEMO_DATA. Solicitar acceso a UOCT/MTT en V2. */
import { readDataIfExists } from './_utils.ts';
const data = readDataIfExists<{ _isDemo?: boolean }>('flujo_vehicular_uoct.json');
if (data?._isDemo) console.log('  ⚠ flujo_vehicular_uoct.json es DEMO_DATA');
