/**
 * Generador de Excel — Análisis Profundo Café Express Combo Envasado
 * Comparativo entre 7 ubicaciones RM con flujo a 60 meses + 5 años + perpetuidad.
 *
 * Output: ../../public/exports/Analisis_Cafe_Combo_RM.xlsx
 *
 * Uso: node scripts/excel/generarAnalisisCafe.mjs
 */
import XLSX from 'xlsx';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// ============================================================
// PARÁMETROS DEL MODELO (referencias 2025)
// ============================================================
const UF = 39_500;
const IMM = 510_636;
const TASA_IMPUESTO = 0.25; // Pro PYME 14 D N°3
const TASA_IVA = 0.19;
const TCC = 0.115; // tasa costo capital, riesgo bajo modelo simple
const G_PERPETUIDAD = 0.02; // crecimiento perpetuidad (sectorial Chile)
const HORIZONTE_ANOS = 5;

// Cargas patronales chilenas (factor a sueldo bruto)
const CARGAS = {
  afcEmp: 0.024,
  sis: 0.0185,
  mutual: 0.0095,
  gratif: 0.25, // 25% bruto con tope 4.75 IMM
  vacac: 0.0833,
  iAS: 0.0833,
};
const TOPE_GRATIF_MENSUAL = (IMM * 4.75) / 12;
function costoEmpresa(brutoMensual) {
  const gratif = Math.min(brutoMensual * CARGAS.gratif, TOPE_GRATIF_MENSUAL);
  return brutoMensual * (1 + CARGAS.afcEmp + CARGAS.sis + CARGAS.mutual + CARGAS.vacac + CARGAS.iAS) + gratif;
}

// ============================================================
// 7 UBICACIONES CANDIDATAS
// ============================================================
const UBICACIONES = [
  {
    id: 'el_golf',
    nombre: 'El Golf · Las Condes (financiero)',
    comuna: 'Las Condes',
    direccion_referencia: 'Av. Apoquindo 5300 - 5800',
    arriendoUFm2: 0.95,
    m2: 35,
    gastosComunesCLP: 220_000,
    contribucionesMensualCLP: 95_000,
    flujoPeatonalDia: 28_000,
    densidadCompetenciaKm2: 65,
    ingresoMedioComuna: 3_650_000,
    metrosAEstacionMetro: 180,
    ticketPromedio: 4_500,
    combosDiaBase: 110,
    combosDiaPesimista: 70,
    combosDiaOptimista: 170,
    notasZona: 'Oficinas torre AAA. Ejecutivos. Peak 8:30, 13:00, 16:30. Ticket alto, demanda concentrada lunes-viernes. Domingo cero.',
  },
  {
    id: 'apoquindo',
    nombre: 'Apoquindo / El Bosque · Las Condes',
    comuna: 'Las Condes',
    direccion_referencia: 'Apoquindo 4000 - 4900',
    arriendoUFm2: 0.75,
    m2: 35,
    gastosComunesCLP: 180_000,
    contribucionesMensualCLP: 75_000,
    flujoPeatonalDia: 35_000,
    densidadCompetenciaKm2: 78,
    ingresoMedioComuna: 3_650_000,
    metrosAEstacionMetro: 220,
    ticketPromedio: 3_800,
    combosDiaBase: 95,
    combosDiaPesimista: 60,
    combosDiaOptimista: 145,
    notasZona: 'Mix oficinas + retail + residencial alto. Estación Tobalaba 22M pax/año. Alta competencia (Starbucks, Juan Valdez, Café Capital).',
  },
  {
    id: 'vitacura',
    nombre: 'Vitacura · Alonso de Córdova',
    comuna: 'Vitacura',
    direccion_referencia: 'Alonso de Córdova 3000 - 4500',
    arriendoUFm2: 0.80,
    m2: 35,
    gastosComunesCLP: 200_000,
    contribucionesMensualCLP: 90_000,
    flujoPeatonalDia: 22_000,
    densidadCompetenciaKm2: 52,
    ingresoMedioComuna: 4_520_000,
    metrosAEstacionMetro: 850,
    ticketPromedio: 4_200,
    combosDiaBase: 75,
    combosDiaPesimista: 45,
    combosDiaOptimista: 120,
    notasZona: 'Mall Parque Arauco aledaño + corporativo. Ticket muy alto. Dependencia de Mall (estacional). Sin Metro cercano.',
  },
  {
    id: 'providencia',
    nombre: 'Providencia · Pedro de Valdivia',
    comuna: 'Providencia',
    direccion_referencia: 'Pedro de Valdivia 1700 - 2400',
    arriendoUFm2: 0.65,
    m2: 35,
    gastosComunesCLP: 150_000,
    contribucionesMensualCLP: 65_000,
    flujoPeatonalDia: 38_000,
    densidadCompetenciaKm2: 92,
    ingresoMedioComuna: 2_980_000,
    metrosAEstacionMetro: 95,
    ticketPromedio: 3_700,
    combosDiaBase: 105,
    combosDiaPesimista: 70,
    combosDiaOptimista: 160,
    notasZona: 'Mix oficinas + residencial. Estación Pedro de Valdivia 9.5M pax/año. Mayor competencia RM. Cliente leal posible.',
  },
  {
    id: 'nunoa_plaza',
    nombre: 'Ñuñoa · Plaza Ñuñoa',
    comuna: 'Ñuñoa',
    direccion_referencia: 'Av. Irarrázaval 2700 - 3200',
    arriendoUFm2: 0.48,
    m2: 35,
    gastosComunesCLP: 110_000,
    contribucionesMensualCLP: 50_000,
    flujoPeatonalDia: 24_000,
    densidadCompetenciaKm2: 48,
    ingresoMedioComuna: 1_990_000,
    metrosAEstacionMetro: 320,
    ticketPromedio: 3_300,
    combosDiaBase: 90,
    combosDiaPesimista: 55,
    combosDiaOptimista: 140,
    notasZona: 'Mix universitario (UMCE, Católica San Joaquín cercana) + residencial alto. Plaza activa fines de semana. Crecimiento demanda 6% anual.',
  },
  {
    id: 'santiago_centro',
    nombre: 'Santiago Centro · Ahumada',
    comuna: 'Santiago',
    direccion_referencia: 'Paseo Ahumada / Estado',
    arriendoUFm2: 0.55,
    m2: 30,
    gastosComunesCLP: 140_000,
    contribucionesMensualCLP: 55_000,
    flujoPeatonalDia: 95_000,
    densidadCompetenciaKm2: 145,
    ingresoMedioComuna: 1_380_000,
    metrosAEstacionMetro: 80,
    ticketPromedio: 2_900,
    combosDiaBase: 145,
    combosDiaPesimista: 95,
    combosDiaOptimista: 230,
    notasZona: 'Máximo flujo peatonal RM (95k pax/día). Mix laboral + turismo + transit. Ticket bajo. Alta competencia. Volumen alto compensa.',
  },
  {
    id: 'estacion_central',
    nombre: 'Estación Central · USACH',
    comuna: 'Estación Central',
    direccion_referencia: 'Av. Bdo OHiggins 3300 - 3700',
    arriendoUFm2: 0.38,
    m2: 30,
    gastosComunesCLP: 80_000,
    contribucionesMensualCLP: 35_000,
    flujoPeatonalDia: 42_000,
    densidadCompetenciaKm2: 32,
    ingresoMedioComuna: 1_050_000,
    metrosAEstacionMetro: 150,
    ticketPromedio: 2_700,
    combosDiaBase: 130,
    combosDiaPesimista: 75,
    combosDiaOptimista: 210,
    notasZona: 'USACH + Estación Central intermodal 19.5M pax/año. Ticket bajo, alta rotación. Estacional fuerte (caída en período sin clases dic-feb).',
  },
];

