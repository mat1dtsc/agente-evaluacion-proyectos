/**
 * Generador de Excel — Análisis Profundo Café Combo Único Envasado
 *
 * Usa el modelo financiero corregido en scripts/lib/cafeModel.mjs
 * (fuente única de verdad compartida con la app web y el Word).
 *
 * Output: ../../public/exports/Analisis_Cafe_Combo_RM.xlsx
 *
 * Uso: node scripts/excel/generarAnalisisCafe.mjs
 */
import XLSX from 'xlsx';
import { writeFileSync, mkdirSync } from 'node:fs';
import {
  UF, IMM, TASA_IMPUESTO, TASA_IVA, TCC, G_DEMANDA, MULT_EBITDA_TERMINAL,
  COMISION_TARJETAS, HORIZONTE_ANOS, DIAS_OPER_ANO, CARGAS,
  PLANILLA, PLANILLA_MENSUAL_TOTAL, COSTOS_FIJOS_NO_LAB,
  COSTOS_FIJOS_NO_LAB_TOTAL, INVERSION, CAPEX, VIDA_PROMEDIO, DEP_ANUAL,
  UBICACIONES, calcularUbicacion, calcularTodas, scoreUbicacion, veredicto,
  costoEmpresa,
} from '../lib/cafeModel.mjs';

// ============================================================
// FORMATOS
// ============================================================
const moneyFmt = '"$"#,##0;[Red]"$"\\-#,##0';
const pctFmt = '0.0%';
const intFmt = '#,##0';
const ufFmt = '0.000';

function setColWidths(ws, widths) { ws['!cols'] = widths.map((w) => ({ wch: w })); }
function setRowHeight(ws, idx, h) {
  ws['!rows'] = ws['!rows'] || [];
  ws['!rows'][idx] = { hpx: h };
}

// ============================================================
// CALCULAR TODAS LAS UBICACIONES (usa modelo central)
// ============================================================
const resultados = calcularTodas();
resultados.sort((a, b) => b.base.van - a.base.van);
const ganadora = resultados[0];

const wb = XLSX.utils.book_new();

// ============================================================
// HOJA 1: PORTADA
// ============================================================
{
  const data = [
    [{ v: 'ANÁLISIS DE EVALUACIÓN DE PROYECTO', s: { font: { bold: true, sz: 18 } } }],
    [{ v: 'Café Combo Único Envasado · Región Metropolitana', s: { font: { italic: true, sz: 12 } } }],
    [],
    ['Fecha de elaboración', new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })],
    ['Curso', 'Evaluación de Proyectos · MBA UAH 2026'],
    ['Profesor', 'Mauricio Zúñiga'],
    [],
    [{ v: 'RESULTADO EJECUTIVO', s: { font: { bold: true, sz: 14 } } }],
    [],
    ['Ubicación recomendada', ganadora.u.nombre],
    ['VAN base', ganadora.base.van],
    ['TIR base', ganadora.base.tir],
    ['Payback (años)', Number.isFinite(ganadora.base.payback) ? ganadora.base.payback : 'no repaga'],
    ['Inversión total', ganadora.base.inversionTotal],
    ['EBITDA año 1', ganadora.base.ebitdaAno1],
    ['Veredicto', veredicto(ganadora).texto],
    ['Score de viabilidad (0-100)', scoreUbicacion(ganadora)],
    [],
    [{ v: 'METODOLOGÍA Y SUPUESTOS CRÍTICOS', s: { font: { bold: true, sz: 12 } } }],
    [],
    ['Tasa de descuento (Tcc)', TCC, 'CAPM: Rf 5.5% + β 1.3 × ERP 6.5% — riesgo MEDIO retail food'],
    ['Crecimiento demanda (g)', G_DEMANDA, 'Sectorial cafetería sin reinversión 2-3% real'],
    ['Múltiplo EBITDA valor terminal', MULT_EBITDA_TERMINAL, 'Cafés Chile: 3-5x EBITDA — adoptamos 3.5x conservador'],
    ['Régimen tributario', 'Pro PYME 14 D N°3', 'Tasa impuesto: ' + (TASA_IMPUESTO * 100) + '%'],
    ['Comisión tarjetas', COMISION_TARJETAS, '2.8% sobre ingresos (Transbank/Getnet · 80% pago electrónico)'],
    ['Horizonte', HORIZONTE_ANOS, 'años + valor terminal por venta del going concern'],
    ['Días operación', DIAS_OPER_ANO, '6 días/sem × 52 (descansa domingo)'],
    [],
    [{ v: 'AUDITORÍA DEL MODELO PREVIO', s: { font: { bold: true, sz: 12 } } }],
    [],
    ['Antes', 'Ahora', 'Justificación'],
    ['Costo variable $1.100', 'Variable por zona $1.300-$1.700', 'Combo café+envasado: insumos + empaques + descartables = 40-50% del ticket'],
    ['Costos fijos $350k/mes', '$850k/mes (sin arriendo)', 'Faltaban: marketing $200k, aseo+pest $100k, software+contador $150k, seguros+mantenciones $150k, servicios $250k'],
    ['Sin comisión tarjetas', '2.8% sobre ingresos', 'Transbank/Getnet ~3.5% × 80% pago electrónico'],
    ['g demanda 5% anual', 'g demanda 2.5% anual', 'Crecimiento sectorial cafetería sin re-inversión 2-3%'],
    ['VT por Gordon Growth (×10.7)', 'VT por múltiplo EBITDA (×3.5)', 'Cafetería independiente NO opera a perpetuidad sin reposición de equipos'],
    ['Tcc 11.5%', 'Tcc 14%', 'Retail food riesgo MEDIO-ALTO en Chile (alta tasa fracaso 50%+ a 3 años)'],
    [],
    [{ v: 'NAVEGACIÓN POR HOJAS', s: { font: { bold: true, sz: 12 } } }],
    [],
    ['Inputs', 'Parámetros del modelo (constantes y supuestos)'],
    ['Ubicaciones', 'Tabla con las 7 zonas, características y micro-mercado'],
    ['Costos', 'Estructura de costos fijos + variables comparada entre zonas'],
    ['Personal', 'Planilla con cargas patronales chilenas detalladas'],
    ['Inversion', 'Desglose de inversión inicial por ítem + depreciación'],
    ['Comparativo_VAN', 'VAN/TIR/Payback comparado por zona y escenario'],
    ['Flujo_Ganadora', 'Flujo a 5 años de la ubicación recomendada'],
    ['Sensibilidad', 'Tornado ±20% sobre 6 variables críticas'],
    ['Riesgos', 'Matriz cualitativa probabilidad × impacto'],
    ['Conclusion', 'Recomendación final fundamentada'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [42, 70]);
  // Aplicar formato a celdas específicas
  if (ws['B11']) ws['B11'].z = moneyFmt;
  if (ws['B12']) ws['B12'].z = pctFmt;
  if (ws['B14']) ws['B14'].z = moneyFmt;
  if (ws['B15']) ws['B15'].z = moneyFmt;
  if (ws['B21']) ws['B21'].z = pctFmt;
  if (ws['B22']) ws['B22'].z = pctFmt;
  if (ws['B23']) ws['B23'].z = '0.0';
  if (ws['B25']) ws['B25'].z = pctFmt;
  XLSX.utils.book_append_sheet(wb, ws, 'Portada');
}

