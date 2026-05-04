/** SECTRA EOD. V1: DEMO_DATA. Procesar shapefile + matriz O/D en V2. */
import { readDataIfExists } from './_utils.ts';
const data = readDataIfExists<{ _isDemo?: boolean }>('sectra_eod_zonas.json');
if (data?._isDemo) console.log('  ⚠ sectra_eod_zonas.json es DEMO_DATA');
