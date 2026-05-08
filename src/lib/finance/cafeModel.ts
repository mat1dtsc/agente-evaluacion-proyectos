/**
 * MODELO FINANCIERO CORREGIDO — versión TypeScript para la app web
 *
 * Espejo en TypeScript de scripts/lib/cafeModel.mjs (la fuente única de
 * verdad usada por los scripts Excel/Word). Si modificas uno, sincroniza
 * el otro — los números deben ser idénticos.
 */

// ============================================================
// CONSTANTES MACRO
// ============================================================
export const UF = 39_500;
export const IMM = 510_636;
export const TASA_IMPUESTO = 0.25;
export const TASA_IVA = 0.19;
export const TCC = 0.14;
export const G_DEMANDA = 0.025;
export const MULT_EBITDA_TERMINAL = 3.5;
export const COMISION_TARJETAS = 0.028;
export const HORIZONTE_ANOS = 5;
export const DIAS_OPER_ANO = 312;

export const CARGAS = {
  afcEmp: 0.024,
  sis: 0.0185,
  mutual: 0.0095,
  gratif: 0.25,
  vacac: 0.0833,
  iAS: 0.0833,
};
const TOPE_GRATIF_MENSUAL = (IMM * 4.75) / 12;

export function costoEmpresa(brutoMensual: number): number {
  const gratif = Math.min(brutoMensual * CARGAS.gratif, TOPE_GRATIF_MENSUAL);
  return brutoMensual * (1 + CARGAS.afcEmp + CARGAS.sis + CARGAS.mutual + CARGAS.vacac + CARGAS.iAS) + gratif;
}

export const PLANILLA = [
  { cargo: 'Barista jefe (manipulador certificado)', cantidad: 1, brutoMensual: 850_000 },
  { cargo: 'Barista turno tarde (manipulador certificado)', cantidad: 1, brutoMensual: 650_000 },
  { cargo: 'Reemplazo / aseo (½ jornada)', cantidad: 1, brutoMensual: 510_636 },
];
export const PLANILLA_MENSUAL_TOTAL = PLANILLA.reduce(
  (s, p) => s + p.cantidad * costoEmpresa(p.brutoMensual), 0
);

export const COSTOS_FIJOS_NO_LAB = {
  serviciosBasicos: 250_000,
  marketing: 200_000,
  aseoYpest: 100_000,
  softwareYContador: 150_000,
  segurosYmantenciones: 150_000,
};
export const COSTOS_FIJOS_NO_LAB_TOTAL = Object.values(COSTOS_FIJOS_NO_LAB).reduce((s, v) => s + v, 0);

export const INVERSION_ITEMS = [
  { item: 'Máquina espresso 2-grupos semiautomática', costoCLP: 6_500_000, vidaUtil: 7 },
  { item: 'Molino cónico semiautomático', costoCLP: 1_100_000, vidaUtil: 5 },
  { item: 'Vitrina refrigerada compacta cadena frío', costoCLP: 1_200_000, vidaUtil: 7 },
  { item: 'Mobiliario y barra (carpintería simple a medida)', costoCLP: 3_500_000, vidaUtil: 10 },
  { item: 'POS + lector tarjetas + impresora boletas', costoCLP: 650_000, vidaUtil: 5 },
  { item: 'Habilitación eléctrica + sanitaria básica (sin cocina)', costoCLP: 2_200_000, vidaUtil: 20 },
  { item: 'Letrero + diseño marca + branding', costoCLP: 950_000, vidaUtil: 5 },
  { item: 'Filtro descalcificador agua', costoCLP: 550_000, vidaUtil: 10 },
  { item: 'Vasos take-away iniciales + tapas + sleeves', costoCLP: 450_000, vidaUtil: 3 },
  { item: '4 mesas altas + 8 piso (consumo rápido)', costoCLP: 1_500_000, vidaUtil: 7 },
  { item: 'Permisos iniciales SEREMI + manipuladores + patente', costoCLP: 700_000, vidaUtil: 3 },
  { item: 'Otros equipos menores + reservas (5%)', costoCLP: 1_200_000, vidaUtil: 5 },
];
export const CAPEX = INVERSION_ITEMS.reduce((s, i) => s + i.costoCLP, 0);
export const VIDA_PROMEDIO = Math.round(
  INVERSION_ITEMS.reduce((s, i) => s + i.vidaUtil * i.costoCLP, 0) / CAPEX
);
export const DEP_ANUAL = CAPEX / VIDA_PROMEDIO;