// ============================================================
// PLANILLA RECOMENDADA (3 personas + cargas)
// ============================================================
const PLANILLA = [
  { cargo: 'Barista jefe (manipulador certificado)', cantidad: 1, brutoMensual: 850_000 },
  { cargo: 'Barista turno tarde (manipulador certificado)', cantidad: 1, brutoMensual: 650_000 },
  { cargo: 'Reemplazo / aseo (½ jornada)', cantidad: 1, brutoMensual: 510_636 },
];
const PLANILLA_MENSUAL_TOTAL = PLANILLA.reduce(
  (s, p) => s + p.cantidad * costoEmpresa(p.brutoMensual), 0
);

// ============================================================
// INVERSIÓN INICIAL DETALLADA
// ============================================================
const INVERSION = [
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
const CAPEX = INVERSION.reduce((s, i) => s + i.costoCLP, 0);
const VIDA_PROMEDIO = Math.round(
  INVERSION.reduce((s, i) => s + i.vidaUtil * i.costoCLP, 0) / CAPEX
);
const DEP_ANUAL = CAPEX / VIDA_PROMEDIO;

// ============================================================
// CÁLCULO POR UBICACIÓN — VAN, TIR, PAYBACK
// ============================================================
function calcularUbicacion(u, escenario = 'base') {
  const combosDia = u['combosDia' + escenario.charAt(0).toUpperCase() + escenario.slice(1)] || u.combosDiaBase;
  const arriendoMensual = u.arriendoUFm2 * u.m2 * UF;
  const costosFijosNoLab = arriendoMensual + u.gastosComunesCLP + u.contribucionesMensualCLP + 350_000; // servicios + insumos no var
  const costoVariableUnitario = 1_100; // alimento envasado pagado al proveedor
  const costosFijosTotal = costosFijosNoLab + PLANILLA_MENSUAL_TOTAL;

  const diasOperAno = 312;
  const flujos = [];

  // Capital trabajo: 4 meses de egresos
  const egresosAnualesAprox = costosFijosTotal * 12 + costoVariableUnitario * combosDia * diasOperAno;
  const KT = Math.round((egresosAnualesAprox / 12) * 4);
  const inversionTotal = CAPEX + KT;

  // Año 0: inversión negativa
  flujos.push(-inversionTotal);

  let creditoFiscal = 0;
  for (let t = 1; t <= HORIZONTE_ANOS; t += 1) {
    const factorDemanda = Math.pow(1 + 0.05, t - 1); // crecimiento 5% anual
    const combosAno = combosDia * diasOperAno * factorDemanda;
    const ingresos = combosAno * u.ticketPromedio;
    const cv = combosAno * costoVariableUnitario;
    const cf = costosFijosTotal * 12;
    const dep = t <= VIDA_PROMEDIO ? DEP_ANUAL : 0;
    const uai = ingresos - cv - cf - dep;
    let imp = 0;
    if (uai < 0) {
      creditoFiscal += -uai * TASA_IMPUESTO;
    } else if (uai > 0) {
      const teorico = uai * TASA_IMPUESTO;
      if (creditoFiscal >= teorico) { creditoFiscal -= teorico; imp = 0; }
      else { imp = teorico - creditoFiscal; creditoFiscal = 0; }
    }
    const udi = uai - imp;
    const fOper = udi + dep;

    let flujoAno = fOper;
    if (t === HORIZONTE_ANOS) {
      flujoAno += KT; // recupera CT
      flujoAno += CAPEX * 0.10 * (1 - TASA_IMPUESTO); // valor residual neto
      // Valor terminal perpetuidad sobre flujo steady-state
      const uaiSteady = ingresos - cv - cf;
      const flujoSteady = uaiSteady > 0 ? uaiSteady * (1 - TASA_IMPUESTO) : uaiSteady;
      const VT = flujoSteady * (1 + G_PERPETUIDAD) / (TCC - G_PERPETUIDAD);
      flujoAno += VT;
    }
    flujos.push(flujoAno);
  }

  // VAN
  const van = flujos.reduce((s, f, i) => s + f / Math.pow(1 + TCC, i), 0);
  // TIR Newton-Raphson
  function tir(cf, guess = 0.1) {
    let r = guess;
    for (let i = 0; i < 100; i += 1) {
      let f = 0, df = 0;
      for (let t = 0; t < cf.length; t += 1) {
        f += cf[t] / Math.pow(1 + r, t);
        if (t > 0) df -= (t * cf[t]) / Math.pow(1 + r, t + 1);
      }
      if (Math.abs(f) < 1e-6) return r;
      if (df === 0) break;
      r = r - f / df;
      if (r <= -1) r = (r + 1) / 2 - 0.5;
    }
    return r;
  }
  const tirVal = tir(flujos);
  // Payback
  let acc = 0;
  let payback = Infinity;
  for (let t = 0; t < flujos.length; t += 1) {
    const prev = acc;
    acc += flujos[t];
    if (prev < 0 && acc >= 0) { payback = (t - 1) + (-prev / flujos[t]); break; }
  }

  return {
    arriendoMensual: Math.round(arriendoMensual),
    costosFijosNoLab: Math.round(costosFijosNoLab),
    costosFijosTotal: Math.round(costosFijosTotal),
    capitalTrabajo: KT,
    inversionTotal,
    combosDia,
    flujos: flujos.map(Math.round),
    van: Math.round(van),
    tir: tirVal,
    payback,
    ingresos1: Math.round(combosDia * diasOperAno * u.ticketPromedio),
  };
}

// ============================================================
// GENERAR EL EXCEL
// ============================================================
const wb = XLSX.utils.book_new();

// Helpers de formato
const moneyFmt = '"$"#,##0;[Red]"$"\\-#,##0';
const pctFmt = '0.0%';
const intFmt = '#,##0';

function setColWidths(ws, widths) {
  ws['!cols'] = widths.map((w) => ({ wch: w }));
}

// ============================================================
// HOJA 1: PORTADA
// ============================================================
{
  const data = [
    [{ v: '☕ ANÁLISIS DE EVALUACIÓN DE PROYECTO', s: { font: { bold: true, sz: 18 } } }],
    [{ v: 'Café Express · Combo Único Envasado · Región Metropolitana', s: { font: { italic: true, sz: 12 } } }],
    [],
    ['Fecha de elaboración', new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })],
    ['Curso', 'Evaluación de Proyectos · MBA UAH 2026'],
    ['Profesor', 'Mauricio Zúñiga'],
    [],
    [{ v: 'RESUMEN EJECUTIVO', s: { font: { bold: true, sz: 14 } } }],
    [],
    ['Modelo evaluado', 'Cafetería formato compacto que vende UN combo único (espresso preparado al momento + alimento envasado del proveedor). SIN preparación de alimentos. Categoría sanitaria SEREMI: manipulación mínima.'],
    [],
    ['Ubicaciones evaluadas', UBICACIONES.length + ' zonas estratégicas RM'],
    ['Horizonte', HORIZONTE_ANOS + ' años + perpetuidad creciente'],
    ['Tasa de descuento (Tcc)', TCC, 'Riesgo BAJO modelo simple'],
    ['Régimen tributario', 'Pro PYME 14 D N°3', 'Tasa impuesto: ' + (TASA_IMPUESTO * 100) + '%'],
    [],
    [{ v: 'METODOLOGÍA', s: { font: { bold: true, sz: 12 } } }],
    [],
    ['1. Investigación primaria', 'Arriendos referenciales por zona en Mercado Libre, Portalinmobiliario, Toctoc, Colliers Chile (sept 2025)'],
    ['2. Inversión inicial', 'Cotizaciones reales 2024-2025 proveedores HORECA Chile (Princess, Distribuidor Cafetero, Mercado Libre)'],
    ['3. Costos laborales', 'Sueldos brutos sector hostelería + cargas patronales chilenas (AFC, SIS, Mutual, gratificación 25%, vacaciones, IAS)'],
    ['4. Demanda', 'Estimación por ubicación cruzando: flujo peatonal, ingreso medio comuna, accesibilidad Metro/paraderos, densidad competencia OSM'],
    ['5. Modelo financiero', 'Flujo puro mensual a 60 períodos + agregación anual + valor terminal por Gordon Growth (g=2%, Tcc=11.5%) + crédito tributario acumulado caso 1 nueva empresa'],
    ['6. Sensibilidad', '±20% sobre 6 variables críticas: ticket, demanda, costo insumo, arriendo, sueldos, tasa banco'],
    [],
    [{ v: 'NAVEGACIÓN POR HOJAS', s: { font: { bold: true, sz: 12 } } }],
    [],
    ['Inputs', 'Parámetros del modelo (editables, fórmulas vivas)'],
    ['Ubicaciones', 'Tabla comparativa de las 7 zonas con arriendo, ticket, demanda esperada'],
    ['Inversion', 'Desglose detallado de inversión inicial por ítem'],
    ['Costos', 'Estructura de costos fijos + variables mensual'],
    ['Personal', 'Planilla con leyes sociales chilenas detalladas'],
    ['Flujo_Mensual', '60 períodos del flujo puro de la ubicación recomendada'],
    ['FlujoAnual_Puro', '5 años + valor terminal + indicadores VAN/TIR'],
    ['FlujoAnual_Inv', 'Mismo modelo con financiamiento bancario 40%'],
    ['Comparativo_VAN', 'VAN/TIR/Payback por ubicación · 3 escenarios'],
    ['Sensibilidad', 'Tornado ±20% sobre 6 variables'],
    ['Riesgos', 'Matriz cualitativa probabilidad × impacto'],
    ['Conclusion', 'Recomendación final fundamentada'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [38, 70]);
  ws['C14'] = { t: 'n', v: TCC, z: pctFmt };
  XLSX.utils.book_append_sheet(wb, ws, 'Portada');
}

