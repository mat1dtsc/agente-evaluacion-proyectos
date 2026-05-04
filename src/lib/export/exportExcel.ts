import * as XLSX from 'xlsx';
import type { ProjectInputs } from '@/lib/finance/types';
import type { FinancialModelOutput } from '@/hooks/useFinancialModel';
import {
  computeCostoLaboral, planillaAnual, IMM_2025, TASAS_EMPLEADOR,
} from '@/lib/finance/personal';
import {
  NORMATIVAS_RETAIL_FOOD, costoInicialNormativo, costoAnualNormativo,
  regimenTributarioSugerido, UF_2025, UTM_2025,
} from '@/lib/finance/normativas';

interface Args {
  inputs: ProjectInputs;
  model: FinancialModelOutput;
  projectName: string;
  location: { lat: number; lng: number; label?: string } | null;
}

/**
 * Exporta el modelo financiero a un .xlsx con FÓRMULAS VIVAS.
 * Las hojas Inputs y Cálculo tienen las celdas de outputs como fórmulas Excel
 * (=NPV, =IRR, =SUMA, =SI, etc.), no valores duros — abrir en Excel y modificar
 * un input recalcula VAN/TIR automáticamente.
 */
export function exportExcel({ inputs, model, projectName, location }: Args): void {
  const wb = XLSX.utils.book_new();

  // -------- Hoja Inputs --------
  const inputRows: any[][] = [
    ['Proyecto', projectName],
    ['Ubicación', location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : '—'],
    ['Generado', new Date().toISOString()],
    [],
    ['INPUTS', 'Valor', 'Unidad'],
    ['Inversión inicial', inputs.inversionInicial, 'CLP'],
    ['Capital de trabajo', inputs.capitalTrabajo, 'CLP'],
    ['Vida útil', inputs.vidaUtilAnos, 'años'],
    ['Combos/día base', inputs.combosPorDiaBase, ''],
    ['Días operación/año', inputs.diasOperacionAno, ''],
    ['Crecimiento demanda', inputs.crecimientoDemanda, '%'],
    ['Ticket promedio', inputs.ticketPromedio, 'CLP'],
    ['Costo variable unitario', inputs.costoVariableUnitario, 'CLP'],
    ['Costos fijos mensuales', inputs.costosFijosMensuales, 'CLP'],
    ['Tasa impuesto', inputs.tasaImpuesto, '%'],
    ['Tasa costo capital (Tcc)', inputs.tasaCostoCapital, '%'],
    ['% Deuda', inputs.porcentajeDeuda, '%'],
    ['Tasa banco', inputs.tasaBanco, '%'],
    ['Plazo deuda', inputs.plazoDeudaAnos, 'años'],
    ['Depreciación', inputs.depreciacionAnos, 'años'],
    ['Valor residual', inputs.valorResidual, 'CLP'],
    ['Crecimiento perpetuidad (g)', inputs.crecimientoPerpetuidad, '%'],
  ];
  const wsInputs = XLSX.utils.aoa_to_sheet(inputRows);
  XLSX.utils.book_append_sheet(wb, wsInputs, 'Inputs');

  // -------- Hoja Flujo Puro con fórmulas Excel vivas --------
  const wsP = construirHojaFlujoExcel(inputs, false);
  XLSX.utils.book_append_sheet(wb, wsP, 'FlujoPuro');

  // -------- Hoja Flujo Inversionista con fórmulas vivas --------
  const wsI = construirHojaFlujoExcel(inputs, true);
  XLSX.utils.book_append_sheet(wb, wsI, 'FlujoInversionista');

  // -------- Hoja KPIs (referenciando las hojas anteriores) --------
  const wsKpi = XLSX.utils.aoa_to_sheet([
    ['KPI', 'Valor'],
    [{ v: 'VAN puro', t: 's' }, { f: `NPV(Inputs!B16, FlujoPuro!C20:G20) + FlujoPuro!B20`, t: 'n' }],
    [{ v: 'TIR puro', t: 's' }, { f: `IRR(FlujoPuro!B20:G20)`, t: 'n' }],
    [{ v: 'VAN inversionista', t: 's' }, { f: `NPV(Inputs!B16, FlujoInversionista!C20:G20) + FlujoInversionista!B20`, t: 'n' }],
    [{ v: 'TIR inversionista', t: 's' }, { f: `IRR(FlujoInversionista!B20:G20)`, t: 'n' }],
    [{ v: 'Break-even diario (combos)', t: 's' }, { v: model.breakeven, t: 'n' }],
  ]);
  XLSX.utils.book_append_sheet(wb, wsKpi, 'KPIs');

  // -------- Hoja Personal (planilla con leyes sociales chilenas) --------
  if (inputs.personal && inputs.personal.length > 0) {
    const personalRows: any[][] = [
      ['Cargo', 'Cantidad', 'Bruto/mes', 'AFC empleador (2.4%)', 'SIS (1.85%)', 'Mutual (0.95%)', 'Gratif. legal', 'Prov. vacaciones', 'Prov. indemnización', 'Costo total/mes/persona', 'Costo total/mes', 'Costo total/año', 'Factor x'],
    ];
    for (const c of inputs.personal) {
      const b = computeCostoLaboral(c);
      personalRows.push([
        c.cargo, c.cantidad, c.sueldoBrutoMensual,
        b.afcEmpleador, b.sis, b.mutual,
        b.gratificacionMensual, b.provVacaciones, b.provIndemnizacion,
        b.costoMensualPorPersona, b.costoMensualTotal, b.costoAnualTotal,
        b.factor,
      ]);
    }
    personalRows.push([]);
    personalRows.push(['TOTALES', '', '', '', '', '', '', '', '', '', '', planillaAnual(inputs.personal), '']);
    personalRows.push([]);
    personalRows.push(['Tasa AFC empleador', TASAS_EMPLEADOR.afcIndefinido, '(2.4% indefinido, 3% plazo fijo)']);
    personalRows.push(['Tasa SIS', TASAS_EMPLEADOR.sis, '(financia AFP, paga empleador desde 2009)']);
    personalRows.push(['Tasa Mutual base', TASAS_EMPLEADOR.mutualBase, '(Ley 16.744 — accidentes del trabajo)']);
    personalRows.push(['Provisión vacaciones', TASAS_EMPLEADOR.provVacaciones, '(15 días hábiles ≈ 1 mes/año)']);
    personalRows.push(['Provisión indemnización', TASAS_EMPLEADOR.provIndemnizacion, '(1 mes/año Art. 163 CT, tope 11 años)']);
    personalRows.push(['IMM 2025', IMM_2025, 'Ingreso Mínimo Mensual']);
    personalRows.push(['Tope gratificación legal anual', IMM_2025 * 4.75, '4.75 IMM Art. 50 CT']);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(personalRows), 'Personal');
  }

  // -------- Hoja Normativas (permisos y obligaciones chilenas) --------
  const normRows: any[][] = [
    ['Norma', 'Organismo', 'Tipo', 'Costo CLP', 'Obligatorio', 'Base legal', 'Trámite'],
  ];
  for (const n of NORMATIVAS_RETAIL_FOOD) {
    normRows.push([
      n.nombre, n.organismo, n.tipo, n.costoCLP, n.obligatorio ? 'Sí' : 'No', n.base_legal, n.tramite,
    ]);
  }
  normRows.push([]);
  normRows.push(['TOTAL costos iniciales', costoInicialNormativo()]);
  normRows.push(['TOTAL costos anuales recurrentes', costoAnualNormativo()]);
  normRows.push([]);
  const reg = regimenTributarioSugerido(
    inputs.combosPorDiaBase * inputs.diasOperacionAno * inputs.ticketPromedio,
  );
  normRows.push(['REGIMEN TRIBUTARIO SUGERIDO', reg.regimen]);
  normRows.push(['Tasa de impuesto', reg.tasa]);
  normRows.push(['Ventas anuales (UF)', reg.ventasUF]);
  normRows.push(['Base legal', reg.base_legal]);
  normRows.push([]);
  normRows.push(['Referencias 2025', '']);
  normRows.push(['UF', UF_2025]);
  normRows.push(['UTM', UTM_2025]);
  normRows.push(['IMM', IMM_2025]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(normRows), 'Normativas');

  // -------- Hoja Flujo Mensual (60 períodos) --------
  if (model.flujoMensualPuro) {
    const monthlyRows: any[][] = [
      ['Mes', 'Año', 'Mes en año', 'Ingresos', 'Costos variables', 'Costos fijos no laborales', 'Costo personal', 'Costos normativos', 'Depreciación', 'Intereses', 'UAI', 'Impuesto', 'UDI', 'Flujo operacional', 'Inversión', 'Capital trabajo', 'Recupero CT', 'Valor residual', 'Préstamo', 'Amortización deuda', 'Flujo neto'],
    ];
    for (const m of model.flujoMensualPuro.cashFlowMonthly) {
      monthlyRows.push([
        m.mes, m.ano, m.mesEnAno,
        m.ingresos, m.costosVariables, m.costosFijosNoLaborales, m.costoPersonal, m.costosNormativos,
        m.depreciacion, m.intereses,
        m.utilidadAntesImpuesto, m.impuesto, m.utilidadNeta, m.flujoOperacional,
        m.inversion, m.capitalTrabajo, m.recuperoCT, m.valorResidual,
        m.prestamoRecibido, m.amortizacionDeuda, m.flujoCajaNeto,
      ]);
    }
    monthlyRows.push([]);
    monthlyRows.push(['Tasa anual', inputs.tasaCostoCapital]);
    monthlyRows.push(['Tasa mensual equivalente', model.flujoMensualPuro.tasaMensual]);
    monthlyRows.push(['VAN mensual', { f: `NPV(B${monthlyRows.length}, U2:U61)+U2`, t: 'n' }]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(monthlyRows), 'FlujoMensual');
  }

  // -------- Hoja IVA (modelado separado) --------
  const ivaRows: any[][] = [
    ['IVA — DL 825/74 · Tasa 19%'],
    [''],
    ['NOTA: el flujo principal trabaja en valores netos. El IVA débito (sobre ventas) se compensa mensualmente con el IVA crédito (sobre compras) y se declara en Form 29 antes del día 12 del mes siguiente.'],
    [''],
    ['', 'Mensual', 'Anual'],
    ['Ventas netas', inputs.combosPorDiaBase * inputs.diasOperacionAno * inputs.ticketPromedio / 12, inputs.combosPorDiaBase * inputs.diasOperacionAno * inputs.ticketPromedio],
    ['IVA débito (19% sobre ventas)', { f: `B6*0.19`, t: 'n' }, { f: `C6*0.19`, t: 'n' }],
    ['Compras insumos netas', inputs.costoVariableUnitario * inputs.combosPorDiaBase * inputs.diasOperacionAno / 12, inputs.costoVariableUnitario * inputs.combosPorDiaBase * inputs.diasOperacionAno],
    ['Compras fijos netas (estimado)', inputs.costosFijosMensuales * 0.4, inputs.costosFijosMensuales * 0.4 * 12],
    ['IVA crédito total', { f: `(B8+B9)*0.19`, t: 'n' }, { f: `(C8+C9)*0.19`, t: 'n' }],
    ['IVA neto a pagar', { f: `B7-B10`, t: 'n' }, { f: `C7-C10`, t: 'n' }],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ivaRows), 'IVA');

  // -------- Hoja Sensibilidad --------
  const sensRows: any[][] = [['Variable', 'Delta', 'VAN puro', 'VAN inversionista', 'Impacto VAN puro']];
  for (const r of model.sensitivity) {
    sensRows.push([r.variable, r.delta, r.vanPuro, r.vanInversionista, r.impactoVanPuro]);
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sensRows), 'Sensibilidad');

  // -------- Hoja README --------
  const readme = XLSX.utils.aoa_to_sheet([
    ['Modelo financiero — Agente de Evaluación de Proyectos'],
    [],
    ['Las hojas FlujoPuro y FlujoInversionista tienen fórmulas Excel VIVAS:'],
    ['cambia un input en la hoja Inputs y los KPIs (VAN/TIR) recalculan automáticamente.'],
    [],
    ['Estructura de filas (FlujoPuro y FlujoInversionista):'],
    ['Fila 5: Combos/día (con crecimiento)'],
    ['Fila 6: Ingresos = Combos * Días * Ticket'],
    ['Fila 7: Costos variables'],
    ['Fila 8: Costos fijos'],
    ['Fila 9: Depreciación'],
    ['Fila 10: Intereses (sólo inversionista)'],
    ['Fila 11: UAI'],
    ['Fila 12: Impuesto = MAX(0, UAI * tasa)'],
    ['Fila 13: Utilidad neta'],
    ['Fila 14: Flujo operacional'],
    ['Fila 15-19: Inversión, CT, recupero, valor residual, deuda'],
    ['Fila 20: Flujo de caja neto'],
  ]);
  XLSX.utils.book_append_sheet(wb, readme, 'README');

  XLSX.writeFile(wb, `${slugify(projectName)}_modelo_financiero.xlsx`);
}