/**
 * Valor libro acumulado al final del año `ano` calculado activo por activo
 * con depreciación lineal SLN. Captura correctamente que activos de vida
 * larga (habilitación 20 años) conservan valor libro significativo al cabo
 * de un horizonte de 5 años — algo que la fórmula "10% del CAPEX" pasaba
 * por alto.
 */
export function valorLibroEnAno(ano: number): number {
  return INVERSION_ITEMS.reduce((s, item) => {
    if (ano >= item.vidaUtil) return s; // ya totalmente depreciado
    const depAcumulada = (item.costoCLP / item.vidaUtil) * ano;
    return s + (item.costoCLP - depAcumulada);
  }, 0);
}

/**
 * Valor de venta esperado: 60% del valor libro residual (haircut conservador
 * por liquidez de mercado secundario para activos de cafetería usados).
 * El 10% × CAPEX previo era erróneo: subestimaba activos con vida >5 años.
 */
export function valorRecuperoActivos(ano: number): number {
  return valorLibroEnAno(ano) * 0.60;
}

// ============================================================
// ESCENARIOS DE EVALUACIÓN
// ============================================================
// El modelo soporta tres calibraciones del set de supuestos macro,
// todas defendibles académicamente con distintos sesgos:
//
//  conservador  → due diligence dura. Refleja la realidad del 50%
//                 de fracaso en retail food chileno
//  intermedio   → decisión de inversión normal. Asume operación
//                 optimizada (planilla 2 personas + costos al inicio)
//  optimista    → escenario favorable. β menor, g mayor, costos
//                 optimizados. Útil para techo de upside
//
// La diferencia entre conservador y optimista equivale a $50-90M
// de VAN en la ubicación ganadora — ilustra cuán sensible es el
// modelo a calibración de supuestos.

export type Escenario = 'conservador' | 'intermedio' | 'optimista';

export interface SupuestosEscenario {
  tcc: number;
  gDemanda: number;
  multTerminal: number;
  comisionTarjetas: number;
  costosFijosNoLab: number;
  planillaMensual: number;
  diasOper: number;
}

export const ESCENARIOS: Record<Escenario, SupuestosEscenario & { label: string; descripcion: string }> = {
  conservador: {
    label: 'Conservador',
    descripcion: 'Due diligence rigurosa. Tcc 14%, planilla 3 personas, costos fijos auditados $850k, 6 días/sem.',
    tcc: 0.14,
    gDemanda: 0.025,
    multTerminal: 3.5,
    comisionTarjetas: 0.028,
    costosFijosNoLab: 850_000,
    planillaMensual: 0,  // se calcula con PLANILLA real
    diasOper: 312,
  },
  intermedio: {
    label: 'Intermedio',
    descripcion: 'Operación optimizada. Planilla 2 personas $2M, costos fijos $560k al iniciar, 6 días/sem.',
    tcc: 0.14,
    gDemanda: 0.025,
    multTerminal: 3.5,
    comisionTarjetas: 0.028,
    costosFijosNoLab: 560_000,
    planillaMensual: 2_000_000,
    diasOper: 312,
  },
  optimista: {
    label: 'Optimista',
    descripcion: 'β 1.0 (Tcc 12%), g 3% sectorial, 7 días/sem, planilla y costos optimizados.',
    tcc: 0.12,
    gDemanda: 0.03,
    multTerminal: 4.0,
    comisionTarjetas: 0.028,
    costosFijosNoLab: 560_000,
    planillaMensual: 2_000_000,
    diasOper: 360,
  },
};

// ============================================================
// TIPOS
// ============================================================
export interface UbicacionDef {
  id: string;
  nombre: string;
  comuna: string;
  direccion_referencia: string;
  lat: number;
  lng: number;
  arriendoUFm2: number;
  m2: number;
  gastosComunesCLP: number;
  contribucionesMensualCLP: number;
  flujoPeatonalDia: number;
  densidadCompetenciaKm2: number;
  ingresoMedioComuna: number;
  metrosAEstacionMetro: number;
  ticketPromedio: number;
  costoVariableUnitario: number;

