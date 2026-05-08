/**
 * MODELO FINANCIERO CORREGIDO — Cafetería Combo Único Envasado
 *
 * Este módulo es la fuente de verdad única que usan tanto los scripts (Excel,
 * Word) como la aplicación web. Calibrado contra realidad operativa retail
 * food Chile 2025 después de auditoría de modelo previo cuyo VAN era ~5x
 * sobre lo realista.
 *
 * Cambios clave vs versión anterior:
 *  1. Costo variable subido de $1,100 → $1,500-1,800 según zona (margen 50-60%)
 *  2. Costos fijos no laborales subidos de $350k → ~$850k (incluye marketing,
 *     aseo, seguros, software, contador, mantenciones provisión)
 *  3. Comisión tarjetas 2.8% sobre ingresos (Transbank/Getnet)
 *  4. Crecimiento demanda 2.5% (no 5%) acorde a sectorial cafetería sin
 *     reinversión
 *  5. Valor terminal: múltiplo de EBITDA (3.5x) en lugar de Gordon Growth
 *     perpetuo. Una cafetería independiente NO opera para siempre.
 *  6. Tcc subida de 11.5% → 14% para reflejar riesgo retail food real
 *  7. Reposición CAPEX en año 7 prevista (parcial vía depreciación renovada)
 */

// ============================================================
// CONSTANTES MACRO
// ============================================================
export const UF = 39_500;
export const IMM = 510_636;
export const TASA_IMPUESTO = 0.25; // Pro PYME 14 D N°3
export const TASA_IVA = 0.19;

// Tasa de descuento corregida (CAPM-ish)
// Rf 5.5% (BTU 10y) + β 1.3 × ERP 6.5% + país 0% = 13.95%
export const TCC = 0.14;

// Crecimiento demanda año a año (sectorial cafetería 2-3% real)
export const G_DEMANDA = 0.025;

// Múltiplo de EBITDA para valor terminal (rango cafés Chile: 3-5x)
export const MULT_EBITDA_TERMINAL = 3.5;

// Comisión tarjetas (% ventas, sobre 80% pago electrónico × 3.5%)
export const COMISION_TARJETAS = 0.028;

// Horizonte de evaluación
export const HORIZONTE_ANOS = 5;

// Días operación
export const DIAS_OPER_ANO = 312; // 6 días/sem × 52

// ============================================================
// CARGAS PATRONALES (factor sobre bruto)
// ============================================================
export const CARGAS = {
  afcEmp: 0.024,
  sis: 0.0185,
  mutual: 0.0095,
  gratif: 0.25,
  vacac: 0.0833,
  iAS: 0.0833,
};
const TOPE_GRATIF_MENSUAL = (IMM * 4.75) / 12;
export function costoEmpresa(brutoMensual) {
  const gratif = Math.min(brutoMensual * CARGAS.gratif, TOPE_GRATIF_MENSUAL);
  return brutoMensual * (1 + CARGAS.afcEmp + CARGAS.sis + CARGAS.mutual + CARGAS.vacac + CARGAS.iAS) + gratif;
}

// ============================================================
// PLANILLA REAL (3 personas, sueldos sector hostelería 2025)
// ============================================================
export const PLANILLA = [
  { cargo: 'Barista jefe (manipulador certificado)', cantidad: 1, brutoMensual: 850_000 },
  { cargo: 'Barista turno tarde (manipulador certificado)', cantidad: 1, brutoMensual: 650_000 },
  { cargo: 'Reemplazo / aseo (½ jornada)', cantidad: 1, brutoMensual: 510_636 },
];
export const PLANILLA_MENSUAL_TOTAL = PLANILLA.reduce(
  (s, p) => s + p.cantidad * costoEmpresa(p.brutoMensual), 0
);

// ============================================================
// COSTOS FIJOS NO LABORALES (CORREGIDOS — antes solo $350k)
// ============================================================
export const COSTOS_FIJOS_NO_LAB = {
  serviciosBasicos: 250_000,    // luz, gas, agua, internet (32m²)
  marketing: 200_000,           // SEM, redes, fidelización, materiales
  aseoYpest: 100_000,           // limpieza profesional + pest control
  softwareYContador: 150_000,   // POS + facturación + contador externo
  segurosYmantenciones: 150_000, // multiriesgo + provisión mantenciones equipos
  // Subtotal: $850.000/mes
};
export const COSTOS_FIJOS_NO_LAB_TOTAL = Object.values(COSTOS_FIJOS_NO_LAB)
  .reduce((s, v) => s + v, 0);