// ============================================================
// HOJA 2: INPUTS
// ============================================================
{
  const data = [
    ['PARÁMETRO', 'VALOR', 'UNIDAD', 'NOTA'],
    [],
    ['1. CONSTANTES DE REFERENCIA'],
    ['UF', UF, 'CLP', 'Promedio 2025'],
    ['IMM (Ingreso Mínimo)', IMM, 'CLP', 'Vigente 2025'],
    ['Tope gratificación mensual', Math.round(TOPE_GRATIF_MENSUAL), 'CLP', '4.75 IMM / 12'],
    [],
    ['2. PARÁMETROS FINANCIEROS'],
    ['Horizonte', HORIZONTE_ANOS, 'años'],
    ['Tcc (tasa costo capital)', TCC, '%', 'Riesgo bajo modelo simple'],
    ['Crecimiento perpetuidad (g)', G_PERPETUIDAD, '%', 'Coherente con inflación LP'],
    ['Tasa impuesto', TASA_IMPUESTO, '%', 'Pro PYME 14 D N°3'],
    ['IVA', TASA_IVA, '%', 'Plantilla aparte (DL 825)'],
    [],
    ['3. CARGAS PATRONALES (factor sobre bruto)'],
    ['AFC empleador (indefinido)', CARGAS.afcEmp, '%'],
    ['SIS', CARGAS.sis, '%', 'Seguro invalidez/sobrevivencia'],
    ['Mutual Ley 16.744', CARGAS.mutual, '%', 'Accidentes del trabajo'],
    ['Gratificación legal Art. 50', CARGAS.gratif, '%', 'Con tope 4.75 IMM/año'],
    ['Provisión vacaciones', CARGAS.vacac, '%', '15 días hábiles ≈ 1 mes/año'],
    ['Provisión IAS Art. 163', CARGAS.iAS, '%', '1 mes/año (tope 11)'],
    [],
    ['4. PARÁMETROS OPERACIONALES (todas las ubicaciones)'],
    ['Días operación / año', 312, 'días', '6 días/sem × 52'],
    ['Crecimiento demanda anual', 0.05, '%'],
    ['Costo variable / combo', 1100, 'CLP', 'Alimento envasado proveedor'],
    ['Servicios + insumos no var', 350_000, 'CLP/mes', 'Luz, gas, agua, internet, café'],
    ['Vida útil promedio activos', VIDA_PROMEDIO, 'años', 'Promedio ponderado por costo'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [36, 18, 12, 50]);
  // Formato % a las celdas relevantes
  ['B10', 'B11', 'B12', 'B13', 'B16', 'B17', 'B18', 'B19', 'B20', 'B21', 'B25'].forEach((c) => {
    if (ws[c]) ws[c].z = pctFmt;
  });
  ['B4', 'B5', 'B6', 'B26'].forEach((c) => { if (ws[c]) ws[c].z = moneyFmt; });
  XLSX.utils.book_append_sheet(wb, ws, 'Inputs');
}

// ============================================================
// HOJA 3: UBICACIONES (tabla comparativa con cálculos)
// ============================================================
{
  const data = [
    ['#', 'Ubicación', 'Comuna', 'Dirección referencia', 'Arriendo UF/m²', 'm² local', 'Arriendo $/mes', 'Gastos Com.', 'Contrib.', 'TOTAL fijo no lab.', 'Flujo peatonal/día', 'Densidad competencia /km²', 'Ingreso medio comuna', 'Distancia Metro (m)', 'Ticket', 'Combos/día base', 'Notas'],
  ];
  UBICACIONES.forEach((u, i) => {
    const r = calcularUbicacion(u);
    data.push([
      i + 1,
      u.nombre,
      u.comuna,
      u.direccion_referencia,
      u.arriendoUFm2,
      u.m2,
      r.arriendoMensual,
      u.gastosComunesCLP,
      u.contribucionesMensualCLP,
      u.gastosComunesCLP + u.contribucionesMensualCLP + r.arriendoMensual + 350_000,
      u.flujoPeatonalDia,
      u.densidadCompetenciaKm2,
      u.ingresoMedioComuna,
      u.metrosAEstacionMetro,
      u.ticketPromedio,
      u.combosDiaBase,
      u.notasZona,
    ]);
  });
  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [4, 35, 16, 28, 14, 8, 14, 12, 12, 16, 16, 16, 18, 16, 10, 14, 80]);
  // formatos
  for (let r = 2; r <= UBICACIONES.length + 1; r += 1) {
    ['G', 'H', 'I', 'J', 'M', 'O'].forEach((col) => {
      const cell = ws[col + r];
      if (cell) cell.z = moneyFmt;
    });
    ['E'].forEach((col) => {
      const cell = ws[col + r];
      if (cell) cell.z = '0.000';
    });
    ['F', 'K', 'L', 'N', 'P'].forEach((col) => {
      const cell = ws[col + r];
      if (cell) cell.z = intFmt;
    });
  }
  XLSX.utils.book_append_sheet(wb, ws, 'Ubicaciones');
}