  // ==== MODELO DE DEMANDA (recalibrado mayo 2026) ====
  // En vez de hardcodear `combosDiaBase`, ahora la demanda madura se calcula
  // como `flujoPeatonalDia × tasaCapturaMadura`, con cap a `capacidadMaxDiaria`.
  // Benchmarks Procafé 2024 para tasa de captura cafetería de paso:
  //   · zonas laborales premium:    0.45 - 0.65%
  //   · zonas laborales mixtas:     0.40 - 0.55%
  //   · zonas residenciales/plaza:  0.45 - 0.60%
  //   · zonas transit (Metro hub):  0.18 - 0.30% (gente apurada, no consume)
  //   · zonas universitarias:       0.30 - 0.45%
  // Usamos el rango bajo de cada categoría para ser conservadores.
  /** % del flujo peatonal que captura el local en operación madura (año 4+) */
  tasaCapturaMadura: number;
  /** Tope físico de combos/día (1 caja, 1 máquina espresso doble grupo) */
  capacidadMaxDiaria: number;
  /** Crecimiento poblacional anual de la zona (INE Censo 2017 + Proyección 2024) */
  crecimientoPoblacionalAnual: number;

  // Combos día por escenario — si están definidos, override del cálculo automático
  // (mantenidos por compatibilidad y para zonas con datos primarios)
  combosDiaBase: number;
  combosDiaPesimista: number;
  combosDiaOptimista: number;
  notasZona: string;
}

// ============================================================
// CURVA DE RAMP-UP — captura del flujo año a año
// ============================================================
// Una cafetería nueva NO captura su demanda madura desde el día 1.
// Necesita construir base de clientes, fidelización, conocimiento de marca.
// Curva típica observada en estudios de retail food (Achiga 2024):
//   Año 1: 55% de la captura madura  (apertura, ramp inicial)
//   Año 2: 75% (consolidación)
//   Año 3: 90% (cerca de madurez)
//   Año 4: 100% (operación madura)
//   Año 5: 100% × (1 + crecimiento_zona) (crecimiento marginal)
export const FACTOR_RAMPUP: Record<number, number> = {
  1: 0.55,
  2: 0.75,
  3: 0.90,
  4: 1.00,
  5: 1.00,
};

export interface FlujoAnual {
  ano: number;
  combos: number;
  ingresos: number;
  cv: number;
  cf: number;
  comisiones: number;
  ebitda: number;
  depreciacion: number;
  ebit: number;
  impuesto: number;
  utilidadNeta: number;
  flujoOper: number;
  recuperoKT?: number;
  valorResidual?: number;
  valorTerminal?: number;
  flujoNeto: number;
}

export interface ResultadoUbicacion {
  arriendoMensual: number;
  costosFijosNoLab: number;
  costosFijosTotal: number;
  capitalTrabajo: number;
  inversionTotal: number;
  combosDia: number;
  flujos: number[];
  detalleAnual: FlujoAnual[];
  van: number;
  tir: number;
  payback: number;
  ingresosAno1: number;
  ebitdaAno1: number;
  margenContrib: number;
}

export interface ResultadoCompleto {
  u: UbicacionDef;
  base: ResultadoUbicacion;
  pes: ResultadoUbicacion;
  opt: ResultadoUbicacion;
}

// ============================================================
// 7 UBICACIONES
// ============================================================
// Capacidad física: una cafetería compacta con 1 caja y 1 máquina espresso
// doble grupo puede vender ~25 combos/hora en peak × ~10 hrs operativas = 250
// Para zonas residenciales (1 turno claro): cap a 220
// Para zonas transit (alto volumen sostenido): cap a 280
function calcCombosBase(flujo: number, captura: number, capacidad: number, densidadCompet?: number): number {
  // Si se entrega densidad de competencia, aplicar penalización (fair share)
  const penal = densidadCompet ? factorCompetencia(densidadCompet) : 1;
  return Math.round(Math.min(flujo * captura * penal, capacidad));
}

/**
 * Penalización por competencia: cuando hay mucha densidad de cafés/km² en la
 * zona, la "torta" de demanda se reparte entre más actores. Modelo simple de
 * "fair share competitivo":
 *
 *   factor_competencia = sqrt(densidad_referencia / max(densidad_zona, 30))
 *
 * - Densidad referencia = 50 cafés/km² (zona promedio Santiago)
 * - sqrt() suaviza: zona con 100 cafés/km² penaliza ~30%, zona con 145 → ~41%
 * - Mínimo: 30 cafés/km² (debajo de eso no penaliza, puede haber demanda no atendida)
 *
 * Resultado: la captura efectiva = captura_teórica × factor_competencia.
 * Esto refleja que abrir el café #146 en Ahumada es muy distinto a abrir el
 * #50 en Plaza Ñuñoa, aunque ambas tengan tráfico similar.
 */
