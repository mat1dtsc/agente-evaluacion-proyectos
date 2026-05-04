/**
 * Orquestador: corre todos los ETL en serie y reporta.
 * Cada ETL es idempotente — si la fuente falla, mantiene el JSON existente.
 */
console.log('Running all ETL scripts...');
console.log('NOTE V1: los datasets ya están pre-poblados en /public/data');
console.log('Cada script ETL preserva el JSON si la fuente está caída.\n');

const etls = [
  './fetch_bcn_geojson.ts',
  './fetch_ine.ts',
  './fetch_casen.ts',
  './fetch_metro.ts',
  './fetch_dtpm.ts',
  './fetch_uoct.ts',
  './fetch_sectra.ts',
  './fetch_procafe.ts',
];

for (const etl of etls) {
  console.log(`→ ${etl}`);
  try {
    await import(etl);
  } catch (err) {
    console.error(`  ✗ ${(err as Error).message}`);
  }
}

console.log('\nDone. Revisa SOURCES.md para el estado de cada fuente.');