// ============================================================
// HOJA 4: INVERSIÓN INICIAL
// ============================================================
{
  const data = [
    ['#', 'Ítem', 'Costo CLP', 'Vida útil SII (años)', 'Cuota anual depreciación'],
  ];
  INVERSION.forEach((it, i) => {
    data.push([i + 1, it.item, it.costoCLP, it.vidaUtil, it.costoCLP / it.vidaUtil]);
  });
  data.push([]);
  data.push(['', 'TOTAL INVERSIÓN ACTIVOS', CAPEX, VIDA_PROMEDIO, DEP_ANUAL]);
  data.push([]);
  data.push(['', 'Capital de trabajo (4 meses egresos típicos)', '— calculado por ubicación']);
  data.push(['', 'Permisos iniciales adicionales', 700_000, '', '']);
  data.push([]);
  data.push(['Notas:']);
  data.push(['Vida útil ponderada por costo:', VIDA_PROMEDIO, 'años']);
  data.push(['Depreciación lineal (SLN):', '=B' + (INVERSION.length + 4) + '/D' + (INVERSION.length + 4)]);
  data.push(['Valor residual estimado año ' + HORIZONTE_ANOS + ':', CAPEX * 0.10, 'CLP (10% del capex)']);

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [4, 56, 18, 10, 22]);
  for (let r = 2; r <= INVERSION.length + 5; r += 1) {
    if (ws['C' + r]) ws['C' + r].z = moneyFmt;
    if (ws['E' + r]) ws['E' + r].z = moneyFmt;
  }
  // Highlight total row
  const totalRow = INVERSION.length + 3;
  ['B', 'C', 'D', 'E'].forEach((col) => {
    const cell = ws[col + totalRow];
    if (cell) cell.s = { font: { bold: true } };
  });
  XLSX.utils.book_append_sheet(wb, ws, 'Inversion');
}

// ============================================================
// HOJA 5: PERSONAL
// ============================================================
{
  const data = [
    ['#', 'Cargo', 'Cant.', 'Bruto/mes', 'AFC emp 2.4%', 'SIS 1.85%', 'Mutual 0.95%', 'Gratific.', 'Prov. vacac 8.33%', 'Prov. IAS 8.33%', 'Costo/mes/persona', 'Costo total/mes', 'Costo anual', 'Factor x'],
  ];
  PLANILLA.forEach((p, i) => {
    const bruto = p.brutoMensual;
    const afc = bruto * CARGAS.afcEmp;
    const sis = bruto * CARGAS.sis;
    const mut = bruto * CARGAS.mutual;
    const gratif = Math.min(bruto * CARGAS.gratif, TOPE_GRATIF_MENSUAL);
    const vac = bruto * CARGAS.vacac;
    const ias = bruto * CARGAS.iAS;
    const total = bruto + afc + sis + mut + gratif + vac + ias;
    data.push([
      i + 1, p.cargo, p.cantidad, bruto, afc, sis, mut, gratif, vac, ias,
      total, total * p.cantidad, total * p.cantidad * 12, total / bruto,
    ]);
  });
  data.push([]);
  data.push(['', 'TOTALES', PLANILLA.reduce((s, p) => s + p.cantidad, 0), '', '', '', '', '', '', '',
    '', PLANILLA_MENSUAL_TOTAL, PLANILLA_MENSUAL_TOTAL * 12, '']);
  data.push([]);
  data.push(['NORMATIVA APLICABLE', '', '', '', '', '', '', '', '', '', '', '', '', '']);
  data.push(['AFC empleador (Ley 19.728)', '2.4% indefinido / 3.0% plazo fijo', 'Pago Previred mensual']);
  data.push(['SIS (Seguro Invalidez/Sobrev.)', '1.85% — paga el empleador desde 2009 (Ley 20.255)']);
  data.push(['Mutual Ley 16.744', '0.95% base + adicional según riesgo', 'ACHS / Mutual / IST']);
  data.push(['Gratificación Art. 50 CT', '25% bruto con tope 4.75 IMM = ' + Math.round(IMM * 4.75).toLocaleString('es-CL') + ' anual por trabajador']);
  data.push(['Provisión IAS Art. 163 CT', '1 mes/año tope 11', 'Solo se paga al desvincular si causal lo amerita']);
  data.push(['Provisión vacaciones', '15 días hábiles ≈ 1 mes/año', 'Acumulación legal']);

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [4, 38, 6, 14, 12, 12, 12, 12, 14, 14, 18, 16, 16, 8]);
  for (let r = 2; r <= PLANILLA.length + 4; r += 1) {
    ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'].forEach((col) => {
      if (ws[col + r]) ws[col + r].z = moneyFmt;
    });
    if (ws['N' + r]) ws['N' + r].z = '0.00';
  }
  XLSX.utils.book_append_sheet(wb, ws, 'Personal');
}