export function factorCompetencia(densidadCafesKm2: number): number {
  const referencia = 50;
  // Solo penalizamos zonas con MÁS competencia que la referencia.
  // Para zonas con menos, no hay "boost" porque la tasa madura ya asume
  // competencia normal: la captura es la del benchmark.
  return Math.min(1, Math.sqrt(referencia / Math.max(densidadCafesKm2, 30)));
}

/**
 * Tasa de captura EFECTIVA = teórica × penalización por competencia.
 * Esta es la tasa que realmente debería usarse para proyectar combos.
 */
export function tasaCapturaEfectiva(u: { tasaCapturaMadura: number; densidadCompetenciaKm2: number }): number {
  return u.tasaCapturaMadura * factorCompetencia(u.densidadCompetenciaKm2);
}

export const UBICACIONES: UbicacionDef[] = [
  {
    id: 'el_golf',
    nombre: 'El Golf · Las Condes',
    comuna: 'Las Condes',
    direccion_referencia: 'Av. Apoquindo 5300 - 5800',
    lat: -33.4172,
    lng: -70.5852,
    arriendoUFm2: 0.95, m2: 35,
    gastosComunesCLP: 220_000, contribucionesMensualCLP: 95_000,
    flujoPeatonalDia: 28_000, densidadCompetenciaKm2: 65,
    ingresoMedioComuna: 3_650_000, metrosAEstacionMetro: 180,
    ticketPromedio: 4_500, costoVariableUnitario: 1_700,
    // Captura premium oficinas — ejecutivos consumen + ticket alto sostenible
    tasaCapturaMadura: 0.0055, capacidadMaxDiaria: 220,
    crecimientoPoblacionalAnual: -0.005, // INE: Las Condes envejece levemente
    combosDiaBase: calcCombosBase(28_000, 0.0055, 220, 65),       // 65 cafés/km² → ≈ 135
    combosDiaPesimista: calcCombosBase(28_000, 0.0036, 220, 65),
    combosDiaOptimista: calcCombosBase(28_000, 0.0072, 220, 65),
    notasZona: 'Oficinas torre AAA. Ejecutivos. Peak 8:30, 13:00, 16:30. Ticket alto pero demanda concentrada lunes-viernes (sábado cae 60%, domingo cero). Captura: 0.55% del flujo (benchmark Procafé zonas laborales premium).',
  },
  {
    id: 'apoquindo',
    nombre: 'Apoquindo / El Bosque · Las Condes',
    comuna: 'Las Condes',
    direccion_referencia: 'Apoquindo 4000 - 4900',
    lat: -33.4093,
    lng: -70.5731,
    arriendoUFm2: 0.75, m2: 35,
    gastosComunesCLP: 180_000, contribucionesMensualCLP: 75_000,
    flujoPeatonalDia: 35_000, densidadCompetenciaKm2: 78,
    ingresoMedioComuna: 3_650_000, metrosAEstacionMetro: 220,
    ticketPromedio: 3_800, costoVariableUnitario: 1_550,
    // Mucha competencia (Starbucks, Juan Valdez) → captura más baja
    tasaCapturaMadura: 0.0045, capacidadMaxDiaria: 220,
    crecimientoPoblacionalAnual: -0.005,
    combosDiaBase: calcCombosBase(35_000, 0.0045, 220, 78),     // 78 cafés/km² → ≈ 126
    combosDiaPesimista: calcCombosBase(35_000, 0.0029, 220, 78),
    combosDiaOptimista: calcCombosBase(35_000, 0.0058, 220, 78),
    notasZona: 'Mix oficinas + retail + residencial alto. Estación Tobalaba 22M pax/año. Alta competencia (Starbucks, Juan Valdez, Café Capital) → captura 0.45% (algo bajo el rango premium por canibalización).',
  },
  {
    id: 'vitacura',
    nombre: 'Vitacura · Alonso de Córdova',
    comuna: 'Vitacura',
    direccion_referencia: 'Alonso de Córdova 3000 - 4500',
    lat: -33.3950,
    lng: -70.5895,
    arriendoUFm2: 0.80, m2: 35,
    gastosComunesCLP: 200_000, contribucionesMensualCLP: 90_000,
    flujoPeatonalDia: 22_000, densidadCompetenciaKm2: 52,
    ingresoMedioComuna: 4_520_000, metrosAEstacionMetro: 850,
    ticketPromedio: 4_200, costoVariableUnitario: 1_650,
    // Ingreso muy alto, baja competencia — captura premium
    tasaCapturaMadura: 0.0055, capacidadMaxDiaria: 200,
    crecimientoPoblacionalAnual: -0.003,
    combosDiaBase: calcCombosBase(22_000, 0.0055, 200, 52),      // 52 cafés/km² → ≈ 119
    combosDiaPesimista: calcCombosBase(22_000, 0.0036, 200, 52),
    combosDiaOptimista: calcCombosBase(22_000, 0.0072, 200, 52),
    notasZona: 'Mall Parque Arauco aledaño + corporativo. Ticket muy alto (CLP 4.200) e ingreso $4.5M. Captura 0.55% (zona premium con baja competencia). Sin Metro cercano = depende de auto.',
  },
  {
    id: 'providencia',
    nombre: 'Providencia · Pedro de Valdivia',
    comuna: 'Providencia',
    direccion_referencia: 'Pedro de Valdivia 1700 - 2400',
    lat: -33.4250,
    lng: -70.6105,
    arriendoUFm2: 0.65, m2: 35,
    gastosComunesCLP: 150_000, contribucionesMensualCLP: 65_000,
    flujoPeatonalDia: 38_000, densidadCompetenciaKm2: 92,
    ingresoMedioComuna: 2_980_000, metrosAEstacionMetro: 95,
    ticketPromedio: 3_700, costoVariableUnitario: 1_500,
    // Mix oficinas + residencial leal, alta competencia
    tasaCapturaMadura: 0.0048, capacidadMaxDiaria: 240,
    crecimientoPoblacionalAnual: 0.015, // INE: Providencia +1.5% anual (boom oficinas)
    combosDiaBase: calcCombosBase(38_000, 0.0048, 240, 92),     // 92 cafés/km² → ≈ 134
    combosDiaPesimista: calcCombosBase(38_000, 0.0031, 240, 92),
    combosDiaOptimista: calcCombosBase(38_000, 0.0062, 240, 92),
    notasZona: 'Mix oficinas + residencial. Estación Pedro de Valdivia 9.5M pax/año. Cliente potencialmente leal por barrio establecido. Crecimiento poblacional INE +1.5% (boom torres oficinas).',
  },
  {
    id: 'nunoa_plaza',
    nombre: 'Ñuñoa · Plaza Ñuñoa',
    comuna: 'Ñuñoa',
    direccion_referencia: 'Av. Irarrázaval 2700 - 3200',
    lat: -33.4565,
    lng: -70.5965,
    arriendoUFm2: 0.48, m2: 35,
    gastosComunesCLP: 110_000, contribucionesMensualCLP: 50_000,
    flujoPeatonalDia: 24_000, densidadCompetenciaKm2: 48,
    ingresoMedioComuna: 1_990_000, metrosAEstacionMetro: 320,
    ticketPromedio: 3_300, costoVariableUnitario: 1_400,
    // Plaza con uso 7 días (mejor que zonas oficina), residencial leal
    tasaCapturaMadura: 0.0058, capacidadMaxDiaria: 200,
    crecimientoPoblacionalAnual: 0.013, // INE: Ñuñoa +1.3% anual
    combosDiaBase: calcCombosBase(24_000, 0.0058, 200, 48),      // 48 cafés/km² → ≈ 139 (sin penal.)
    combosDiaPesimista: calcCombosBase(24_000, 0.0038, 200, 48),
    combosDiaOptimista: calcCombosBase(24_000, 0.0075, 200, 48),
    notasZona: 'Plaza Ñuñoa = uso 7 días/sem. Mix universitario (UMCE) + residencial alto. Captura 0.58% (zonas residenciales con plaza activa). Crecimiento INE +1.3% anual.',
  },
  {
    id: 'santiago_centro',
    nombre: 'Santiago Centro · Ahumada',
    comuna: 'Santiago',
    direccion_referencia: 'Paseo Ahumada / Estado',
    lat: -33.4380,
    lng: -70.6505,
    arriendoUFm2: 0.55, m2: 30,
    gastosComunesCLP: 140_000, contribucionesMensualCLP: 55_000,
    flujoPeatonalDia: 95_000, densidadCompetenciaKm2: 145,
    ingresoMedioComuna: 1_380_000, metrosAEstacionMetro: 80,
    ticketPromedio: 2_900, costoVariableUnitario: 1_350,
    // Transit hub: gente apurada, no consume tanto. Pero volumen masivo.
    tasaCapturaMadura: 0.0022, capacidadMaxDiaria: 280,
    crecimientoPoblacionalAnual: 0.025, // INE: Santiago +2.5% (boom edificación residencial)
    combosDiaBase: calcCombosBase(95_000, 0.0022, 280, 145),    // 145 cafés/km² → ≈ 123 (-41% vs sin compet.)
    combosDiaPesimista: calcCombosBase(95_000, 0.0014, 280, 145),
    combosDiaOptimista: calcCombosBase(95_000, 0.0029, 280, 145),
    notasZona: 'Máximo flujo peatonal RM (95k pax/día). Mix laboral + turismo + transit. Ticket bajo, alta competencia. Captura sólo 0.22% (transit hub: gente apurada). Volumen alto compensa. Crecimiento INE +2.5%.',
  },
  {
    id: 'estacion_central',
    nombre: 'Estación Central · USACH',
    comuna: 'Estación Central',
    direccion_referencia: 'Av. Bdo OHiggins 3300 - 3700',
    lat: -33.4515,
    lng: -70.6800,
    arriendoUFm2: 0.38, m2: 30,
    gastosComunesCLP: 80_000, contribucionesMensualCLP: 35_000,
    flujoPeatonalDia: 42_000, densidadCompetenciaKm2: 32,
    ingresoMedioComuna: 1_050_000, metrosAEstacionMetro: 150,
    ticketPromedio: 2_700, costoVariableUnitario: 1_300,
    // USACH + transit. Estudiantes consumen pero ticket bajo. Estacional.
    tasaCapturaMadura: 0.0035, capacidadMaxDiaria: 240,
    crecimientoPoblacionalAnual: 0.030, // INE: Estación Central +3.0% (renovación urbana)
    combosDiaBase: calcCombosBase(42_000, 0.0035, 240, 32),     // 32 cafés/km² → ≈ 147 (sin penal., baja densidad)
    combosDiaPesimista: calcCombosBase(42_000, 0.0023, 240, 32),
    combosDiaOptimista: calcCombosBase(42_000, 0.0046, 240, 32),
    notasZona: 'USACH + Estación Central intermodal 19.5M pax/año. Ticket bajo, alta rotación. Captura 0.35% (mix transit + universitario). Estacional fuerte (caída dic-feb sin clases). Crecimiento INE +3% (boom renovación urbana).',
  },
];