// ============================================================
// INVERSIÓN INICIAL (sin cambios, cotizaciones reales 2025)
// ============================================================
export const INVERSION = [
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
export const CAPEX = INVERSION.reduce((s, i) => s + i.costoCLP, 0);
export const VIDA_PROMEDIO = Math.round(
  INVERSION.reduce((s, i) => s + i.vidaUtil * i.costoCLP, 0) / CAPEX
);
export const DEP_ANUAL = CAPEX / VIDA_PROMEDIO;

// Valor libro al cabo de `ano` años (depreciación SLN activo-por-activo)
export function valorLibroEnAno(ano) {
  return INVERSION.reduce((s, item) => {
    if (ano >= item.vidaUtil) return s;
    const depAcum = (item.costoCLP / item.vidaUtil) * ano;
    return s + (item.costoCLP - depAcum);
  }, 0);
}

// Valor recupero al vender activos (60% del valor libro — haircut por mercado secundario)
export function valorRecuperoActivos(ano) {
  return valorLibroEnAno(ano) * 0.60;
}

// ============================================================
// CURVA DE RAMP-UP año a año (Achiga 2024 retail food)
// ============================================================
export const FACTOR_RAMPUP = { 1: 0.55, 2: 0.75, 3: 0.90, 4: 1.00, 5: 1.00 };

// Penalización por densidad de competencia (fair share competitivo)
// factor = sqrt(50 / max(densidad, 30)) — referencia 50 cafés/km² zona promedio
export function factorCompetencia(densidadCafesKm2) {
  return Math.min(1, Math.sqrt(50 / Math.max(densidadCafesKm2, 30)));
}

function calcCombosBase(flujo, captura, capacidad, densidadCompet) {
  const penal = densidadCompet ? factorCompetencia(densidadCompet) : 1;
  return Math.round(Math.min(flujo * captura * penal, capacidad));
}

// ============================================================
// 7 UBICACIONES — calibradas con flujo peatonal × tasa captura
// ============================================================
// Tasas de captura típicas (Procafé 2024):
//   · Zonas laborales premium:   0.45 - 0.65%
//   · Zonas mixtas con compet.:  0.40 - 0.55%
//   · Zonas residenciales/plaza: 0.45 - 0.60%
//   · Transit hub (Metro):       0.18 - 0.30%
//   · Universitarias:            0.30 - 0.45%
// ============================================================
export const UBICACIONES = [
  {
    id: 'el_golf',
    nombre: 'El Golf · Las Condes',
    comuna: 'Las Condes',
    direccion_referencia: 'Av. Apoquindo 5300 - 5800',
    lat: -33.4172,
    lng: -70.5852,
    arriendoUFm2: 0.95,
    m2: 35,
    gastosComunesCLP: 220_000,
    contribucionesMensualCLP: 95_000,
    flujoPeatonalDia: 28_000,
    densidadCompetenciaKm2: 65,
    ingresoMedioComuna: 3_650_000,
    metrosAEstacionMetro: 180,
    ticketPromedio: 4_500,
    costoVariableUnitario: 1_700,
    tasaCapturaMadura: 0.0055, capacidadMaxDiaria: 220,
    crecimientoPoblacionalAnual: -0.005,
    combosDiaBase: calcCombosBase(28_000, 0.0055, 220, 65),
    combosDiaPesimista: calcCombosBase(28_000, 0.0036, 220, 65),
    combosDiaOptimista: calcCombosBase(28_000, 0.0072, 220, 65),
    notasZona: 'Oficinas torre AAA. Ejecutivos. Peak 8:30, 13:00, 16:30. Ticket alto pero demanda concentrada lunes-viernes (sábado cae 60%, domingo cero). Riesgo: dependencia 100% de oficinas.',
  },
  {
    id: 'apoquindo',
    nombre: 'Apoquindo / El Bosque · Las Condes',
    comuna: 'Las Condes',
    direccion_referencia: 'Apoquindo 4000 - 4900',
    lat: -33.4093,
    lng: -70.5731,
    arriendoUFm2: 0.75,
    m2: 35,
    gastosComunesCLP: 180_000,
    contribucionesMensualCLP: 75_000,
    flujoPeatonalDia: 35_000,
    densidadCompetenciaKm2: 78,
    ingresoMedioComuna: 3_650_000,
    metrosAEstacionMetro: 220,
    ticketPromedio: 3_800,
    costoVariableUnitario: 1_550,
    tasaCapturaMadura: 0.0045, capacidadMaxDiaria: 220,
    crecimientoPoblacionalAnual: -0.005,
    combosDiaBase: calcCombosBase(35_000, 0.0045, 220, 78),
    combosDiaPesimista: calcCombosBase(35_000, 0.0029, 220, 78),
    combosDiaOptimista: calcCombosBase(35_000, 0.0058, 220, 78),
    notasZona: 'Mix oficinas + retail + residencial alto. Estación Tobalaba 22M pax/año. Alta competencia (Starbucks, Juan Valdez, Café Capital). Margen presionado.',
  },
  {
    id: 'vitacura',
    nombre: 'Vitacura · Alonso de Córdova',
    comuna: 'Vitacura',
    direccion_referencia: 'Alonso de Córdova 3000 - 4500',
    lat: -33.3950,
    lng: -70.5895,
    arriendoUFm2: 0.80,
    m2: 35,
    gastosComunesCLP: 200_000,
    contribucionesMensualCLP: 90_000,
    flujoPeatonalDia: 22_000,
    densidadCompetenciaKm2: 52,
    ingresoMedioComuna: 4_520_000,
    metrosAEstacionMetro: 850,
    ticketPromedio: 4_200,
    costoVariableUnitario: 1_650,
    tasaCapturaMadura: 0.0055, capacidadMaxDiaria: 200,
    crecimientoPoblacionalAnual: -0.003,
    combosDiaBase: calcCombosBase(22_000, 0.0055, 200, 52),
    combosDiaPesimista: calcCombosBase(22_000, 0.0036, 200, 52),
    combosDiaOptimista: calcCombosBase(22_000, 0.0072, 200, 52),
    notasZona: 'Mall Parque Arauco aledaño + corporativo. Ticket muy alto. Dependencia de Mall (estacional). Sin Metro cercano = depende de auto.',
  },
  {
    id: 'providencia',
    nombre: 'Providencia · Pedro de Valdivia',
    comuna: 'Providencia',
    direccion_referencia: 'Pedro de Valdivia 1700 - 2400',
    lat: -33.4250,
    lng: -70.6105,
    arriendoUFm2: 0.65,
    m2: 35,
    gastosComunesCLP: 150_000,
    contribucionesMensualCLP: 65_000,
    flujoPeatonalDia: 38_000,
    densidadCompetenciaKm2: 92,
    ingresoMedioComuna: 2_980_000,
    metrosAEstacionMetro: 95,
    ticketPromedio: 3_700,
    costoVariableUnitario: 1_500,
    tasaCapturaMadura: 0.0048, capacidadMaxDiaria: 240,
    crecimientoPoblacionalAnual: 0.015,
    combosDiaBase: calcCombosBase(38_000, 0.0048, 240, 92),
    combosDiaPesimista: calcCombosBase(38_000, 0.0031, 240, 92),
    combosDiaOptimista: calcCombosBase(38_000, 0.0062, 240, 92),
    notasZona: 'Mix oficinas + residencial. Estación Pedro de Valdivia 9.5M pax/año. Mayor competencia RM (riesgo). Cliente potencialmente leal por barrio establecido.',
  },
  {
    id: 'nunoa_plaza',
    nombre: 'Ñuñoa · Plaza Ñuñoa',
    comuna: 'Ñuñoa',
    direccion_referencia: 'Av. Irarrázaval 2700 - 3200',
    lat: -33.4565,
    lng: -70.5965,
    arriendoUFm2: 0.48,
    m2: 35,
    gastosComunesCLP: 110_000,
    contribucionesMensualCLP: 50_000,
    flujoPeatonalDia: 24_000,
    densidadCompetenciaKm2: 48,
    ingresoMedioComuna: 1_990_000,
    metrosAEstacionMetro: 320,
    ticketPromedio: 3_300,
    costoVariableUnitario: 1_400,
    tasaCapturaMadura: 0.0058, capacidadMaxDiaria: 200,
    crecimientoPoblacionalAnual: 0.013,
    combosDiaBase: calcCombosBase(24_000, 0.0058, 200, 48),
    combosDiaPesimista: calcCombosBase(24_000, 0.0038, 200, 48),
    combosDiaOptimista: calcCombosBase(24_000, 0.0075, 200, 48),
    notasZona: 'Mix universitario (UMCE, Católica San Joaquín cercana) + residencial alto. Plaza activa fines de semana. Crecimiento demanda 4% anual proyectado.',
  },
  {
    id: 'santiago_centro',
    nombre: 'Santiago Centro · Ahumada',
    comuna: 'Santiago',
    direccion_referencia: 'Paseo Ahumada / Estado',
    lat: -33.4380,
    lng: -70.6505,
    arriendoUFm2: 0.55,
    m2: 30,
    gastosComunesCLP: 140_000,
    contribucionesMensualCLP: 55_000,
    flujoPeatonalDia: 95_000,
    densidadCompetenciaKm2: 145,
    ingresoMedioComuna: 1_380_000,
    metrosAEstacionMetro: 80,
    ticketPromedio: 2_900,
    costoVariableUnitario: 1_350,
    tasaCapturaMadura: 0.0022, capacidadMaxDiaria: 280,
    crecimientoPoblacionalAnual: 0.025,
    combosDiaBase: calcCombosBase(95_000, 0.0022, 280, 145),
    combosDiaPesimista: calcCombosBase(95_000, 0.0014, 280, 145),
    combosDiaOptimista: calcCombosBase(95_000, 0.0029, 280, 145),
    notasZona: 'Máximo flujo peatonal RM (95k pax/día). Mix laboral + turismo + transit. Ticket bajo. Alta competencia (145 cafés/km²). Volumen alto compensa pero margen presionado.',
  },
  {
    id: 'estacion_central',
    nombre: 'Estación Central · USACH',
    comuna: 'Estación Central',
    direccion_referencia: 'Av. Bdo OHiggins 3300 - 3700',
    lat: -33.4515,
    lng: -70.6800,
    arriendoUFm2: 0.38,
    m2: 30,
    gastosComunesCLP: 80_000,
    contribucionesMensualCLP: 35_000,
    flujoPeatonalDia: 42_000,
    densidadCompetenciaKm2: 32,
    ingresoMedioComuna: 1_050_000,
    metrosAEstacionMetro: 150,
    ticketPromedio: 2_700,
    costoVariableUnitario: 1_300,
    tasaCapturaMadura: 0.0035, capacidadMaxDiaria: 240,
    crecimientoPoblacionalAnual: 0.030,
    combosDiaBase: calcCombosBase(42_000, 0.0035, 240, 32),
    combosDiaPesimista: calcCombosBase(42_000, 0.0023, 240, 32),
    combosDiaOptimista: calcCombosBase(42_000, 0.0046, 240, 32),
    notasZona: 'USACH + Estación Central intermodal 19.5M pax/año. Ticket bajo, alta rotación. Estacional fuerte (caída en período sin clases dic-feb).',
  },
];

// ============================================================
// FUNCIÓN CENTRAL: CALCULAR VAN/TIR/PAYBACK POR UBICACIÓN
// ============================================================
/**
 * Calcula el flujo de caja puro a 5 años + valor terminal por múltiplo
 * de EBITDA y devuelve indicadores financieros.
 *
 * @param {object} u - ubicación con todos los parámetros
 * @param {string} escenario - 'base' | 'pesimista' | 'optimista'
 * @returns {object} resultado con van, tir, payback, flujos, EBITDA, etc.
 */
export function calcularUbicacion(u, escenario = 'base') {
  const escKey = 'combosDia' + escenario.charAt(0).toUpperCase() + escenario.slice(1);
  const combosDia = u[escKey] ?? u.combosDiaBase;

  const arriendoMensual = u.arriendoUFm2 * u.m2 * UF;
  const cv = u.costoVariableUnitario;

  // Costos fijos NO laborales por ubicación
  // = arriendo + gastos comunes + contribuciones + servicios + marketing + aseo + software + seguros
  const costosFijosNoLab = arriendoMensual
    + u.gastosComunesCLP
    + u.contribucionesMensualCLP
    + COSTOS_FIJOS_NO_LAB_TOTAL;

  const costosFijosTotal = costosFijosNoLab + PLANILLA_MENSUAL_TOTAL;

  // Capital trabajo: 2.5 meses de egresos (más realista que 4)
  const egresosAnualesAprox = costosFijosTotal * 12 + cv * combosDia * DIAS_OPER_ANO;
  const KT = Math.round((egresosAnualesAprox / 12) * 2.5);
  const inversionTotal = CAPEX + KT;

  const flujos = [-inversionTotal];
  const detalleAnual = [{
    ano: 0,
    combos: 0, ingresos: 0, cv: 0, cf: 0, comisiones: 0,
    ebitda: 0, depreciacion: 0, ebit: 0, impuesto: 0,
    utilidadNeta: 0, flujoOper: 0, flujoNeto: -inversionTotal,
  }];

  // Crecimiento efectivo por zona = max(g_pobl_INE + g_sectorial × 0.5, supuesto)
  const gSectorial = 0.03;
  const gZona = (u.crecimientoPoblacionalAnual ?? 0) + gSectorial * 0.5;
  const gEfectivo = Math.max(gZona, G_DEMANDA);

  let creditoFiscal = 0;
  for (let t = 1; t <= HORIZONTE_ANOS; t += 1) {
    // Ramp-up: año 1 captura 55%, año 2 75%, año 3 90%, año 4-5 100% (+ g)
    const ramp = FACTOR_RAMPUP[t] ?? 1.0;
    const factorDemanda = ramp * Math.pow(1 + gEfectivo, Math.max(0, t - 4));
    const combosAno = combosDia * DIAS_OPER_ANO * factorDemanda;
    const ingresos = combosAno * u.ticketPromedio;
    const cvTotal = combosAno * cv;
    const cfTotal = costosFijosTotal * 12;
    const comisiones = ingresos * COMISION_TARJETAS;
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
    if (t === HORIZONTE_ANOS) {
      // Recupero capital de trabajo
      flujoNeto += KT;
      // Valor residual: ahora calculado activo-por-activo (no 10% lineal del CAPEX).
      // Captura que la habilitación (vida 20) y mobiliario (vida 10) conservan valor
      // libro al cabo de 5 años. Venta a 60% del valor libro (haircut de mercado).
      const venta = valorRecuperoActivos(HORIZONTE_ANOS);
      const valorLibro = valorLibroEnAno(HORIZONTE_ANOS);
      const gananciaCapital = venta - valorLibro;
      const impGanancia = gananciaCapital > 0 ? gananciaCapital * TASA_IMPUESTO : 0;
      const escudoPerdida = gananciaCapital < 0 ? -gananciaCapital * TASA_IMPUESTO : 0;
      const valorResidualNeto = venta - impGanancia + escudoPerdida;
      flujoNeto += valorResidualNeto;
      // Valor terminal: múltiplo de EBITDA año 5 (NO Gordon Growth)
      const valorTerminalNeto = ebitda * MULT_EBITDA_TERMINAL * (1 - TASA_IMPUESTO);
      flujoNeto += valorTerminalNeto;

      detalleAnual.push({
        ano: t, combos: combosAno, ingresos, cv: cvTotal, cf: cfTotal,
        comisiones, ebitda, depreciacion: dep, ebit, impuesto: imp,
        utilidadNeta, flujoOper,
        recuperoKT: KT, valorResidual: valorResidualNeto,
        valorTerminal: valorTerminalNeto,
        flujoNeto,
      });
    } else {
      detalleAnual.push({
        ano: t, combos: combosAno, ingresos, cv: cvTotal, cf: cfTotal,
        comisiones, ebitda, depreciacion: dep, ebit, impuesto: imp,
        utilidadNeta, flujoOper, flujoNeto,
      });
    }

    flujos.push(flujoNeto);
  }

  // VAN
  const van = flujos.reduce((s, f, i) => s + f / Math.pow(1 + TCC, i), 0);

  // TIR Newton-Raphson
  const tir = calcularTIR(flujos);

  // Payback (interpolado)
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
    ingresosAno1: Math.round(combosDia * DIAS_OPER_ANO * u.ticketPromedio),
    ebitdaAno1: Math.round(detalleAnual[1].ebitda),
    margenContrib: (u.ticketPromedio - cv) / u.ticketPromedio,
  };
}