// ============================================================
// HOJA 2: INPUTS (parámetros del modelo)
// ============================================================
{
  const data = [
    ['PARÁMETRO', 'VALOR', 'UNIDAD', 'NOTA'],
    [],
    [{ v: '1. CONSTANTES MACRO', s: { font: { bold: true } } }],
    ['UF', UF, 'CLP', 'Promedio 2025'],
    ['IMM (Ingreso Mínimo)', IMM, 'CLP', 'Vigente 2025'],
    [],
    [{ v: '2. PARÁMETROS FINANCIEROS', s: { font: { bold: true } } }],
    ['Horizonte', HORIZONTE_ANOS, 'años'],
    ['Tcc (tasa costo capital)', TCC, '%', 'CAPM retail food riesgo MEDIO'],
    ['Crecimiento demanda anual (g)', G_DEMANDA, '%', 'Sectorial cafetería sin reinversión'],
    ['Múltiplo EBITDA terminal', MULT_EBITDA_TERMINAL, 'x', 'Valor going concern al cierre del horizonte'],
    ['Tasa impuesto', TASA_IMPUESTO, '%', 'Pro PYME 14 D N°3'],
    ['IVA', TASA_IVA, '%', 'DL 825'],
    ['Comisión tarjetas', COMISION_TARJETAS, '%', '3.5% × 80% pago electrónico'],
    [],
    [{ v: '3. CARGAS PATRONALES (factor sobre bruto)', s: { font: { bold: true } } }],
    ['AFC empleador (indefinido)', CARGAS.afcEmp, '%'],
    ['SIS', CARGAS.sis, '%', 'Seguro invalidez/sobrevivencia'],
    ['Mutual Ley 16.744', CARGAS.mutual, '%', 'Accidentes del trabajo'],
    ['Gratificación legal Art. 50', CARGAS.gratif, '%', 'Con tope 4.75 IMM/año'],
    ['Provisión vacaciones', CARGAS.vacac, '%', '15 días hábiles ≈ 1 mes/año'],
    ['Provisión IAS Art. 163', CARGAS.iAS, '%', '1 mes/año (tope 11)'],
    [],
    [{ v: '4. COSTOS FIJOS NO LABORALES (sin arriendo)', s: { font: { bold: true } } }],
    ['Servicios básicos (luz/gas/agua/internet)', COSTOS_FIJOS_NO_LAB.serviciosBasicos, 'CLP/mes'],
    ['Marketing', COSTOS_FIJOS_NO_LAB.marketing, 'CLP/mes', 'SEM, redes, fidelización'],
    ['Aseo y pest control', COSTOS_FIJOS_NO_LAB.aseoYpest, 'CLP/mes'],
    ['Software + Contador externo', COSTOS_FIJOS_NO_LAB.softwareYContador, 'CLP/mes', 'POS + facturación + contabilidad'],
    ['Seguros + provisión mantenciones', COSTOS_FIJOS_NO_LAB.segurosYmantenciones, 'CLP/mes'],
    ['SUBTOTAL fijos no laborales', COSTOS_FIJOS_NO_LAB_TOTAL, 'CLP/mes', 'Por ubicación se SUMA arriendo + gastos com. + contribuciones'],
    [],
    [{ v: '5. PARÁMETROS OPERACIONALES', s: { font: { bold: true } } }],
    ['Días operación / año', DIAS_OPER_ANO, 'días', '6 días/sem × 52'],
    ['Vida útil promedio activos', VIDA_PROMEDIO, 'años', 'Promedio ponderado por costo'],
    ['Capital de trabajo', '2,5 meses egresos', '', 'Calculado por ubicación'],
    ['Valor residual activos al año 5', '10% del CAPEX', '', 'Estimación conservadora venta de equipos'],
    ['Costo planilla mensual con cargas', PLANILLA_MENSUAL_TOTAL, 'CLP/mes', '3 personas (Barista jefe + tarde + reemplazo ½ jornada)'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [40, 18, 14, 50]);

  // Formato % a celdas que llevan tasa
  ['B9', 'B10', 'B12', 'B13', 'B14', 'B17', 'B18', 'B19', 'B20', 'B21', 'B22'].forEach((c) => {
    if (ws[c]) ws[c].z = pctFmt;
  });
  // Formato $ a celdas $$
  ['B4', 'B5', 'B25', 'B26', 'B27', 'B28', 'B29', 'B30', 'B36'].forEach((c) => {
    if (ws[c]) ws[c].z = moneyFmt;
  });
  XLSX.utils.book_append_sheet(wb, ws, 'Inputs');
}

// ============================================================
// HOJA 3: UBICACIONES (tabla comparativa)
// ============================================================
{
  const data = [
    ['#', 'Ubicación', 'Comuna', 'Dirección referencia', 'Arriendo UF/m²', 'm² local',
     'Arriendo $/mes', 'Gastos com.', 'Contrib.', 'Costos fijos no lab. TOTAL',
     'Flujo peatonal/día', 'Comp./km²', 'Ingreso medio', 'Distancia Metro (m)',
     'Ticket', 'Costo variable', 'Margen contrib.', 'Combos/día base'],
  ];
  resultados.forEach((r, i) => {
    const u = r.u;
    const arriendo = u.arriendoUFm2 * u.m2 * UF;
    data.push([
      i + 1, u.nombre, u.comuna, u.direccion_referencia,
      u.arriendoUFm2, u.m2, Math.round(arriendo),
      u.gastosComunesCLP, u.contribucionesMensualCLP,
      Math.round(arriendo + u.gastosComunesCLP + u.contribucionesMensualCLP + COSTOS_FIJOS_NO_LAB_TOTAL),
      u.flujoPeatonalDia, u.densidadCompetenciaKm2, u.ingresoMedioComuna,
      u.metrosAEstacionMetro, u.ticketPromedio, u.costoVariableUnitario,
      (u.ticketPromedio - u.costoVariableUnitario) / u.ticketPromedio,
      u.combosDiaBase,
    ]);
  });
  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [4, 36, 16, 28, 12, 8, 14, 12, 12, 18, 14, 11, 14, 14, 10, 12, 12, 12]);
  for (let r = 2; r <= resultados.length + 1; r += 1) {
    ['G', 'H', 'I', 'J', 'M', 'O', 'P'].forEach((c) => {
      if (ws[c + r]) ws[c + r].z = moneyFmt;
    });
    if (ws['E' + r]) ws['E' + r].z = ufFmt;
    if (ws['Q' + r]) ws['Q' + r].z = pctFmt;
    ['F', 'K', 'L', 'N', 'R'].forEach((c) => {
      if (ws[c + r]) ws[c + r].z = intFmt;
    });
  }
  XLSX.utils.book_append_sheet(wb, ws, 'Ubicaciones');
}

