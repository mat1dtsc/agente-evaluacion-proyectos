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
  combosDiaBase: number;
  combosDiaPesimista: number;
  combosDiaOptimista: number;
  notasZona: string;
}

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
    combosDiaBase: 95, combosDiaPesimista: 60, combosDiaOptimista: 130,
    notasZona: 'Oficinas torre AAA. Ejecutivos. Peak 8:30, 13:00, 16:30. Ticket alto pero demanda concentrada lunes-viernes (sábado cae 60%, domingo cero). Riesgo: dependencia 100% de oficinas.',
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
    combosDiaBase: 90, combosDiaPesimista: 55, combosDiaOptimista: 130,
    notasZona: 'Mix oficinas + retail + residencial alto. Estación Tobalaba 22M pax/año. Alta competencia (Starbucks, Juan Valdez, Café Capital). Margen presionado.',
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
    combosDiaBase: 70, combosDiaPesimista: 40, combosDiaOptimista: 105,
    notasZona: 'Mall Parque Arauco aledaño + corporativo. Ticket muy alto. Dependencia de Mall (estacional). Sin Metro cercano = depende de auto.',
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
    combosDiaBase: 95, combosDiaPesimista: 60, combosDiaOptimista: 140,
    notasZona: 'Mix oficinas + residencial. Estación Pedro de Valdivia 9.5M pax/año. Mayor competencia RM (riesgo). Cliente potencialmente leal por barrio establecido.',
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
    combosDiaBase: 80, combosDiaPesimista: 50, combosDiaOptimista: 120,
    notasZona: 'Mix universitario (UMCE, Católica San Joaquín cercana) + residencial alto. Plaza activa fines de semana. Crecimiento demanda 4% anual proyectado.',
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
    combosDiaBase: 130, combosDiaPesimista: 80, combosDiaOptimista: 200,
    notasZona: 'Máximo flujo peatonal RM (95k pax/día). Mix laboral + turismo + transit. Ticket bajo. Alta competencia (145 cafés/km²). Volumen alto compensa pero margen presionado.',
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
    combosDiaBase: 110, combosDiaPesimista: 60, combosDiaOptimista: 180,
    notasZona: 'USACH + Estación Central intermodal 19.5M pax/año. Ticket bajo, alta rotación. Estacional fuerte (caída en período sin clases dic-feb).',
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

  let creditoFiscal = 0;
  for (let t = 1; t <= HORIZONTE_ANOS; t += 1) {
    const factorDemanda = Math.pow(1 + gDemanda, t - 1);
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
