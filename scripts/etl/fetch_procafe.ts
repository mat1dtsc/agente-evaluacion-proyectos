/** Procafé / ANCC — consumo per cápita Chile. */
import { readDataIfExists } from './_utils.ts';
const data = readDataIfExists<{ data?: unknown }>('procafe_consumo.json');
if (data) console.log('  ✓ procafe_consumo.json (preservado)');