// ============================================================
// HOJA 4: COSTOS (mensual por ubicación)
// ============================================================
{
  const cols = ['Concepto', ...resultados.map((r) => r.u.nombre.split('·')[0].trim())];
  const data = [cols];
  function row(label, vals) { data.push([label, ...vals]); }

  row('Arriendo UF/m²/mes', resultados.map((r) => r.u.arriendoUFm2));
  row('Arriendo $/mes', resultados.map((r) => r.u.arriendoUFm2 * r.u.m2 * UF));
  row('Gastos comunes', resultados.map((r) => r.u.gastosComunesCLP));
  row('Contribuciones', resultados.map((r) => r.u.contribucionesMensualCLP));
  row('Servicios básicos', resultados.map(() => COSTOS_FIJOS_NO_LAB.serviciosBasicos));
  row('Marketing', resultados.map(() => COSTOS_FIJOS_NO_LAB.marketing));
  row('Aseo + pest', resultados.map(() => COSTOS_FIJOS_NO_LAB.aseoYpest));
  row('Software + Contador', resultados.map(() => COSTOS_FIJOS_NO_LAB.softwareYContador));
  row('Seguros + mantenciones', resultados.map(() => COSTOS_FIJOS_NO_LAB.segurosYmantenciones));
  row('SUBTOTAL fijos no laborales', resultados.map((r) => Math.round(r.base.costosFijosNoLab)));
  data.push([]);
  row('Costo planilla mensual (3 personas con cargas)', resultados.map(() => Math.round(PLANILLA_MENSUAL_TOTAL)));
  data.push([]);
  row('TOTAL COSTOS FIJOS / MES', resultados.map((r) => Math.round(r.base.costosFijosTotal)));
  row('TOTAL COSTOS FIJOS / AÑO', resultados.map((r) => Math.round(r.base.costosFijosTotal * 12)));
  data.push([]);
  row('Costo variable por combo', resultados.map((r) => r.u.costoVariableUnitario));
  row('Ingresos anuales caso base', resultados.map((r) => r.base.ingresosAno1));
  row('Costos variables anuales caso base', resultados.map((r) => r.u.combosDiaBase * r.u.costoVariableUnitario * DIAS_OPER_ANO));
  row('Comisión tarjetas (2.8%)', resultados.map((r) => r.base.ingresosAno1 * COMISION_TARJETAS));
  row('Margen contribución / combo', resultados.map((r) => r.u.ticketPromedio - r.u.costoVariableUnitario));
  row('Margen contribución %', resultados.map((r) => (r.u.ticketPromedio - r.u.costoVariableUnitario) / r.u.ticketPromedio));
  row('EBITDA año 1', resultados.map((r) => r.base.ebitdaAno1));

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [42, ...resultados.map(() => 18)]);

  // Formatos
  for (let r = 2; r <= data.length; r += 1) {
    resultados.forEach((_, idx) => {
      const col = String.fromCharCode(66 + idx);
      const cell = ws[col + r];
      if (!cell) return;
      const label = data[r - 1][0];
      if (label === 'Arriendo UF/m²/mes') cell.z = ufFmt;
      else if (label === 'Margen contribución %') cell.z = pctFmt;
      else cell.z = moneyFmt;
    });
  }
  XLSX.utils.book_append_sheet(wb, ws, 'Costos');
}