function calcularTIR(cashflows, guess = 0.15) {
  // Si la suma de flujos es negativa el proyecto no repaga la inversión
  // ni siquiera sin descuento → no existe TIR real positiva
  const sum = cashflows.reduce((s, v) => s + v, 0);
  if (sum < 0) return NaN;

  // Verificar al menos un cambio de signo (condición necesaria)
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
    if (Math.abs(f) < 1) return r; // CLP, tolerancia $1
    if (df === 0) return NaN;
    const nuevoR = r - f / df;
    if (!Number.isFinite(nuevoR) || nuevoR <= -0.99 || nuevoR > 10) return NaN;
    r = nuevoR;
  }
  return NaN;
}

// ============================================================
// CALCULAR TODAS LAS UBICACIONES (3 escenarios c/u)
// ============================================================
export function calcularTodas() {
  return UBICACIONES.map((u) => {
    const base = calcularUbicacion(u, 'base');
    const pes = calcularUbicacion(u, 'pesimista');
    const opt = calcularUbicacion(u, 'optimista');
    return { u, base, pes, opt };
  });
}

// ============================================================
// SCORE COMPUESTO 0-100 (para ranking visual)
// ============================================================
// Filosofía: el VAN base es el filtro principal. Si es negativo el score
// nunca debe pasar de 49 (zona de rojo) por más que la competencia o
// el flujo peatonal sean buenos. La calidad de zona es secundaria al
// resultado financiero.
export function scoreUbicacion(resultado) {
  const { u, base, pes } = resultado;

  // Score financiero (peso 70 pts) — basado en VAN, TIR, payback
  const sVAN = clamp(base.van / 100_000_000, -1, 1) * 35;        // VAN: ±$100M → ±35 pts
  const tirSafe = Number.isFinite(base.tir) ? base.tir : -0.5;
  const sTIR = clamp((tirSafe - TCC) / 0.30, -1, 1) * 20;        // exceso TIR ±30% → ±20 pts
  const sPayback = !Number.isFinite(base.payback) || base.payback < 0 ? -15
                   : clamp((4 - base.payback) / 4, -1, 1) * 15;
  const sResiliencia = pes.van > 0 ? 10
                       : pes.van > -base.inversionTotal * 0.3 ? 5 : -5;

  // Score cualitativo (peso 30 pts) — características de la zona
  const sCompetencia = clamp((100 - u.densidadCompetenciaKm2) / 100, 0, 1) * 8;
  const sFlujo = clamp(u.flujoPeatonalDia / 50_000, 0, 1) * 7;

  let score = Math.round(50 + sVAN + sTIR + sPayback + sResiliencia + sCompetencia + sFlujo);

  // Tope duro: si VAN base ≤ 0 el score no supera 49 (banda roja)
  if (base.van <= 0) score = Math.min(score, 49);
  // Tope: si VAN pesimista pierde >50% inversión, score no supera 65
  if (pes.van < -base.inversionTotal * 0.5) score = Math.min(score, 65);

  return clamp(score, 0, 100);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// ============================================================
// VEREDICTO POR UBICACIÓN
// ============================================================
export function veredicto(resultado) {
  const score = scoreUbicacion(resultado);
  if (score >= 70 && resultado.base.van > 0 && resultado.pes.van > 0) {
    return { texto: 'Recomendado', tono: 'positivo', score };
  }
  if (score >= 55 && resultado.base.van > 0) {
    return { texto: 'Aceptable con riesgo', tono: 'neutral', score };
  }
  return { texto: 'No conviene', tono: 'negativo', score };
}