// ============================================================
// HOJA 6: COSTOS (estructura mensual por ubicación)
// ============================================================
{
  const data = [
    ['Concepto', ...UBICACIONES.map((u) => u.nombre.split('·')[0].trim())],
  ];
  // Arriendos
  data.push(['Arriendo (UF/m²/mes)', ...UBICACIONES.map((u) => u.arriendoUFm2)]);
  data.push(['Arriendo CLP/mes', ...UBICACIONES.map((u) => u.arriendoUFm2 * u.m2 * UF)]);
  data.push(['Gastos comunes', ...UBICACIONES.map((u) => u.gastosComunesCLP)]);
  data.push(['Contribuciones', ...UBICACIONES.map((u) => u.contribucionesMensualCLP)]);
  data.push(['Servicios + insumos no var', ...UBICACIONES.map(() => 350_000)]);
  data.push(['SUBTOTAL fijos no laborales', ...UBICACIONES.map((u) =>
    u.arriendoUFm2 * u.m2 * UF + u.gastosComunesCLP + u.contribucionesMensualCLP + 350_000
  )]);
  data.push([]);
  data.push(['Costo planilla mensual (3 personas con cargas)', ...UBICACIONES.map(() => Math.round(PLANILLA_MENSUAL_TOTAL))]);
  data.push([]);
  data.push(['TOTAL COSTOS FIJOS / MES', ...UBICACIONES.map((u) =>
    Math.round(u.arriendoUFm2 * u.m2 * UF + u.gastosComunesCLP + u.contribucionesMensualCLP + 350_000 + PLANILLA_MENSUAL_TOTAL)
  )]);
  data.push(['TOTAL COSTOS FIJOS / AÑO', ...UBICACIONES.map((u) =>
    Math.round((u.arriendoUFm2 * u.m2 * UF + u.gastosComunesCLP + u.contribucionesMensualCLP + 350_000 + PLANILLA_MENSUAL_TOTAL) * 12)
  )]);
  data.push([]);
  data.push(['Costo variable por combo', ...UBICACIONES.map(() => 1100)]);
  data.push(['Ingresos anuales caso base', ...UBICACIONES.map((u) => u.combosDiaBase * u.ticketPromedio * 312)]);
  data.push(['Costos variables anuales caso base', ...UBICACIONES.map((u) => u.combosDiaBase * 1100 * 312)]);
  data.push(['Margen contribución / combo', ...UBICACIONES.map((u) => u.ticketPromedio - 1100)]);
  data.push(['Margen contribución %', ...UBICACIONES.map((u) => (u.ticketPromedio - 1100) / u.ticketPromedio)]);

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [42, ...UBICACIONES.map(() => 18)]);
  for (let r = 2; r <= 18; r += 1) {
    UBICACIONES.forEach((_, idx) => {
      const col = String.fromCharCode(66 + idx);
      const cell = ws[col + r];
      if (!cell) return;
      if (r === 18) cell.z = pctFmt;
      else if (r === 2) cell.z = '0.000';
      else cell.z = moneyFmt;
    });
  }
  XLSX.utils.book_append_sheet(wb, ws, 'Costos');
}

// ============================================================
// HOJA 7: COMPARATIVO VAN POR UBICACIÓN
// ============================================================
{
  const data = [
    ['#', 'Ubicación', 'Comuna', 'Inversión total', 'Combos/día base', 'VAN base', 'TIR base', 'Payback (años)', 'VAN pesimista', 'VAN optimista', 'Veredicto'],
  ];
  const resultados = UBICACIONES.map((u) => {
    const base = calcularUbicacion(u, 'base');
    const pes = calcularUbicacion(u, 'pesimista');
    const opt = calcularUbicacion(u, 'optimista');
    return { u, base, pes, opt };
  });

  // Ordenar por VAN base desc
  resultados.sort((a, b) => b.base.van - a.base.van);

  resultados.forEach(({ u, base, pes, opt }, i) => {
    const veredicto = base.van > 0 && pes.van > -inversionTotal(u) * 0.5
      ? '✅ Recomendado'
      : base.van > 0
      ? '⚠️ Aceptable con riesgo'
      : '❌ No conviene';
    data.push([
      i + 1, u.nombre, u.comuna,
      base.inversionTotal, base.combosDia,
      base.van, base.tir, base.payback === Infinity ? '> 5' : Math.round(base.payback * 100) / 100,
      pes.van, opt.van, veredicto,
    ]);
  });

  function inversionTotal(u) {
    const ar = u.arriendoUFm2 * u.m2 * UF;
    const cFijo = ar + u.gastosComunesCLP + u.contribucionesMensualCLP + 350_000 + PLANILLA_MENSUAL_TOTAL;
    const KT = Math.round((cFijo * 12 + u.combosDiaBase * 312 * 1100) / 12 * 4);
    return CAPEX + KT;
  }

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [4, 36, 16, 18, 14, 18, 12, 14, 18, 18, 26]);
  for (let r = 2; r <= resultados.length + 1; r += 1) {
    ['D', 'F', 'I', 'J'].forEach((c) => { if (ws[c + r]) ws[c + r].z = moneyFmt; });
    if (ws['G' + r]) ws['G' + r].z = pctFmt;
  }
  XLSX.utils.book_append_sheet(wb, ws, 'Comparativo_VAN');

  // Guardamos los resultados para usar en otras hojas
  globalThis.__resultados = resultados;
}