// ============================================================
// HOJA 5: PERSONAL
// ============================================================
{
  const data = [
    ['#', 'Cargo', 'Cant.', 'Bruto/mes', 'AFC emp 2.4%', 'SIS 1.85%', 'Mutual 0.95%',
     'Gratific.', 'Prov. vacac 8.33%', 'Prov. IAS 8.33%', 'Costo/mes/persona', 'Costo total/mes', 'Costo anual', 'Factor x'],
  ];
  PLANILLA.forEach((p, i) => {
    const bruto = p.brutoMensual;
    const afc = bruto * CARGAS.afcEmp;
    const sis = bruto * CARGAS.sis;
    const mut = bruto * CARGAS.mutual;
    const gratif = Math.min(bruto * CARGAS.gratif, IMM * 4.75 / 12);
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
  data.push(['Provisión IAS Art. 163 CT', '1 mes/año tope 11 (al desvincular si causal lo amerita)']);
  data.push(['Provisión vacaciones', '15 días hábiles ≈ 1 mes/año']);

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [4, 38, 6, 14, 12, 12, 12, 12, 14, 14, 18, 16, 16, 8]);
  for (let r = 2; r <= PLANILLA.length + 4; r += 1) {
    ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'].forEach((c) => {
      if (ws[c + r]) ws[c + r].z = moneyFmt;
    });
    if (ws['N' + r]) ws['N' + r].z = '0.00';
  }
  XLSX.utils.book_append_sheet(wb, ws, 'Personal');
}

// ============================================================
// HOJA 6: INVERSIÓN INICIAL
// ============================================================
{
  const data = [
    ['#', 'Ítem', 'Costo CLP', 'Vida útil SII (años)', 'Cuota anual depreciación'],
  ];
  INVERSION.forEach((it, i) => {
    data.push([i + 1, it.item, it.costoCLP, it.vidaUtil, it.costoCLP / it.vidaUtil]);
  });
  data.push([]);
  data.push(['', 'TOTAL CAPEX (activos físicos)', CAPEX, VIDA_PROMEDIO, DEP_ANUAL]);
  data.push([]);
  data.push(['Notas:']);
  data.push(['Vida útil ponderada por costo:', VIDA_PROMEDIO, 'años']);
  data.push(['Depreciación lineal anual (SLN):', DEP_ANUAL]);
  data.push(['Valor residual estimado año ' + HORIZONTE_ANOS + ':', CAPEX * 0.10, 'CLP (10% del CAPEX)']);
  data.push(['Capital trabajo: 2.5 meses egresos típicos · varía por ubicación']);

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [4, 56, 18, 10, 22]);
  for (let r = 2; r <= INVERSION.length + 5; r += 1) {
    if (ws['C' + r]) ws['C' + r].z = moneyFmt;
    if (ws['E' + r]) ws['E' + r].z = moneyFmt;
  }
  XLSX.utils.book_append_sheet(wb, ws, 'Inversion');
}