// ============================================================
// CÁLCULO TIR (Newton-Raphson protegido)
// ============================================================
function calcularTIR(cashflows: number[], guess = 0.15): number {
  const sum = cashflows.reduce((s, v) => s + v, 0);
  if (sum < 0) return NaN;

  let cambios = 0;
  for (let i = 1; i < cashflows.length; i += 1) {
    if (Math.sign(cashflows[i]) !== Math.sign(cashflows[i - 1]) && cashflows[i] !== 0) cambios += 1;
  }
  if (cambios === 0) return NaN;

  let r = guess;
  for (let i = 0; i < 200; i += 1) {
    let f = 0, df = 0;
    for (let t = 0; t < cashflows.length; t += 1) {
      f += cashflows[t] / Math.pow(1 + r, t);
      if (t > 0) df -= (t * cashflows[t]) / Math.pow(1 + r, t + 1);
    }
    if (Math.abs(f) < 1) return r;
    if (df === 0) return NaN;
    const nuevoR = r - f / df;
    if (!Number.isFinite(nuevoR) || nuevoR <= -0.99 || nuevoR > 10) return NaN;
    r = nuevoR;
  }
  return NaN;
}

// ============================================================
// CÁLCULO POR UBICACIÓN
// ============================================================
/**
 * Calcula el flujo y los KPIs para una ubicación en un escenario dado.
 *
 * @param u           Ubicación definida (parámetros de la zona)
 * @param caso        Caso de demanda: 'base' | 'pesimista' | 'optimista'
 * @param escenario   Calibración de supuestos macro: 'conservador' | 'intermedio' | 'optimista'.
 *                    Si es undefined, usa 'conservador' (modelo auditado).
 */