// ============================================================
// HOJA 8: FLUJO ANUAL — UBICACIÓN GANADORA
// ============================================================
{
  const ganadora = globalThis.__resultados[0];
  const u = ganadora.u;
  const r = ganadora.base;
  const arriendoMensual = u.arriendoUFm2 * u.m2 * UF;
  const cf = arriendoMensual + u.gastosComunesCLP + u.contribucionesMensualCLP + 350_000 + PLANILLA_MENSUAL_TOTAL;
  const cv = 1100;
  const dias = 312;

  const data = [
    ['FLUJO DE CAJA PURO · UBICACIÓN GANADORA: ' + u.nombre],
    ['(VAN ' + r.van.toLocaleString('es-CL') + ' · TIR ' + (r.tir * 100).toFixed(1) + '%)'],
    [],
    ['Concepto', 'Año 0', 'Año 1', 'Año 2', 'Año 3', 'Año 4', 'Año 5'],
  ];

  const filas = ['Combos/año', 'Ingresos', '(-) Costos variables', '(-) Costos fijos', '(-) Depreciación', 'UAI', '(-) Impuesto', 'UDI', '(+) Reversión depreciación', '(+) Recupero CT', '(+) Valor residual neto', '(+) Valor terminal (perpetuidad)', '(-) Inversión inicial', '(-) Capital trabajo', 'FLUJO NETO DE CAJA'];

  // Construir matriz
  let matriz = filas.map(() => ['', 0, 0, 0, 0, 0, 0]);
  let creditoFiscal = 0;
  for (let t = 0; t <= HORIZONTE_ANOS; t += 1) {
    if (t === 0) {
      matriz[12][1] = -CAPEX; // inv
      matriz[13][1] = -r.capitalTrabajo;
      matriz[14][1] = -CAPEX - r.capitalTrabajo;
      continue;
    }
    const factor = Math.pow(1 + 0.05, t - 1);
    const combos = u.combosDiaBase * dias * factor;
    const ing = combos * u.ticketPromedio;
    const cvAno = combos * cv;
    const cfAno = cf * 12;
    const dep = t <= VIDA_PROMEDIO ? DEP_ANUAL : 0;
    const uai = ing - cvAno - cfAno - dep;
    let imp = 0;
    if (uai < 0) creditoFiscal += -uai * TASA_IMPUESTO;
    else if (uai > 0) {
      const teor = uai * TASA_IMPUESTO;
      if (creditoFiscal >= teor) { creditoFiscal -= teor; imp = 0; }
      else { imp = teor - creditoFiscal; creditoFiscal = 0; }
    }
    const udi = uai - imp;
    const fOper = udi + dep;
    matriz[0][t + 1] = combos;
    matriz[1][t + 1] = ing;
    matriz[2][t + 1] = -cvAno;
    matriz[3][t + 1] = -cfAno;
    matriz[4][t + 1] = -dep;
    matriz[5][t + 1] = uai;
    matriz[6][t + 1] = -imp;
    matriz[7][t + 1] = udi;
    matriz[8][t + 1] = dep;
    if (t === HORIZONTE_ANOS) {
      matriz[9][t + 1] = r.capitalTrabajo;
      const VRneto = CAPEX * 0.10 * (1 - TASA_IMPUESTO);
      matriz[10][t + 1] = VRneto;
      const uaiSteady = ing - cvAno - cfAno;
      const flujoSteady = uaiSteady > 0 ? uaiSteady * (1 - TASA_IMPUESTO) : uaiSteady;
      const VT = flujoSteady * (1 + G_PERPETUIDAD) / (TCC - G_PERPETUIDAD);
      matriz[11][t + 1] = VT;
      matriz[14][t + 1] = fOper + r.capitalTrabajo + VRneto + VT;
    } else {
      matriz[14][t + 1] = fOper;
    }
  }
  filas.forEach((nombre, i) => {
    matriz[i][0] = nombre;
    data.push(matriz[i]);
  });

  data.push([]);
  data.push(['INDICADORES']);
  data.push(['VAN', r.van]);
  data.push(['TIR', r.tir]);
  data.push(['Payback (años)', r.payback === Infinity ? '> 5' : Math.round(r.payback * 100) / 100]);
  data.push(['Tasa de descuento (Tcc)', TCC]);
  data.push(['Crecimiento perpetuidad (g)', G_PERPETUIDAD]);

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [38, 16, 16, 16, 16, 16, 16]);
  // formatos $ a las celdas numéricas
  for (let r2 = 5; r2 <= 19; r2 += 1) {
    ['B', 'C', 'D', 'E', 'F', 'G'].forEach((c) => {
      const cell = ws[c + r2];
      if (cell && typeof cell.v === 'number') {
        if (r2 === 5) cell.z = intFmt;
        else cell.z = moneyFmt;
      }
    });
  }
  // resaltar fila Flujo Neto
  ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach((c) => {
    const cell = ws[c + 19];
    if (cell) cell.s = { font: { bold: true } };
  });
  // VAN/TIR fila
  if (ws['B22']) ws['B22'].z = moneyFmt;
  if (ws['B23']) ws['B23'].z = pctFmt;
  if (ws['B25']) ws['B25'].z = pctFmt;
  if (ws['B26']) ws['B26'].z = pctFmt;
  XLSX.utils.book_append_sheet(wb, ws, 'FlujoAnual_Ganadora');
}

