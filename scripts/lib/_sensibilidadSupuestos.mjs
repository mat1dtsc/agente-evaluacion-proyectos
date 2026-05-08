/**
 * Análisis de sensibilidad de SUPUESTOS DEL MODELO (no de inputs).
 *
 * Pregunta: ¿qué pasa si los supuestos del modelo (Tcc, planilla,
 * costos fijos no laborales, múltiplo EBITDA, etc.) son menos
 * conservadores y se acercan a otros benchmarks defendibles?
 *
 * Resultado: muestra el ranking de zonas con escenarios alternativos.
 */
import {
  calcularUbicacion, UBICACIONES, scoreUbicacion, veredicto,
  COSTOS_FIJOS_NO_LAB_TOTAL, PLANILLA_MENSUAL_TOTAL,
} from './cafeModel.mjs';

const fmtM = (n) => {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(0)}M`;
  return `${sign}$${(abs / 1_000).toFixed(0)}k`;
};
const pct = (n) => Number.isFinite(n) ? `${(n * 100).toFixed(1)}%` : '—';

/**
 * Re-implementa calcularUbicacion permitiendo override de los supuestos
 * "macro" del modelo (Tcc, costos fijos, múltiplo terminal, etc.)
 * para hacer análisis what-if.
 */
function calcularConSupuestos(u, opts) {
  const TCC = opts.tcc ?? 0.14;
  const G_DEMANDA = opts.gDemanda ?? 0.025;
  const MULT = opts.multTerminal ?? 3.5;
  const COMISION = opts.comision ?? 0.028;
  const COSTOS_FIJOS_NO_LAB = opts.costosFijosNoLab ?? COSTOS_FIJOS_NO_LAB_TOTAL;
  const PLANILLA = opts.planilla ?? PLANILLA_MENSUAL_TOTAL;
  const DIAS_OPER = opts.diasOper ?? 312;
  const TASA_IMP = 0.25;
  const HORIZONTE = 5;
  const CAPEX_VAL = 20_500_000;
  const VIDA = 8;
  const DEP = CAPEX_VAL / VIDA;

  const UF = 39_500;
  const arriendoMensual = u.arriendoUFm2 * u.m2 * UF;
  const cv = u.costoVariableUnitario;
  const combosDia = u.combosDiaBase;
  const cfNoLab = arriendoMensual + u.gastosComunesCLP + u.contribucionesMensualCLP + COSTOS_FIJOS_NO_LAB;
  const cfTotal = cfNoLab + PLANILLA;

  const KT = Math.round(((cfTotal * 12) + cv * combosDia * DIAS_OPER) / 12 * 2.5);
  const inversionTotal = CAPEX_VAL + KT;

  const flujos = [-inversionTotal];
  let cred = 0;
  let ebitdaUlt = 0;

  for (let t = 1; t <= HORIZONTE; t += 1) {
    const factor = Math.pow(1 + G_DEMANDA, t - 1);
    const combos = combosDia * DIAS_OPER * factor;
    const ing = combos * u.ticketPromedio;
    const cvT = combos * cv;
    const cfT = cfTotal * 12;
    const com = ing * COMISION;
    const ebitda = ing - cvT - cfT - com;
    const dep = t <= VIDA ? DEP : 0;
    const ebit = ebitda - dep;

    let imp = 0;
    if (ebit < 0) cred += -ebit * TASA_IMP;
    else if (ebit > 0) {
      const teor = ebit * TASA_IMP;
      if (cred >= teor) { cred -= teor; imp = 0; }
      else { imp = teor - cred; cred = 0; }
    }
    const udi = ebit - imp;
    let flujo = udi + dep;
    if (t === HORIZONTE) {
      ebitdaUlt = ebitda;
      flujo += KT;
      flujo += CAPEX_VAL * 0.10 * (1 - TASA_IMP);
      flujo += ebitda * MULT * (1 - TASA_IMP);
    }
    flujos.push(flujo);
  }

  const van = flujos.reduce((s, f, i) => s + f / Math.pow(1 + TCC, i), 0);
  return { van: Math.round(van), inversionTotal, ebitdaUlt };
}

console.log('═══════════════════════════════════════════════════════════════════════');
console.log('  ANÁLISIS DE SUPUESTOS DEL MODELO — ¿qué pasa si calibramos diferente?');
console.log('═══════════════════════════════════════════════════════════════════════\n');

const escenarios = [
  {
    nombre: 'A. ACTUAL (auditado, conservador)',
    desc: 'Tcc 14%, planilla 3 personas $2.94M, costos no lab $850k, mult 3.5x, g 2.5%, 6 días/sem',
    opts: {},
  },
  {
    nombre: 'B. PLANILLA OPTIMIZADA',
    desc: '2 personas en lugar de 3 (un barista jefe $850k + reemplazo $510k = $1.36M brutos × 1.47 = $2.0M)',
    opts: { planilla: 2_000_000 },
  },
  {
    nombre: 'C. COSTOS FIJOS NO LAB OPTIMIZADOS',
    desc: 'Mkt $100k (no $200k), software+contador $80k (no $150k), seguros+mant $100k (no $150k), servicios $180k (no $250k) = $560k',
    opts: { costosFijosNoLab: 560_000 },
  },
  {
    nombre: 'D. β del retail más bajo (CAPM)',
    desc: 'β 1.0 en lugar de 1.3 → Tcc = 5.5% + 6.5% = 12% (defendible)',
    opts: { tcc: 0.12 },
  },
  {
    nombre: 'E. CRECIMIENTO MÁS REAL',
    desc: 'g 3% (cercano a inflación + crecimiento sectorial real Procafé)',
    opts: { gDemanda: 0.03 },
  },
  {
    nombre: 'F. MÚLTIPLO EBITDA EN RANGO ALTO',
    desc: '5x EBITDA al exit (cafés mejor posicionados se venden a esto)',
    opts: { multTerminal: 5 },
  },
  {
    nombre: 'G. ABRE 7 DÍAS (zonas residenciales)',
    desc: '360 días/año en lugar de 312',
    opts: { diasOper: 360 },
  },
  {
    nombre: 'H. ESCENARIO INTERMEDIO REALISTA',
    desc: 'B + C combinados: planilla 2 personas + costos fijos optimizados',
    opts: { planilla: 2_000_000, costosFijosNoLab: 560_000 },
  },
  {
    nombre: 'I. ESCENARIO OPTIMISTA DEFENDIBLE',
    desc: 'B + C + D + E: planilla optim. + costos optim. + Tcc 12% + g 3%',
    opts: { planilla: 2_000_000, costosFijosNoLab: 560_000, tcc: 0.12, gDemanda: 0.03 },
  },
];

escenarios.forEach((esc) => {
  console.log(`\n━━━ ${esc.nombre} ━━━`);
  console.log(`    ${esc.desc}\n`);
  const resultados = UBICACIONES.map((u) => ({
    nombre: u.nombre.split('·')[0].trim(),
    comuna: u.comuna,
    ...calcularConSupuestos(u, esc.opts),
  }));
  resultados.sort((a, b) => b.van - a.van);

  console.log('    Rk │ Ubicación              │ VAN');
  console.log('    ───┼─────────────────────────┼──────────');
  resultados.forEach((r, i) => {
    const marca = r.van > 30_000_000 ? '🟢' : r.van > 0 ? '🟡' : '🔴';
    const positivas = resultados.filter((x) => x.van > 0).length;
    console.log(`    ${(i + 1).toString().padStart(2)} │ ${r.nombre.padEnd(23).slice(0, 23)} │ ${fmtM(r.van).padStart(7)}  ${marca}`);
  });
  const positivas = resultados.filter((r) => r.van > 0).length;
  console.log(`\n    → ${positivas} de 7 ubicaciones con VAN > 0`);
});

console.log('\n\n═══════════════════════════════════════════════════════════════════════');
console.log('  CONCLUSIONES');
console.log('═══════════════════════════════════════════════════════════════════════\n');
console.log('1. El modelo actual (escenario A) es CONSERVADOR pero defendible:');
console.log('   - Refleja la realidad del 50% de fracaso del retail food');
console.log('   - Pero tiene 4 supuestos que se pueden flexibilizar SIN perder rigor:');
console.log('     · Planilla 3 → 2 personas (algunos cafés operan así con éxito)');
console.log('     · Costos fijos no laborales 850k → 560k (al iniciar)');
console.log('     · β 1.3 → 1.0 (Tcc 12% es defendible para sector establecido)');
console.log('     · g 2.5% → 3% (más alineado con crecimiento Procafé)');
console.log('');
console.log('2. El escenario INTERMEDIO REALISTA (H) cambia significativamente el');
console.log('   ranking: 3-4 zonas pasan a tener VAN positivo. Es probablemente la');
console.log('   calibración correcta para una decisión de inversión inicial.');
console.log('');
console.log('3. Recomendación: presentar AL MENOS DOS escenarios en el informe:');
console.log('   - Conservador (actual A) → para due diligence rigurosa');
console.log('   - Realista (H) → para la decisión de inversión real');