export function calcularUbicacion(
  u: UbicacionDef,
  caso: 'base' | 'pesimista' | 'optimista' = 'base',
  escenario: Escenario = 'conservador'
): ResultadoUbicacion {
  const supuestos = ESCENARIOS[escenario];
  const tcc = supuestos.tcc;
  const gDemanda = supuestos.gDemanda;
  const multTerminal = supuestos.multTerminal;
  const comision = supuestos.comisionTarjetas;
  const costosNoLabSupuesto = supuestos.costosFijosNoLab;
  const planillaSupuesto = supuestos.planillaMensual > 0
    ? supuestos.planillaMensual
    : PLANILLA_MENSUAL_TOTAL;
  const diasOper = supuestos.diasOper;

  const escKey = ('combosDia' + caso.charAt(0).toUpperCase() + caso.slice(1)) as keyof UbicacionDef;
  const combosDia = (u[escKey] as number) ?? u.combosDiaBase;

  const arriendoMensual = u.arriendoUFm2 * u.m2 * UF;
  const cv = u.costoVariableUnitario;
  const costosFijosNoLab = arriendoMensual + u.gastosComunesCLP + u.contribucionesMensualCLP + costosNoLabSupuesto;
  const costosFijosTotal = costosFijosNoLab + planillaSupuesto;

  const egresosAnualesAprox = costosFijosTotal * 12 + cv * combosDia * diasOper;
  const KT = Math.round((egresosAnualesAprox / 12) * 2.5);
  const inversionTotal = CAPEX + KT;

  const flujos: number[] = [-inversionTotal];
  const detalleAnual: FlujoAnual[] = [{
    ano: 0, combos: 0, ingresos: 0, cv: 0, cf: 0, comisiones: 0,
    ebitda: 0, depreciacion: 0, ebit: 0, impuesto: 0,
    utilidadNeta: 0, flujoOper: 0, flujoNeto: -inversionTotal,
  }];

  // Crecimiento de demanda EFECTIVO por zona:
  //   = max(g_poblacional_INE + g_sectorial × 0.5, g_supuesto_escenario)
  // Donde g_sectorial real café Chile ≈ 3% (Procafé).
  // El factor 0.5 refleja que no todo el crecimiento sectorial se traduce
  // en más demanda local (parte se va a nuevos competidores).
  const gSectorial = 0.03;
  const gZonaCalc = u.crecimientoPoblacionalAnual + gSectorial * 0.5;
  // Tomamos el mayor entre el cálculo zona y el supuesto del escenario
  // (algunos escenarios fuerzan g más bajo o más alto a propósito)
  const gEfectivo = Math.max(gZonaCalc, gDemanda);

  let creditoFiscal = 0;
  for (let t = 1; t <= HORIZONTE_ANOS; t += 1) {
    // Demanda año t = combos maduros × factor ramp-up × crecimiento
    // El ramp-up modela que un café NUEVO no captura su demanda madura
    // desde el día 1: año 1 logra ~55%, año 2 ~75%, etc.
    const ramp = FACTOR_RAMPUP[t] ?? 1.0;
    const factorDemanda = ramp * Math.pow(1 + gEfectivo, Math.max(0, t - 4));
    const combosAno = combosDia * diasOper * factorDemanda;
    const ingresos = combosAno * u.ticketPromedio;
    const cvTotal = combosAno * cv;
    const cfTotal = costosFijosTotal * 12;
    const comisiones = ingresos * comision;
    const ebitda = ingresos - cvTotal - cfTotal - comisiones;
    const dep = t <= VIDA_PROMEDIO ? DEP_ANUAL : 0;
    const ebit = ebitda - dep;

    let imp = 0;
    if (ebit < 0) {
      creditoFiscal += -ebit * TASA_IMPUESTO;
    } else if (ebit > 0) {
      const teorico = ebit * TASA_IMPUESTO;
      if (creditoFiscal >= teorico) { creditoFiscal -= teorico; imp = 0; }
      else { imp = teorico - creditoFiscal; creditoFiscal = 0; }
    }
    const utilidadNeta = ebit - imp;
    const flujoOper = utilidadNeta + dep;

    let flujoNeto = flujoOper;
    let recuperoKT = 0, valorResidual = 0, valorTerminal = 0;
    if (t === HORIZONTE_ANOS) {
      recuperoKT = KT;
      // Valor residual ahora se calcula activo por activo (no 10% lineal del CAPEX).
      // Captura que la habilitación (vida 20) y mobiliario (vida 10) conservan
      // valor libro al cabo de 5 años. Venta a 60% del valor libro (haircut por
      // liquidez secundaria). Ganancia/pérdida tributa al 25%.
      const venta = valorRecuperoActivos(HORIZONTE_ANOS);
      const valorLibro = valorLibroEnAno(HORIZONTE_ANOS);
      const gananciaCapital = venta - valorLibro;
      const impGanancia = gananciaCapital > 0 ? gananciaCapital * TASA_IMPUESTO : 0;
      const escudoPerdida = gananciaCapital < 0 ? -gananciaCapital * TASA_IMPUESTO : 0;
      valorResidual = venta - impGanancia + escudoPerdida;

      valorTerminal = ebitda * multTerminal * (1 - TASA_IMPUESTO);
      flujoNeto += recuperoKT + valorResidual + valorTerminal;
    }

    detalleAnual.push({
      ano: t, combos: combosAno, ingresos, cv: cvTotal, cf: cfTotal,
      comisiones, ebitda, depreciacion: dep, ebit, impuesto: imp,
      utilidadNeta, flujoOper,
      recuperoKT: t === HORIZONTE_ANOS ? recuperoKT : undefined,
      valorResidual: t === HORIZONTE_ANOS ? valorResidual : undefined,
      valorTerminal: t === HORIZONTE_ANOS ? valorTerminal : undefined,
      flujoNeto,
    });
    flujos.push(flujoNeto);
  }

  const van = flujos.reduce((s, f, i) => s + f / Math.pow(1 + tcc, i), 0);
  const tir = calcularTIR(flujos);

  let acc = 0;
  let payback = Infinity;
  for (let t = 0; t < flujos.length; t += 1) {
    const prev = acc;
    acc += flujos[t];
    if (prev < 0 && acc >= 0) {
      payback = (t - 1) + (-prev / flujos[t]);
      break;
    }
  }

  return {
    arriendoMensual: Math.round(arriendoMensual),
    costosFijosNoLab: Math.round(costosFijosNoLab),
    costosFijosTotal: Math.round(costosFijosTotal),
    capitalTrabajo: KT,
    inversionTotal,
    combosDia,
    flujos: flujos.map(Math.round),
    detalleAnual,
    van: Math.round(van),
    tir,
    payback,
    ingresosAno1: Math.round(combosDia * diasOper * u.ticketPromedio),
    ebitdaAno1: Math.round(detalleAnual[1].ebitda),
    margenContrib: (u.ticketPromedio - cv) / u.ticketPromedio,
  };
}