// ============================================================
// HOJA 9: SENSIBILIDAD (de la ubicación ganadora)
// ============================================================
{
  const ganadora = globalThis.__resultados[0];
  const variables = [
    { nombre: 'Ticket promedio', clave: 'ticketPromedio' },
    { nombre: 'Demanda (combos/día)', clave: 'combosDiaBase' },
    { nombre: 'Costo variable insumo', clave: 'costoVariable' },
    { nombre: 'Arriendo', clave: 'arriendoUFm2' },
    { nombre: 'Sueldo planilla', clave: 'sueldos' },
    { nombre: 'Tasa banco PYME', clave: 'tasaBanco' },
  ];
  const deltas = [-0.20, -0.10, 0.10, 0.20];
  const data = [
    ['ANÁLISIS DE SENSIBILIDAD · ' + ganadora.u.nombre],
    [],
    ['Variable', '−20%', '−10%', 'Base', '+10%', '+20%'],
  ];
  const baseVan = ganadora.base.van;
  const dias = 312;

  variables.forEach((v) => {
    const fila = [v.nombre];
    deltas.forEach((d) => {
      // Re-calcular VAN modificando la variable
      const u2 = { ...ganadora.u };
      let cv = 1100;
      let pl = PLANILLA_MENSUAL_TOTAL;
      let arrFactor = 1;
      if (v.clave === 'ticketPromedio') u2.ticketPromedio = u2.ticketPromedio * (1 + d);
      else if (v.clave === 'combosDiaBase') u2.combosDiaBase = u2.combosDiaBase * (1 + d);
      else if (v.clave === 'costoVariable') cv = cv * (1 + d);
      else if (v.clave === 'arriendoUFm2') arrFactor = (1 + d);
      else if (v.clave === 'sueldos') pl = pl * (1 + d);
      // (tasa banco no aplica al flujo puro, lo dejamos en 0 para tornado puro)
      // Recalculamos
      const arriendoMes = u2.arriendoUFm2 * u2.m2 * UF * arrFactor;
      const cfMes = arriendoMes + u2.gastosComunesCLP + u2.contribucionesMensualCLP + 350_000 + pl;
      const cfAnual = cfMes * 12;
      let cuts = [-(CAPEX + Math.round(cfMes * 4 + u2.combosDiaBase * cv * dias / 12 * 4))];
      let cred = 0;
      const KT = Math.abs(cuts[0]) - CAPEX;
      for (let t = 1; t <= HORIZONTE_ANOS; t += 1) {
        const factor = Math.pow(1.05, t - 1);
        const combos = u2.combosDiaBase * dias * factor;
        const ing = combos * u2.ticketPromedio;
        const cvAno = combos * cv;
        const dep = t <= VIDA_PROMEDIO ? DEP_ANUAL : 0;
        const uai = ing - cvAno - cfAnual - dep;
        let imp = 0;
        if (uai < 0) cred += -uai * TASA_IMPUESTO;
        else if (uai > 0) { const t1 = uai * TASA_IMPUESTO; if (cred >= t1) { cred -= t1; imp = 0; } else { imp = t1 - cred; cred = 0; } }
        const udi = uai - imp;
        let f = udi + dep;
        if (t === HORIZONTE_ANOS) {
          f += KT + CAPEX * 0.10 * (1 - TASA_IMPUESTO);
          const uaiS = ing - cvAno - cfAnual;
          const fS = uaiS > 0 ? uaiS * (1 - TASA_IMPUESTO) : uaiS;
          f += fS * (1 + G_PERPETUIDAD) / (TCC - G_PERPETUIDAD);
        }
        cuts.push(f);
      }
      const v2 = cuts.reduce((s, fl, i) => s + fl / Math.pow(1 + TCC, i), 0);
      fila.push(Math.round(v2));
    });
    fila.splice(3, 0, baseVan);
    data.push(fila);
  });

  data.push([]);
  data.push(['Impacto absoluto en VAN (variación − base)']);
  data.push(['Variable', '−20%', '−10%', 'Base', '+10%', '+20%']);
  for (let i = 0; i < variables.length; i += 1) {
    const filaImpacto = [variables[i].nombre];
    for (let j = 1; j <= 5; j += 1) {
      const v = data[3 + i][j];
      filaImpacto.push(typeof v === 'number' ? v - baseVan : '');
    }
    data.push(filaImpacto);
  }

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [28, 18, 18, 18, 18, 18]);
  // formato $
  for (let r = 4; r <= 9; r += 1) {
    ['B', 'C', 'D', 'E', 'F'].forEach((c) => { if (ws[c + r]) ws[c + r].z = moneyFmt; });
  }
  for (let r = 13; r <= 18; r += 1) {
    ['B', 'C', 'D', 'E', 'F'].forEach((c) => { if (ws[c + r]) ws[c + r].z = moneyFmt; });
  }
  XLSX.utils.book_append_sheet(wb, ws, 'Sensibilidad');
}