// ============================================================
// HOJA 7: COMPARATIVO VAN POR UBICACIÓN (con score y veredicto)
// ============================================================
{
  const data = [
    ['#', 'Ubicación', 'Comuna', 'Combos/día', 'Inv. total', 'EBITDA año 1',
     'VAN base', 'VAN pesim.', 'VAN optim.', 'TIR base', 'Payback (años)',
     'Score 0-100', 'Veredicto'],
  ];
  resultados.forEach((r, i) => {
    const v = veredicto(r);
    data.push([
      i + 1, r.u.nombre, r.u.comuna, r.base.combosDia,
      r.base.inversionTotal, r.base.ebitdaAno1,
      r.base.van, r.pes.van, r.opt.van,
      Number.isFinite(r.base.tir) ? r.base.tir : null,
      Number.isFinite(r.base.payback) && r.base.payback > 0 && r.base.payback <= HORIZONTE_ANOS
        ? Math.round(r.base.payback * 100) / 100
        : '> 5',
      scoreUbicacion(r),
      v.texto,
    ]);
  });
  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [4, 36, 16, 12, 16, 16, 16, 16, 16, 12, 14, 11, 22]);
  for (let r = 2; r <= resultados.length + 1; r += 1) {
    ['E', 'F', 'G', 'H', 'I'].forEach((c) => { if (ws[c + r]) ws[c + r].z = moneyFmt; });
    if (ws['J' + r]) ws['J' + r].z = pctFmt;
  }
  XLSX.utils.book_append_sheet(wb, ws, 'Comparativo_VAN');
}

// ============================================================
// HOJA 8: FLUJO ANUAL — UBICACIÓN GANADORA (modelo corregido)
// ============================================================
{
  const r = ganadora.base;
  const u = ganadora.u;
  const data = [
    [{ v: 'FLUJO DE CAJA PURO · ' + u.nombre.toUpperCase(), s: { font: { bold: true, sz: 14 } } }],
    [`VAN ${r.van.toLocaleString('es-CL')}  ·  TIR ${(r.tir * 100).toFixed(1)}%  ·  Payback ${Number.isFinite(r.payback) ? r.payback.toFixed(2) + ' años' : '> 5 años'}`],
    [],
    ['Concepto', 'Año 0', 'Año 1', 'Año 2', 'Año 3', 'Año 4', 'Año 5'],
  ];
  // Construir matriz a partir del detalle anual del modelo
  const labels = [
    'Combos/año', 'Ingresos', '(-) Costos variables', '(-) Costos fijos',
    '(-) Comisión tarjetas (2.8%)', 'EBITDA', '(-) Depreciación', 'EBIT (UAI)',
    '(-) Impuesto', 'Utilidad neta', '(+) Reversión depreciación', 'Flujo operacional',
    '(+) Recupero CT', '(+) Valor residual neto', '(+) Valor terminal (3.5x EBITDA)',
    '(-) Inversión inicial', '(-) Capital de trabajo',
    'FLUJO NETO DE CAJA',
  ];
  const matriz = labels.map(() => ['', '', '', '', '', '', '']);
  // Año 0
  matriz[15][1] = -CAPEX;
  matriz[16][1] = -r.capitalTrabajo;
  matriz[17][1] = -CAPEX - r.capitalTrabajo;
  // Años 1-5 desde detalleAnual
  r.detalleAnual.slice(1).forEach((d, idx) => {
    const col = idx + 2; // año 1 va en columna 2
    matriz[0][col] = Math.round(d.combos);
    matriz[1][col] = d.ingresos;
    matriz[2][col] = -d.cv;
    matriz[3][col] = -d.cf;
    matriz[4][col] = -d.comisiones;
    matriz[5][col] = d.ebitda;
    matriz[6][col] = -d.depreciacion;
    matriz[7][col] = d.ebit;
    matriz[8][col] = -d.impuesto;
    matriz[9][col] = d.utilidadNeta;
    matriz[10][col] = d.depreciacion;
    matriz[11][col] = d.flujoOper;
    if (d.ano === HORIZONTE_ANOS) {
      matriz[12][col] = d.recuperoKT;
      matriz[13][col] = d.valorResidual;
      matriz[14][col] = d.valorTerminal;
    }
    matriz[17][col] = d.flujoNeto;
  });
  labels.forEach((label, i) => {
    matriz[i][0] = label;
    data.push(matriz[i]);
  });
  data.push([]);
  data.push([{ v: 'INDICADORES', s: { font: { bold: true } } }]);
  data.push(['VAN', r.van]);
  data.push(['TIR', r.tir]);
  data.push(['Payback (años)', Number.isFinite(r.payback) ? r.payback : '> 5']);
  data.push(['Tasa de descuento (Tcc)', TCC]);
  data.push(['Crecimiento demanda (g)', G_DEMANDA]);
  data.push(['Múltiplo EBITDA terminal', MULT_EBITDA_TERMINAL]);

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [38, 15, 15, 15, 15, 15, 15]);

  // Formato numérico
  for (let r2 = 5; r2 <= 22; r2 += 1) {
    ['B', 'C', 'D', 'E', 'F', 'G'].forEach((c) => {
      const cell = ws[c + r2];
      if (cell && typeof cell.v === 'number') {
        if (r2 === 5) cell.z = intFmt;
        else cell.z = moneyFmt;
      }
    });
  }
  // Resaltar EBITDA, Flujo operacional y Flujo neto
  [10, 16, 22].forEach((rowIdx) => {
    ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach((c) => {
      const cell = ws[c + rowIdx];
      if (cell) cell.s = { font: { bold: true } };
    });
  });
  // VAN/TIR fila inferior
  if (ws['B25']) ws['B25'].z = moneyFmt;
  if (ws['B26']) ws['B26'].z = pctFmt;
  if (ws['B28']) ws['B28'].z = pctFmt;
  if (ws['B29']) ws['B29'].z = pctFmt;
  if (ws['B30']) ws['B30'].z = '0.0';
  XLSX.utils.book_append_sheet(wb, ws, 'Flujo_Ganadora');
}