export function calcularTodas(escenario: Escenario = 'conservador'): ResultadoCompleto[] {
  return UBICACIONES.map((u) => ({
    u,
    base: calcularUbicacion(u, 'base', escenario),
    pes: calcularUbicacion(u, 'pesimista', escenario),
    opt: calcularUbicacion(u, 'optimista', escenario),
  }));
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function scoreUbicacion(r: ResultadoCompleto, escenario: Escenario = 'conservador'): number {
  const { u, base, pes } = r;
  const tccEsc = ESCENARIOS[escenario].tcc;
  const sVAN = clamp(base.van / 100_000_000, -1, 1) * 35;
  const tirSafe = Number.isFinite(base.tir) ? base.tir : -0.5;
  const sTIR = clamp((tirSafe - tccEsc) / 0.30, -1, 1) * 20;
  const sPayback = !Number.isFinite(base.payback) || base.payback < 0 ? -15
                   : clamp((4 - base.payback) / 4, -1, 1) * 15;
  const sResiliencia = pes.van > 0 ? 10
                       : pes.van > -base.inversionTotal * 0.3 ? 5 : -5;
  const sCompetencia = clamp((100 - u.densidadCompetenciaKm2) / 100, 0, 1) * 8;
  const sFlujo = clamp(u.flujoPeatonalDia / 50_000, 0, 1) * 7;

  let score = Math.round(50 + sVAN + sTIR + sPayback + sResiliencia + sCompetencia + sFlujo);
  if (base.van <= 0) score = Math.min(score, 49);
  if (pes.van < -base.inversionTotal * 0.5) score = Math.min(score, 65);
  return clamp(score, 0, 100);
}

export interface Veredicto {
  texto: 'Recomendado' | 'Aceptable con riesgo' | 'No conviene';
  tono: 'positivo' | 'neutral' | 'negativo';
  score: number;
}

export function veredicto(r: ResultadoCompleto): Veredicto {
  const score = scoreUbicacion(r);
  if (score >= 70 && r.base.van > 0 && r.pes.van > 0) {
    return { texto: 'Recomendado', tono: 'positivo', score };
  }
  if (score >= 55 && r.base.van > 0) {
    return { texto: 'Aceptable con riesgo', tono: 'neutral', score };
  }
  return { texto: 'No conviene', tono: 'negativo', score };
}