/**
 * Construye la hoja con fórmulas Excel vivas. Las celdas de output son fórmulas
 * que referencian la hoja Inputs (B6, B7, ...) y otras celdas de la misma hoja.
 */
function construirHojaFlujoExcel(inputs: ProjectInputs, conDeuda: boolean): XLSX.WorkSheet {
  const N = inputs.vidaUtilAnos;
  const cols: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
  const rows: any[][] = [];

  // Encabezado
  const headers = ['Concepto', ...Array.from({ length: N + 1 }, (_, i) => `Año ${i}`)];
  rows.push(headers);
  rows.push([]); // fila 2 vacía
  rows.push(['Tasa descuento', { f: 'Inputs!B16', t: 'n' }]); // fila 3
  rows.push(['Tasa impuesto', { f: 'Inputs!B15', t: 'n' }]);  // fila 4

  // Fila 5: Combos/día (col B = año 0 vacío)
  const combosRow: any[] = ['Combos/día', ''];
  for (let t = 1; t <= N; t += 1) {
    combosRow.push({ f: `Inputs!B9*((1+Inputs!B11)^${t - 1})`, t: 'n' });
  }
  rows.push(combosRow);

  // Fila 6: Ingresos
  const ingresosRow: any[] = ['Ingresos', 0];
  for (let t = 1; t <= N; t += 1) {
    const c = cols[t + 1]; // col del año t (B=año0, C=año1, ...)
    ingresosRow.push({ f: `${c}5*Inputs!B10*Inputs!B12`, t: 'n' });
  }
  rows.push(ingresosRow);

  // Fila 7: Costos variables
  const cvRow: any[] = ['Costos variables', 0];
  for (let t = 1; t <= N; t += 1) {
    const c = cols[t + 1];
    cvRow.push({ f: `${c}5*Inputs!B10*Inputs!B13`, t: 'n' });
  }
  rows.push(cvRow);

  // Fila 8: Costos fijos
  const cfRow: any[] = ['Costos fijos', 0];
  for (let t = 1; t <= N; t += 1) cfRow.push({ f: `Inputs!B14*12`, t: 'n' });
  rows.push(cfRow);

  // Fila 9: Depreciación
  const depRow: any[] = ['Depreciación', 0];
  for (let t = 1; t <= N; t += 1) {
    depRow.push(t <= inputs.depreciacionAnos ? { f: `Inputs!B6/Inputs!B20`, t: 'n' } : 0);
  }
  rows.push(depRow);

  // Fila 10: Intereses (sólo inversionista — schedule francés simplificado)
  const intRow: any[] = ['Intereses', 0];
  if (conDeuda) {
    // Saldo inicial = Inversion * %deuda; intereses_t = saldo_t * tasa_banco
    // Aproximamos con interés simple decreciente lineal (cuota constante exacta no cabe en una sola fórmula sin tabla aux)
    // Para mantener fórmulas vivas, calculamos cuota francesa con PMT:
    for (let t = 1; t <= N; t += 1) {
      if (t <= inputs.plazoDeudaAnos) {
        // Excel: cumipmt(rate, nper, pv, start_period, end_period, type). Período t = uno solo.
        intRow.push({ f: `IF(Inputs!B17>0, -CUMIPMT(Inputs!B18, Inputs!B19, Inputs!B6*Inputs!B17, ${t}, ${t}, 0), 0)`, t: 'n' });
      } else {
        intRow.push(0);
      }
    }
  } else {
    for (let t = 1; t <= N; t += 1) intRow.push(0);
  }
  rows.push(intRow);

  // Fila 11: UAI
  const uaiRow: any[] = ['UAI', 0];
  for (let t = 1; t <= N; t += 1) {
    const c = cols[t + 1];
    uaiRow.push({ f: `${c}6 - ${c}7 - ${c}8 - ${c}9 - ${c}10`, t: 'n' });
  }
  rows.push(uaiRow);

  // Fila 12: Impuesto = MAX(0, UAI*tasa)
  const taxRow: any[] = ['Impuesto', 0];
  for (let t = 1; t <= N; t += 1) {
    const c = cols[t + 1];
    taxRow.push({ f: `MAX(0, ${c}11*$B$4)`, t: 'n' });
  }
  rows.push(taxRow);

  // Fila 13: Utilidad neta
  const netRow: any[] = ['Utilidad neta', 0];
  for (let t = 1; t <= N; t += 1) {
    const c = cols[t + 1];
    netRow.push({ f: `${c}11 - ${c}12`, t: 'n' });
  }
  rows.push(netRow);

  // Fila 14: Flujo operacional = Utilidad neta + Depreciación
  const foRow: any[] = ['Flujo operacional', 0];
  for (let t = 1; t <= N; t += 1) {
    const c = cols[t + 1];
    foRow.push({ f: `${c}13 + ${c}9`, t: 'n' });
  }
  rows.push(foRow);

  // Filas 15-19: Movimientos de inversión / CT / valor residual / deuda
  const invRow: any[] = ['Inversión'];
  invRow.push({ f: `-Inputs!B6`, t: 'n' });
  for (let t = 1; t <= N; t += 1) invRow.push(0);
  rows.push(invRow);

  const ctRow: any[] = ['Capital trabajo'];
  ctRow.push({ f: `-Inputs!B7`, t: 'n' });
  for (let t = 1; t <= N; t += 1) ctRow.push(0);
  rows.push(ctRow);

  const recRow: any[] = ['Recupero CT'];
  recRow.push(0);
  for (let t = 1; t <= N - 1; t += 1) recRow.push(0);
  recRow.push({ f: `Inputs!B7`, t: 'n' });
  rows.push(recRow);

  const vrRow: any[] = ['Valor residual'];
  vrRow.push(0);
  for (let t = 1; t <= N - 1; t += 1) vrRow.push(0);
  vrRow.push({ f: `Inputs!B21*(1-Inputs!B15)`, t: 'n' });
  rows.push(vrRow);

  const deudaRow: any[] = ['Préstamo / amortización'];
  if (conDeuda) {
    deudaRow.push({ f: `Inputs!B6*Inputs!B17`, t: 'n' });
    for (let t = 1; t <= N; t += 1) {
      if (t <= inputs.plazoDeudaAnos) {
        deudaRow.push({ f: `IF(Inputs!B17>0, CUMPRINC(Inputs!B18, Inputs!B19, Inputs!B6*Inputs!B17, ${t}, ${t}, 0), 0)`, t: 'n' });
      } else {
        deudaRow.push(0);
      }
    }
  } else {
    for (let t = 0; t <= N; t += 1) deudaRow.push(0);
  }
  rows.push(deudaRow);

  // Fila 20: Flujo de caja neto = FO + Inv + CT + Rec + VR + Deuda
  const fcnRow: any[] = ['Flujo neto', { f: `B14 + B15 + B16 + B17 + B18 + B19`, t: 'n' }];
  for (let t = 1; t <= N; t += 1) {
    const c = cols[t + 1];
    fcnRow.push({ f: `${c}14 + ${c}15 + ${c}16 + ${c}17 + ${c}18 + ${c}19`, t: 'n' });
  }
  rows.push(fcnRow);

  // Filas 21-22: VAN y TIR (vivos)
  rows.push([]);
  rows.push(['VAN', { f: `NPV($B$3, C20:${cols[N + 1]}20) + B20`, t: 'n' }]);
  rows.push(['TIR', { f: `IRR(B20:${cols[N + 1]}20)`, t: 'n' }]);

  return XLSX.utils.aoa_to_sheet(rows);
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60);
}