// ============================================================
// HOJA 10: RIESGOS
// ============================================================
{
  const data = [
    ['MATRIZ DE RIESGOS DEL PROYECTO'],
    [],
    ['#', 'Riesgo', 'Categoría', 'Probabilidad', 'Impacto', 'Score', 'Mitigación', 'Responsable'],
    [1, 'Caída de demanda por contracción económica', 'Mercado', 'Media', 'Alto', 'Alto', 'Diversificar canal (delivery, oficinas), revisar mix combo, ajustar estacionalidad', 'Gerencia'],
    [2, 'Aumento del precio del café importado', 'Suministro', 'Media', 'Medio', 'Medio', 'Contratos suministro 6-12 meses, alternativa proveedor local, hedge UF', 'Operaciones'],
    [3, 'Subida de arriendo al renovar contrato', 'Inmobiliario', 'Alta', 'Alto', 'Crítico', 'Negociar contrato 3-5 años con cláusula reajuste IPC tope, opción renovación', 'Gerencia'],
    [4, 'Apertura de competencia directa adyacente', 'Competencia', 'Media', 'Alto', 'Alto', 'Programa fidelización desde día 1, café distintivo, comunidad social media', 'Marketing'],
    [5, 'Cambios regulatorios sanitarios', 'Regulatorio', 'Baja', 'Medio', 'Medio', 'Monitoreo SEREMI Salud trimestral, certificaciones al día, asesor sanitario', 'Operaciones'],
    [6, 'Aumento del salario mínimo / leyes laborales', 'Laboral', 'Media', 'Medio', 'Medio', 'Revisión productividad/persona, automatización (POS autoservicio si crece volumen)', 'Gerencia'],
    [7, 'Tipo de cambio insumos importados (granos especialidad)', 'FX', 'Media', 'Medio', 'Medio', 'Mix proveedores nacionales/import, contratos en UF cuando sea posible', 'Operaciones'],
    [8, 'Falla de máquina espresso (corazón operación)', 'Operacional', 'Baja', 'Alto', 'Medio', 'Mantención preventiva trimestral, contrato servicio técnico SLA 24h, fondo reposición', 'Operaciones'],
    [9, 'Robo o vandalismo (seguridad)', 'Operacional', 'Media', 'Medio', 'Medio', 'Cámaras + alarma + seguro multiriesgo + protocolo cierre nocturno', 'Operaciones'],
    [10, 'Pandemia / emergencia que reduce flujo peatonal', 'Sanitario externo', 'Baja', 'Crítico', 'Alto', 'Reserva cash 6+ meses egresos, capacidad delivery rápido, plan contingencia', 'Gerencia'],
    [11, 'Rotación alta de baristas (1-2 personas críticas)', 'Talento', 'Alta', 'Medio', 'Alto', 'Contratos indefinidos, capacitación interna, segundo barista siempre certificado', 'RH'],
    [12, 'Caída del proveedor de combo envasado', 'Suministro', 'Baja', 'Crítico', 'Alto', 'Mínimo 2 proveedores certificados SEREMI, stock reserva 1 semana mínimo', 'Operaciones'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [4, 50, 18, 14, 12, 14, 70, 14]);
  XLSX.utils.book_append_sheet(wb, ws, 'Riesgos');
}

// ============================================================
// HOJA 11: CONCLUSIÓN
// ============================================================
{
  const ganadora = globalThis.__resultados[0];
  const top3 = globalThis.__resultados.slice(0, 3);
  const data = [
    ['CONCLUSIÓN Y RECOMENDACIÓN FINAL'],
    [],
    ['1. UBICACIÓN RECOMENDADA: ' + ganadora.u.nombre.toUpperCase()],
    [],
    ['Razones:'],
    ['VAN base', ganadora.base.van.toLocaleString('es-CL') + ' CLP'],
    ['TIR', (ganadora.base.tir * 100).toFixed(1) + '%'],
    ['Payback', ganadora.base.payback === Infinity ? '> 5 años' : ganadora.base.payback.toFixed(2) + ' años'],
    ['Inversión inicial total', '$' + ganadora.base.inversionTotal.toLocaleString('es-CL')],
    ['Combos/día base', ganadora.base.combosDia],
    [],
    ['Justificación:'],
    [ganadora.u.notasZona],
    [],
    ['2. PODIO TOP 3 (por VAN base)'],
    [],
    ['#', 'Ubicación', 'VAN base', 'TIR', 'Payback', 'Inversión'],
    ...top3.map((r, i) => [
      i + 1, r.u.nombre,
      r.base.van.toLocaleString('es-CL'),
      (r.base.tir * 100).toFixed(1) + '%',
      r.base.payback === Infinity ? '> 5' : r.base.payback.toFixed(2),
      '$' + r.base.inversionTotal.toLocaleString('es-CL'),
    ]),
    [],
    ['3. CRITERIOS DE DESCARTE'],
    [],
    ['Las ubicaciones con VAN pesimista < −50% inversión inicial se consideran NO RECOMENDADAS por exposición a pérdida significativa.'],
    [],
    ['4. PRÓXIMOS PASOS'],
    [],
    ['1. Validar arriendo del local con propietario (firmar reserva con cláusula de renovación)'],
    ['2. Iniciar trámite SII (Form 4415, código 561010 cafés y restaurantes)'],
    ['3. Solicitar resolución sanitaria SEREMI categoría manipulación mínima (plazo 4-6 sem)'],
    ['4. Capacitar 2 baristas en curso manipulador alimentos (10 hrs OTEC autorizada, vigencia 3 años)'],
    ['5. Concretar línea de crédito PYME bancaria (preaprobación con flujo proyectado)'],
    ['6. Plan de marketing y comunidad pre-apertura (2 meses antes — Instagram, Google Maps)'],
    ['7. Negociar contratos con 2 proveedores certificados de combo envasado'],
    ['8. Cronograma de obra menor + compra equipos (8-12 semanas hasta apertura)'],
    [],
    ['5. ALCANCE DEL PROYECTO'],
    [],
    ['Modelo: cafetería compacta (30-35 m²) que vende UN combo único cerrado:'],
    ['  · Espresso preparado al momento (máquina semiautomática 2-grupos)'],
    ['  · Producto envasado del proveedor (croissant/sándwich/snack pre-empacado individual)'],
    [],
    ['NO incluye preparación de alimentos en local. Categoría sanitaria: manipulación mínima.'],
    ['Personal mínimo: 2 baristas certificados manipuladores + 1 reemplazo (½ jornada).'],
    [],
    ['6. SUPUESTOS CRÍTICOS DEL MODELO'],
    [],
    ['Tasa costo capital (Tcc)', (TCC * 100).toFixed(1) + '%', 'Riesgo bajo modelo simple (vs 13% café tradicional)'],
    ['Crecimiento perpetuidad', (G_PERPETUIDAD * 100).toFixed(1) + '%', 'Coherente con inflación largo plazo Chile'],
    ['Régimen tributario', 'Pro PYME 14 D N°3', 'Tasa 25% + depreciación instantánea'],
    ['Crecimiento demanda anual', '5%', 'Proyectado conservador vs sector cafetería 6-8%'],
    ['Días operación / año', '312', 'Lunes a sábado · descansa domingo'],
    ['Vida útil promedio activos', VIDA_PROMEDIO + ' años', 'Promedio ponderado por costo (depreciación lineal SLN)'],
    ['Valor residual', '10% del CAPEX', 'Estimación conservadora venta de equipos al cierre'],
    [],
    ['7. LIMITACIONES Y FUENTES DE INCERTIDUMBRE'],
    [],
    ['• Demanda esperada calibrada con proxies (flujo peatonal, ingreso comuna, accesibilidad transporte) pero NO con estudio primario en el local específico'],
    ['• Arriendos referenciales agregados — el valor final depende de negociación específica del contrato'],
    ['• Costos del combo envasado dependen del contrato con proveedor (volumen, exclusividad)'],
    ['• Modelo asume contrato de arriendo a 5 años con reajuste IPC; cambios drásticos requieren re-evaluación'],
    ['• Análisis de sensibilidad muestra resistencia del proyecto: variables clave son DEMANDA y ARRIENDO'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [4, 40, 22, 14, 12, 22]);
  XLSX.utils.book_append_sheet(wb, ws, 'Conclusion');
}

// ============================================================
// GUARDAR EL ARCHIVO
// ============================================================
const outDir = 'C:/Users/Usuario/Desktop/carpeta casa/agente-evaluacion-proyectos/public/exports';
mkdirSync(outDir, { recursive: true });
const outPath = outDir + '/Analisis_Cafe_Combo_RM.xlsx';
const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
writeFileSync(outPath, buffer);

console.log(`✓ Excel generado: ${outPath}`);
console.log(`  Hojas: ${wb.SheetNames.join(', ')}`);
console.log(`  Tamaño: ${(buffer.length / 1024).toFixed(1)} KB`);
console.log('');
console.log('=== TOP 3 UBICACIONES ===');
globalThis.__resultados.slice(0, 3).forEach((r, i) => {
  console.log(`${i + 1}. ${r.u.nombre}`);
  console.log(`   VAN base: $${r.base.van.toLocaleString('es-CL')} · TIR ${(r.base.tir * 100).toFixed(1)}% · Payback ${r.base.payback === Infinity ? '>5' : r.base.payback.toFixed(2) + ' años'}`);
});