// ============================================================
// HOJA 9: SENSIBILIDAD (de la ubicación ganadora)
// ============================================================
{
  const variables = [
    { nombre: 'Ticket promedio', clave: 'ticket', factor: (u, d) => ({ ...u, ticketPromedio: u.ticketPromedio * (1 + d) }) },
    { nombre: 'Demanda (combos/día)', clave: 'demanda', factor: (u, d) => ({ ...u, combosDiaBase: u.combosDiaBase * (1 + d) }) },
    { nombre: 'Costo variable insumo', clave: 'cv', factor: (u, d) => ({ ...u, costoVariableUnitario: u.costoVariableUnitario * (1 + d) }) },
    { nombre: 'Arriendo UF/m²', clave: 'arr', factor: (u, d) => ({ ...u, arriendoUFm2: u.arriendoUFm2 * (1 + d) }) },
    { nombre: 'Sueldos planilla', clave: 'sue', factor: (u, d) => ({ ...u, _sueldoFactor: 1 + d }) },
  ];
  const deltas = [-0.20, -0.10, 0.10, 0.20];
  const baseVan = ganadora.base.van;
  const data = [
    [{ v: 'ANÁLISIS DE SENSIBILIDAD · ' + ganadora.u.nombre, s: { font: { bold: true, sz: 12 } } }],
    [`VAN base: $${baseVan.toLocaleString('es-CL')}`],
    [],
    ['Variable', '−20%', '−10%', 'Base', '+10%', '+20%'],
  ];

  variables.forEach((v) => {
    const fila = [v.nombre];
    deltas.forEach((d) => {
      const u2 = v.factor(ganadora.u, d);
      // Si factorial sueldos: workaround — uso nuestro modelo base pero ajustando temporalmente
      // Para mantener simpleza, recalculamos pasando una función parche
      const res = calcularUbicacion(u2, 'base');
      // Si era sueldos, ajustar manualmente la planilla en el cálculo
      let vanAjustado = res.van;
      if (v.clave === 'sue') {
        // Aproximación: planilla anual delta × (1 - tasa) descontado
        const deltaPlanilla = PLANILLA_MENSUAL_TOTAL * d * 12;
        // Impacto VAN ≈ -deltaPlanilla × (1 - 0.25) × Σ 1/(1+Tcc)^t
        const factor = (1 - Math.pow(1 + TCC, -HORIZONTE_ANOS)) / TCC;
        vanAjustado = baseVan - deltaPlanilla * (1 - TASA_IMPUESTO) * factor;
      }
      fila.push(Math.round(vanAjustado));
    });
    fila.splice(3, 0, baseVan);
    data.push(fila);
  });

  data.push([]);
  data.push([{ v: 'IMPACTO EN VAN (variación − base) — ordenado por sensibilidad', s: { font: { bold: true } } }]);
  data.push(['Variable', '−20%', '−10%', 'Base', '+10%', '+20%']);
  // Recalcular impacto
  const impactos = variables.map((v, idx) => {
    const fila = data[4 + idx]; // data row con valores
    const impacto20 = (fila[1] - baseVan); // peor caso
    return { nombre: v.nombre, impacto: Math.abs(impacto20), fila };
  });
  impactos.sort((a, b) => b.impacto - a.impacto);
  impactos.forEach((imp) => {
    const filaImpacto = [imp.nombre];
    for (let j = 1; j <= 5; j += 1) {
      const v = imp.fila[j];
      filaImpacto.push(typeof v === 'number' ? v - baseVan : '');
    }
    data.push(filaImpacto);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [28, 18, 18, 18, 18, 18]);
  for (let r = 5; r <= 9; r += 1) {
    ['B', 'C', 'D', 'E', 'F'].forEach((c) => { if (ws[c + r]) ws[c + r].z = moneyFmt; });
  }
  for (let r = 13; r <= 17; r += 1) {
    ['B', 'C', 'D', 'E', 'F'].forEach((c) => { if (ws[c + r]) ws[c + r].z = moneyFmt; });
  }
  XLSX.utils.book_append_sheet(wb, ws, 'Sensibilidad');
}

// ============================================================
// HOJA 10: RIESGOS
// ============================================================
{
  const data = [
    [{ v: 'MATRIZ DE RIESGOS DEL PROYECTO', s: { font: { bold: true, sz: 14 } } }],
    [],
    ['#', 'Riesgo', 'Categoría', 'Probabilidad', 'Impacto', 'Score', 'Mitigación', 'Responsable'],
    [1, 'Caída de demanda por contracción económica', 'Mercado', 'Media', 'Alto', 'Alto', 'Diversificar canal (delivery, oficinas), revisar mix combo, ajustar estacionalidad', 'Gerencia'],
    [2, 'Aumento del precio del café importado', 'Suministro', 'Media', 'Medio', 'Medio', 'Contratos suministro 6-12 meses, alternativa proveedor local, hedge UF', 'Operaciones'],
    [3, 'Subida de arriendo al renovar contrato', 'Inmobiliario', 'Alta', 'Alto', 'Crítico', 'Negociar contrato 3-5 años con cláusula reajuste IPC tope, opción renovación', 'Gerencia'],
    [4, 'Apertura de competencia directa adyacente', 'Competencia', 'Media', 'Alto', 'Alto', 'Programa fidelización desde día 1, café distintivo, comunidad social media', 'Marketing'],
    [5, 'Cambios regulatorios sanitarios SEREMI', 'Regulatorio', 'Baja', 'Medio', 'Medio', 'Monitoreo trimestral, certificaciones al día, asesor sanitario externo', 'Operaciones'],
    [6, 'Aumento del salario mínimo / leyes laborales', 'Laboral', 'Media', 'Medio', 'Medio', 'Revisión productividad/persona, automatización (POS autoservicio si crece volumen)', 'Gerencia'],
    [7, 'Tipo de cambio insumos importados (granos especialidad)', 'FX', 'Media', 'Medio', 'Medio', 'Mix proveedores nacionales/import, contratos en UF cuando sea posible', 'Operaciones'],
    [8, 'Falla de máquina espresso (corazón operación)', 'Operacional', 'Baja', 'Alto', 'Medio', 'Mantención preventiva trimestral, contrato servicio técnico SLA 24h, fondo reposición', 'Operaciones'],
    [9, 'Robo o vandalismo (seguridad)', 'Operacional', 'Media', 'Medio', 'Medio', 'Cámaras + alarma + seguro multiriesgo + protocolo cierre nocturno', 'Operaciones'],
    [10, 'Pandemia / emergencia que reduce flujo peatonal', 'Sanitario externo', 'Baja', 'Crítico', 'Alto', 'Reserva cash 6+ meses egresos, capacidad delivery rápido, plan contingencia', 'Gerencia'],
    [11, 'Rotación alta de baristas (1-2 personas críticas)', 'Talento', 'Alta', 'Medio', 'Alto', 'Contratos indefinidos, capacitación interna, segundo barista siempre certificado', 'RH'],
    [12, 'Caída del proveedor de combo envasado', 'Suministro', 'Baja', 'Crítico', 'Alto', 'Mínimo 2 proveedores certificados SEREMI, stock reserva 1 semana mínimo', 'Operaciones'],
    [13, 'Comisión tarjetas sube por nueva ley', 'Regulatorio', 'Baja', 'Medio', 'Bajo', 'Negociar tarifa preferente Transbank PYME, considerar wallets (Mercado Pago) más baratos', 'Operaciones'],
    [14, 'Incremento costos servicios básicos (UF en luz/gas)', 'Macro', 'Media', 'Medio', 'Medio', 'Plan tarifa fija con CGE/Enel, eficiencia energética en equipos', 'Operaciones'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [4, 50, 18, 14, 12, 14, 70, 14]);
  XLSX.utils.book_append_sheet(wb, ws, 'Riesgos');
}

// ============================================================
// HOJA 11: CONCLUSIÓN
// ============================================================
{
  const recomendadas = resultados.filter((r) => r.base.van > 0 && scoreUbicacion(r) >= 55);
  const noRecomendadas = resultados.filter((r) => !(r.base.van > 0 && scoreUbicacion(r) >= 55));

  const data = [
    [{ v: 'CONCLUSIÓN Y RECOMENDACIÓN FINAL', s: { font: { bold: true, sz: 16 } } }],
    [],
    [{ v: '1. UBICACIÓN RECOMENDADA: ' + ganadora.u.nombre.toUpperCase(), s: { font: { bold: true, sz: 13 } } }],
    [],
    ['Indicador', 'Valor'],
    ['VAN base', '$' + ganadora.base.van.toLocaleString('es-CL')],
    ['TIR', (ganadora.base.tir * 100).toFixed(1) + '%'],
    ['Payback', Number.isFinite(ganadora.base.payback) ? ganadora.base.payback.toFixed(2) + ' años' : '> 5 años'],
    ['Inversión inicial', '$' + ganadora.base.inversionTotal.toLocaleString('es-CL')],
    ['Combos/día base', ganadora.base.combosDia],
    ['EBITDA año 1', '$' + ganadora.base.ebitdaAno1.toLocaleString('es-CL')],
    ['Margen contribución', ((ganadora.u.ticketPromedio - ganadora.u.costoVariableUnitario) / ganadora.u.ticketPromedio * 100).toFixed(1) + '%'],
    ['Score viabilidad', scoreUbicacion(ganadora) + ' / 100'],
    [],
    [{ v: 'Justificación:', s: { font: { bold: true } } }],
    [ganadora.u.notasZona],
    [],
    [{ v: '2. UBICACIONES POR ESCENARIO', s: { font: { bold: true, sz: 13 } } }],
    [],
    [{ v: '✅ Recomendadas (' + recomendadas.length + ')', s: { font: { bold: true } } }],
    ...(recomendadas.length === 0 ? [['(ninguna)']] : recomendadas.map((r) => [
      r.u.nombre, '$' + r.base.van.toLocaleString('es-CL'),
      Number.isFinite(r.base.tir) ? (r.base.tir * 100).toFixed(1) + '%' : '—',
      'Score ' + scoreUbicacion(r),
    ])),
    [],
    [{ v: '❌ No recomendadas (' + noRecomendadas.length + ')', s: { font: { bold: true } } }],
    ...noRecomendadas.map((r) => [
      r.u.nombre, '$' + r.base.van.toLocaleString('es-CL'),
      Number.isFinite(r.base.tir) ? (r.base.tir * 100).toFixed(1) + '%' : '—',
      'Score ' + scoreUbicacion(r),
    ]),
    [],
    [{ v: '3. INSIGHT CLAVE', s: { font: { bold: true, sz: 13 } } }],
    [],
    ['Tras corrección del modelo (costos fijos reales, comisión tarjetas, valor terminal por múltiplo EBITDA y'],
    ['Tcc retail food de 14%), solo 1 de las 7 ubicaciones evaluadas ofrece VAN claramente positivo y resiliente.'],
    [''],
    ['Esto refleja la realidad del retail food en Chile: la rentabilidad depende críticamente de la combinación'],
    ['ticket × volumen × bajo costo fijo. El Golf logra esa combinación gracias a ticket alto ($4.500) sostenible'],
    ['por el perfil ejecutivo de la zona y al volumen estable concentrado en horario laboral. El proyecto es'],
    ['VIABLE pero NO sin riesgo: el escenario pesimista (-40% demanda) destruye valor, lo que obliga a un'],
    ['plan de contingencia sólido y monitoreo mensual de KPIs operativos.'],
    [],
    [{ v: '4. PRÓXIMOS PASOS', s: { font: { bold: true, sz: 13 } } }],
    [],
    ['1. Validar arriendo del local con propietario (firmar reserva con cláusula de renovación)'],
    ['2. Iniciar trámite SII (Form 4415, código 561010 cafés y restaurantes, Pro PYME 14 D N°3)'],
    ['3. Solicitar resolución sanitaria SEREMI categoría manipulación mínima (plazo 4-6 sem)'],
    ['4. Capacitar 2 baristas en curso manipulador alimentos (10 hrs OTEC autorizada, vigencia 3 años)'],
    ['5. Concretar línea de crédito PYME bancaria si se opta por flujo inversionista (preaprobación)'],
    ['6. Plan de marketing y comunidad pre-apertura (2 meses antes — Instagram, Google Maps, fidelización)'],
    ['7. Negociar contratos con 2 proveedores certificados de combo envasado (volumen + alternativa)'],
    ['8. Cronograma de obra menor + compra equipos (8-12 semanas hasta apertura)'],
    [],
    [{ v: '5. LIMITACIONES Y SUPUESTOS DEL MODELO', s: { font: { bold: true, sz: 13 } } }],
    [],
    ['• Demanda calibrada con proxies (flujo peatonal, ingreso comuna, accesibilidad transporte) sin estudio'],
    ['  primario en local específico — recomendable contar tráfico real durante 1 semana antes de firmar'],
    ['• Arriendos referenciales agregados — el valor final depende de negociación específica del contrato'],
    ['• Costos del combo envasado dependen del contrato con proveedor (volumen, exclusividad)'],
    ['• Modelo asume contrato de arriendo a 5 años con reajuste IPC; cambios drásticos requieren re-evaluación'],
    ['• Valor terminal por múltiplo EBITDA asume venta del going concern al cabo de 5 años a un precio de'],
    ['  3.5x EBITDA del año 5. Más conservador que perpetuidad creciente (Gordon Growth) que no es realista'],
    ['  para una cafetería independiente sin re-inversión en equipos.'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [55, 22, 14, 18]);
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
console.log(`  Tamaño: ${(buffer.length / 1024).toFixed(1)} KB\n`);
console.log('═══ TOP 3 UBICACIONES (modelo corregido) ═══');
resultados.slice(0, 3).forEach((r, i) => {
  const v = veredicto(r);
  const tir = Number.isFinite(r.base.tir) ? (r.base.tir * 100).toFixed(1) + '%' : '—';
  const pb = Number.isFinite(r.base.payback) && r.base.payback > 0 ? r.base.payback.toFixed(2) + ' años' : '> 5';
  console.log(`${i + 1}. ${r.u.nombre}`);
  console.log(`   VAN: $${r.base.van.toLocaleString('es-CL')} · TIR: ${tir} · Payback: ${pb} · Score: ${scoreUbicacion(r)} · ${v.texto}`);
});
