import {
  Document, Packer, Paragraph, HeadingLevel, Table, TableRow, TableCell, TextRun,
  AlignmentType, WidthType, BorderStyle, ShadingType, PageBreak,
} from 'docx';
import type { ProjectInputs } from '@/lib/finance/types';
import type { FinancialModelOutput } from '@/hooks/useFinancialModel';
import {
  computeCostoLaboral, planillaAnual, IMM_2025, TOPE_GRATIFICACION_ANUAL,
  TASAS_EMPLEADOR,
} from '@/lib/finance/personal';
import {
  NORMATIVAS_RETAIL_FOOD, costoInicialNormativo, costoAnualNormativo,
  regimenTributarioSugerido, UF_2025,
} from '@/lib/finance/normativas';

interface Args {
  inputs: ProjectInputs;
  model: FinancialModelOutput;
  projectName: string;
  location: { lat: number; lng: number; label?: string } | null;
}

const fmtCLP = (v: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Math.round(v));
const fmtPct = (v: number, d = 1) => `${(v * 100).toFixed(d)}%`;

/**
 * Genera un informe profesional de evaluación de proyectos según la
 * estructura del curso EVP UAH MBA 2026 — 18 secciones con marco normativo
 * chileno, planilla con leyes sociales, flujo mensual a 60 períodos,
 * y análisis de sensibilidad.
 */
export async function exportWord({ inputs, model, projectName, location }: Args): Promise<void> {
  const fp = model.flujoPuro;
  const fi = model.flujoInversionista;
  const sens = model.sensitivity;
  const monthly = model.flujoMensualPuro;

  const ventasAnuales = inputs.combosPorDiaBase * inputs.diasOperacionAno * inputs.ticketPromedio;
  const regimen = regimenTributarioSugerido(ventasAnuales);
  const planAnualPersonal = inputs.personal ? planillaAnual(inputs.personal) : 0;
  const costoIniNorm = costoInicialNormativo();
  const costoAnualNorm = costoAnualNormativo();

  const sections: Array<Paragraph | Table> = [];

  // ====================== PORTADA ======================
  sections.push(
    h(projectName, HeadingLevel.HEADING_1, true),
    pSerif('Informe de Evaluación de Proyectos', 28),
    p(''),
    pMono(`Generado: ${new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}`),
    pMono(`Curso: Evaluación de Proyectos — Mauricio Zúñiga · MBA UAH 2026`),
    pMono(location ? `Ubicación: ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}${location.label ? ` — ${location.label}` : ''}` : 'Sin ubicación geográfica fijada.'),
    p(''), p(''),
  );

  // ====================== 1. RESUMEN EJECUTIVO ======================
  sections.push(
    h('1. Resumen ejecutivo', HeadingLevel.HEADING_1),
    p(
      `Este informe evalúa la factibilidad técnica, comercial, normativa y financiera del proyecto "${projectName}". `
      + `El proyecto considera una inversión inicial de ${fmtCLP(inputs.inversionInicial)} en activos físicos, ${fmtCLP(inputs.capitalTrabajo)} en capital de trabajo y `
      + `${fmtCLP(costoIniNorm)} en permisos y trámites iniciales chilenos, financiados con ${fmtPct(inputs.porcentajeDeuda, 0)} de deuda bancaria a tasa nominal anual de ${fmtPct(inputs.tasaBanco, 1)}. `
      + `Sobre un horizonte de evaluación de ${inputs.vidaUtilAnos} años y bajo régimen tributario ${regimen.regimen}, el flujo de caja puro arroja un VAN de ${fmtCLP(fp.van)} `
      + `con una TIR de ${Number.isFinite(fp.tir) ? fmtPct(fp.tir, 2) : '—'}, mientras que el flujo del inversionista entrega VAN ${fmtCLP(fi.van)} y TIR ${Number.isFinite(fi.tir) ? fmtPct(fi.tir, 2) : '—'}. `
      + `El break-even operacional se alcanza con ${Math.round(model.breakeven)} combos/día (caso base supuesto: ${inputs.combosPorDiaBase} combos/día).`
    ),
    p(''),
    pSerif('Recomendación: ', 14, true),
    p(
      fp.van > 0 && fp.tir > inputs.tasaCostoCapital
        ? `El proyecto crea valor económico (VAN > 0, TIR > Tcc=${fmtPct(inputs.tasaCostoCapital, 0)}) y se recomienda ejecutar, sujeto a verificación de los supuestos sensibles identificados en la Sección 16.`
        : `El proyecto no crea valor económico bajo los supuestos actuales. Se recomienda revisar precio, demanda esperada o estructura de costos antes de avanzar.`
    ),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ====================== 2. CONTEXTO Y OPORTUNIDAD ======================
  sections.push(
    h('2. Contexto y oportunidad de mercado', HeadingLevel.HEADING_1),
    p(
      `El consumo de café en Chile ha mostrado un crecimiento sostenido en la última década: el consumo per cápita anual `
      + `alcanza 1,4 kg (vs. 5,6 kg de Brasil y 6,0 kg de Italia, según Procafé/ANCC), con un share de espresso del 32%. `
      + `El segmento "café de especialidad" (third wave coffee) crece 8-12% anual en Santiago, impulsado por consumidores `
      + `de quintiles altos en comunas del oriente capitalino y crecimiento en barrios oficina/universitarios.`
    ),
    p(
      `La oportunidad evaluada propone un formato de café express con combo único (espresso + croissant) en una localización `
      + `con flujo peatonal validado, accesibilidad de transporte público y poder adquisitivo del entorno. El producto único `
      + `simplifica operación (un barista experto, baja merma, ticket predecible) y permite un payback más rápido que un café `
      + `tradicional con carta amplia.`
    ),
    p(''),
  );

  // ====================== 3. MARCO NORMATIVO CHILENO ======================
  sections.push(
    h('3. Marco normativo y regulatorio chileno', HeadingLevel.HEADING_1),
    p(
      `Todo proyecto retail food en Chile debe cumplir con un cuerpo de normativas sanitarias, tributarias, laborales y `
      + `municipales. El siguiente cuadro detalla los permisos y obligaciones aplicables al proyecto, con sus organismos, `
      + `costos referenciales y bases legales:`
    ),
    p(''),
    h('3.1 Permisos iniciales y autorizaciones', HeadingLevel.HEADING_2),
  );

  sections.push(
    tableFromRows([
      ['Norma', 'Organismo', 'Tipo', 'Costo CLP', 'Base legal'],
      ...NORMATIVAS_RETAIL_FOOD
        .filter((n) => n.tipo === 'permiso_inicial' || n.tipo === 'sanitario' || n.tipo === 'recurrente_anual' || n.tipo === 'municipal')
        .map((n) => [n.nombre, n.organismo, n.tipo.replace('_', ' '), n.costoCLP !== null ? fmtCLP(n.costoCLP) : '—', n.base_legal]),
    ]),
  );

  sections.push(
    p(''),
    pMono(`Costo inicial normativo total: ${fmtCLP(costoIniNorm)}`),
    pMono(`Costo anual recurrente normativo: ${fmtCLP(costoAnualNorm)}`),
    p(''),
    h('3.2 Régimen tributario aplicable', HeadingLevel.HEADING_2),
    p(
      `Las ventas anuales proyectadas alcanzan ${fmtCLP(ventasAnuales)} (~${regimen.ventasUF.toFixed(0)} UF al año, con UF=${fmtCLP(UF_2025)}). `
      + `Esto sitúa al proyecto en el régimen ${regimen.regimen} (${regimen.base_legal}) con tasa de impuesto de primera categoría del ${fmtPct(regimen.tasa, 0)}.`
    ),
  );

  if (regimen.beneficios.length > 0) {
    sections.push(p(''), pSerif('Beneficios del régimen Pro PYME:', 12, true));
    regimen.beneficios.forEach((b) => sections.push(p(`• ${b}`)));
  }

  sections.push(
    p(''),
    h('3.3 IVA — tratamiento separado del flujo', HeadingLevel.HEADING_2),
    p(
      `La tasa de IVA en Chile es 19% (DL 825/74). En la metodología de evaluación de proyectos del curso EVP UAH, los flujos `
      + `de caja se construyen en valores netos (sin IVA). El IVA débito (sobre ventas) se compensa mensualmente con el IVA crédito `
      + `(sobre compras de insumos y servicios) y se declara en Form 29 antes del día 12 del mes siguiente. La diferencia neta `
      + `se paga al fisco. El IVA debe modelarse en una plantilla complementaria — no impacta directamente el VAN del proyecto `
      + `siempre que la rotación de pagos/cobros sea normal.`
    ),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ====================== 4. ESTUDIO DE MERCADO ======================
  sections.push(
    h('4. Estudio de mercado y demanda', HeadingLevel.HEADING_1),
    p(
      `La demanda se estima como el producto del flujo poblacional del entorno por una tasa de captura calibrada con benchmarks `
      + `de consumo de café en Chile (Procafé/ANCC). El flujo del entorno se compone de: (i) residentes proyectados por la `
      + `densidad INE Censo+Proyección 2024 multiplicada por el área del radio de evaluación, ajustada por un factor de actividad `
      + `del 50% (residentes que activan el área en un día típico); (ii) flujo de transporte público medido por la cantidad `
      + `de paraderos OSM en el radio multiplicada por subidas+bajadas promedio (≈800 personas/día por paradero RED); `
      + `(iii) afluencia de Metro Santiago (Memoria 2023) ponderada por proximidad de la estación más cercana.`
    ),
    p(''),
    pMono(`Caso base: ${inputs.combosPorDiaBase} combos/día × ${inputs.diasOperacionAno} días/año × ${fmtCLP(inputs.ticketPromedio)} ticket`),
    pMono(`Ventas anuales año 1: ${fmtCLP(ventasAnuales)}`),
    pMono(`Crecimiento anual proyectado: ${fmtPct(inputs.crecimientoDemanda, 1)}`),
    p(''),
  );

  // ====================== 5. LOCALIZACIÓN ======================
  sections.push(
    h('5. Localización y entorno', HeadingLevel.HEADING_1),
    p(
      location
        ? `El local se evalúa en coordenadas (${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}). El radio de análisis cubre demografía `
          + `INE/CASEN, competencia OSM (cafeterías y tiendas de café via Overpass live), red de transporte (Metro de Santiago + paraderos RED OSM) `
          + `y equipamiento urbano (hospitales, universidades, malls).`
        : `No se ha fijado una ubicación específica. Para una evaluación final debe seleccionarse un punto en el mapa del agente.`
    ),
    p(''),
  );

  // ====================== 6. ESTUDIO TÉCNICO ======================
  sections.push(
    h('6. Estudio técnico y operacional', HeadingLevel.HEADING_1),
    p(
      `El local opera con horario continuo lunes a sábado y horario reducido domingo. Se requiere superficie mínima de 35 m² `
      + `(zona pública 18 m², barra y servicio 12 m², bodega y baño 5 m²), sistema eléctrico trifásico para la máquina espresso `
      + `(potencia ≥ 4.5 kW), agua dura/tratada con filtro descalcificador, ventilación forzada y sistema de extinción aprobado por `
      + `Bomberos.`
    ),
    p(''),
    h('6.1 Equipamiento principal (depreciación lineal SLN)', HeadingLevel.HEADING_2),
    tableFromRows([
      ['Activo', 'Vida útil SII', 'Costo CLP', 'Cuota anual'],
      ['Máquina espresso 2-grupos profesional', '7 años', '$8.500.000', '$1.214.000'],
      ['Molino de café cónico', '5 años', '$1.200.000', '$240.000'],
      ['Vitrina refrigerada croissants', '7 años', '$1.800.000', '$257.000'],
      ['Mobiliario y barra (carpintería)', '10 años', '$5.500.000', '$550.000'],
      ['Caja registradora y POS', '5 años', '$650.000', '$130.000'],
      ['Habilitación eléctrica + sanitaria', '20 años', '$3.200.000', '$160.000'],
      ['Letrero y diseño marca', '5 años', '$1.150.000', '$230.000'],
      ['Otros equipos menores', 'varios', '$8.000.000', '$1.600.000'],
      ['Total inversión inicial', '', fmtCLP(inputs.inversionInicial), `${fmtCLP(inputs.inversionInicial / inputs.depreciacionAnos)} (lineal a ${inputs.depreciacionAnos} años)`],
    ]),
    p(''),
  );

  // ====================== 7. ESTRUCTURA ORGANIZACIONAL ======================
  sections.push(
    h('7. Estructura organizacional y planilla de personal', HeadingLevel.HEADING_1),
    p(
      `El cálculo de costos de personal sigue la legislación laboral chilena: sueldo bruto + cotización empleador AFC `
      + `(${fmtPct(TASAS_EMPLEADOR.afcIndefinido, 1)}) + Seguro Invalidez y Sobrevivencia (${fmtPct(TASAS_EMPLEADOR.sis, 2)}) + `
      + `Mutual Ley 16.744 (${fmtPct(TASAS_EMPLEADOR.mutualBase, 2)}) + gratificación legal Art. 50 CT (25% bruto con tope `
      + `4,75 IMM = ${fmtCLP(TOPE_GRATIFICACION_ANUAL)} anuales) + provisión vacaciones (${fmtPct(TASAS_EMPLEADOR.provVacaciones, 2)}) `
      + `+ provisión indemnización por años de servicio (${fmtPct(TASAS_EMPLEADOR.provIndemnizacion, 2)}). El IMM 2025 vigente es `
      + `${fmtCLP(IMM_2025)}.`
    ),
    p(''),
  );

  if (inputs.personal && inputs.personal.length > 0) {
    sections.push(
      h('7.1 Detalle planilla', HeadingLevel.HEADING_2),
      tableFromRows([
        ['Cargo', 'Cant.', 'Bruto/mes', 'Costo/mes (todo incluido)', 'Costo anual', 'Factor'],
        ...inputs.personal.map((c) => {
          const b = computeCostoLaboral(c);
          return [
            c.cargo, String(c.cantidad), fmtCLP(b.brutoMensual),
            fmtCLP(b.costoMensualPorPersona), fmtCLP(b.costoAnualTotal),
            `${b.factor.toFixed(2)}x`,
          ];
        }),
        ['TOTAL', '', '', '', fmtCLP(planAnualPersonal), ''],
      ]),
      p(''),
      pSerif('Notas:', 12, true),
      p('• "Factor" indica el multiplicador efectivo entre costo total empresa y sueldo bruto. Típicamente 1,30–1,35 para sueldos bajo el tope de gratificación.'),
      p('• La indemnización por años de servicio (Art. 163 CT) se provisiona mensualmente. Pago efectivo solo al término del contrato si la causal lo amerita (despido por necesidad de la empresa).'),
      p('• Los manipuladores de alimentos requieren capacitación obligatoria (Art. 60 DS 977/96) cada 3 años.'),
    );
  } else {
    sections.push(
      p(
        `No se ha definido planilla detallada. El modelo usa costos fijos mensuales agregados (${fmtCLP(inputs.costosFijosMensuales)}/mes). `
        + `Para un informe completo se recomienda detallar cada cargo en el panel "Supuestos".`
      ),
    );
  }
  sections.push(new Paragraph({ children: [new PageBreak()] }));

  // ====================== 8. PLAN DE INVERSIONES ======================
  sections.push(
    h('8. Plan de inversiones — período 0', HeadingLevel.HEADING_1),
    tableFromRows([
      ['Concepto', 'Monto CLP'],
      ['Activos fijos depreciables', fmtCLP(inputs.inversionInicial)],
      ['Capital de trabajo (≈6 meses egresos)', fmtCLP(inputs.capitalTrabajo)],
      ['Permisos y trámites iniciales', fmtCLP(costoIniNorm)],
      ['Otros gastos preoperativos', fmtCLP(0)],
      ['TOTAL INVERSIÓN INICIAL', fmtCLP(inputs.inversionInicial + inputs.capitalTrabajo + costoIniNorm)],
    ]),
    p(''),
    pSerif('Capital de trabajo:', 12, true),
    p(
      `Se estima como 6 meses de egresos desembolsables (suma de costos variables + costos fijos + costos normativos del año 1, dividido por 2). `
      + `Esta convención del curso refleja el efectivo necesario para sostener la operación entre ciclos de cobro/pago. `
      + `El capital de trabajo se recupera 100% en el último período del proyecto.`
    ),
    p(''),
  );

  // ====================== 9. ESTRUCTURA DE COSTOS ======================
  sections.push(
    h('9. Estructura de costos', HeadingLevel.HEADING_1),
    h('9.1 Costos variables', HeadingLevel.HEADING_2),
    tableFromRows([
      ['Concepto', 'Por unidad', 'Anual (caso base)'],
      ['Costo insumo unitario (combo)', fmtCLP(inputs.costoVariableUnitario), fmtCLP(inputs.costoVariableUnitario * inputs.combosPorDiaBase * inputs.diasOperacionAno)],
    ]),
    p(''),
    h('9.2 Costos fijos mensuales', HeadingLevel.HEADING_2),
    tableFromRows([
      ['Concepto', 'Mensual', 'Anual'],
      ['Personal (planilla con leyes sociales)', fmtCLP(planAnualPersonal / 12), fmtCLP(planAnualPersonal)],
      ['Costos no laborales (arriendo, servicios, etc.)', fmtCLP(inputs.costosFijosNoLaboralesMensuales ?? inputs.costosFijosMensuales), fmtCLP((inputs.costosFijosNoLaboralesMensuales ?? inputs.costosFijosMensuales) * 12)],
      ['Costos normativos prorrateados', fmtCLP(costoAnualNorm / 12), fmtCLP(costoAnualNorm)],
      ['TOTAL costos fijos', fmtCLP(planAnualPersonal / 12 + (inputs.costosFijosNoLaboralesMensuales ?? inputs.costosFijosMensuales) + costoAnualNorm / 12), fmtCLP(planAnualPersonal + (inputs.costosFijosNoLaboralesMensuales ?? inputs.costosFijosMensuales) * 12 + costoAnualNorm)],
    ]),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ====================== 10. TRIBUTACIÓN ======================
  sections.push(
    h('10. Tributación', HeadingLevel.HEADING_1),
    p(`Régimen aplicable: ${regimen.regimen}`),
    p(`Tasa impuesto primera categoría: ${fmtPct(regimen.tasa, 0)}`),
    p(`Base legal: ${regimen.base_legal}`),
    p(''),
    p(
      `El impuesto se calcula condicional: si la UAI (utilidad antes de impuesto) es positiva, se aplica la tasa; si es negativa, `
      + `el impuesto del período es cero y se acumula crédito fiscal a favor (descontable de impuestos futuros hasta agotarse). `
      + `En el flujo del inversionista, los intereses de la deuda se restan ANTES del impuesto (escudo tributario), mientras que `
      + `la amortización del capital se resta DESPUÉS del impuesto (no es gasto deducible).`
    ),
  );

  // ====================== 11. FINANCIAMIENTO ======================
  sections.push(
    p(''),
    h('11. Estructura de financiamiento', HeadingLevel.HEADING_1),
    tableFromRows([
      ['Variable', 'Valor'],
      ['% Financiamiento bancario', fmtPct(inputs.porcentajeDeuda, 0)],
      ['Monto del préstamo', fmtCLP(inputs.inversionInicial * inputs.porcentajeDeuda)],
      ['Tasa de interés banco (anual)', fmtPct(inputs.tasaBanco, 1)],
      ['Plazo (años)', `${inputs.plazoDeudaAnos}`],
      ['Sistema de amortización', 'Francés (cuota constante)'],
    ]),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ====================== 12. FLUJO DE CAJA PURO ======================
  sections.push(
    h('12. Flujo de caja puro (anual)', HeadingLevel.HEADING_1),
    flujoTable(fp.cashFlow, false),
    p(''),
    pMono(`VAN: ${fmtCLP(fp.van)} · TIR: ${Number.isFinite(fp.tir) ? fmtPct(fp.tir, 2) : '—'} · Payback: ${Number.isFinite(fp.payback) ? `${fp.payback.toFixed(2)} años` : '> horizonte'}`),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ====================== 13. FLUJO DEL INVERSIONISTA ======================
  sections.push(
    h('13. Flujo del inversionista (anual)', HeadingLevel.HEADING_1),
    flujoTable(fi.cashFlow, true),
    p(''),
    pMono(`VAN: ${fmtCLP(fi.van)} · TIR: ${Number.isFinite(fi.tir) ? fmtPct(fi.tir, 2) : '—'}`),
    p(''),
  );

  // ====================== 14. FLUJO MENSUAL — RESUMEN ======================
  if (monthly) {
    sections.push(
      h('14. Flujo mensual a 60 períodos — resumen anual', HeadingLevel.HEADING_1),
      p(
        `Se construyó el flujo a granularidad mensual (60 períodos) con tasa de descuento mensual equivalente `
        + `(${(monthly.tasaMensual * 100).toFixed(3)}% mensual ≈ ${fmtPct(inputs.tasaCostoCapital, 0)} anual). `
        + `Esto permite identificar estacionalidades, modelar la liquidez mes a mes y verificar `
        + `con mayor precisión cobertura de cuotas de deuda.`
      ),
      p(''),
      tableFromRows([
        ['Mes', 'Año', 'Ingresos', 'Costos totales', 'Flujo neto'],
        ...monthly.cashFlowMonthly.slice(0, 13).map((m) => [
          String(m.mes), String(m.ano),
          fmtCLP(m.ingresos),
          fmtCLP(m.costosVariables + m.costosFijosNoLaborales + m.costoPersonal + m.costosNormativos),
          fmtCLP(m.flujoCajaNeto),
        ]),
        ['(...)', '', '', '', ''],
      ]),
      p(''),
      pMono(`Total 60 meses (sin descontar): ${fmtCLP(monthly.cashFlowMonthly.reduce((s, m) => s + m.flujoCajaNeto, 0))}`),
      new Paragraph({ children: [new PageBreak()] }),
    );
  }

  // ====================== 15. INDICADORES ======================
  sections.push(
    h('15. Indicadores de evaluación', HeadingLevel.HEADING_1),
    tableFromRows([
      ['Indicador', 'Flujo puro', 'Flujo inversionista', 'Criterio'],
      ['VAN', fmtCLP(fp.van), fmtCLP(fi.van), '> 0 → aceptar'],
      ['TIR', Number.isFinite(fp.tir) ? fmtPct(fp.tir, 2) : '—', Number.isFinite(fi.tir) ? fmtPct(fi.tir, 2) : '—', `> Tcc=${fmtPct(inputs.tasaCostoCapital, 0)}`],
      ['Payback', Number.isFinite(fp.payback) ? `${fp.payback.toFixed(2)} años` : '> horizonte', Number.isFinite(fi.payback) ? `${fi.payback.toFixed(2)} años` : '> horizonte', '< horizonte'],
      ['Break-even', `${Math.round(model.breakeven)} combos/día`, '—', `< demanda base (${inputs.combosPorDiaBase})`],
    ]),
    p(''),
  );

  // ====================== 16. ANÁLISIS DE SENSIBILIDAD ======================
  sections.push(
    h('16. Análisis de sensibilidad', HeadingLevel.HEADING_1),
    p(
      `Se varían las 6 variables principales en ±10% y ±20% para identificar las más críticas. `
      + `La variable que mueve más el VAN identifica el punto al que el equipo de gestión debe prestar mayor atención.`
    ),
    p(''),
    tableFromRows([
      ['Variable', 'Δ', 'VAN puro resultante', 'Impacto en VAN'],
      ...sens.slice(0, 16).map((r) => [r.variable, fmtPct(r.delta, 0), fmtCLP(r.vanPuro), fmtCLP(r.impactoVanPuro)]),
    ]),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ====================== 17. ANÁLISIS DE RIESGOS ======================
  sections.push(
    h('17. Análisis de riesgos cualitativos', HeadingLevel.HEADING_1),
    p('Riesgos identificados y planes de mitigación:'),
    p(''),
    tableFromRows([
      ['Riesgo', 'Probabilidad', 'Impacto', 'Mitigación'],
      ['Caída de demanda por contracción económica', 'Media', 'Alto', 'Diversificar canales (delivery, oficinas), ajustar mix de productos.'],
      ['Aumento del precio del café importado', 'Media', 'Medio', 'Contratos de suministro a mediano plazo, alternativa proveedor local.'],
      ['Subida de arriendo al renovar contrato', 'Alta', 'Alto', 'Negociar contrato a 3-5 años con cláusula de reajuste por IPC.'],
      ['Apertura de competencia directa adyacente', 'Media', 'Alto', 'Construir comunidad/programa de fidelización desde el día 1.'],
      ['Cambios regulatorios sanitarios', 'Baja', 'Medio', 'Monitoreo SEREMI Salud, certificaciones al día.'],
      ['Aumento del salario mínimo / leyes laborales', 'Media', 'Medio', 'Revisión anual de productividad, ajustes incrementales.'],
      ['Tipo de cambio (insumos importados)', 'Media', 'Medio', 'Cobertura natural por mix de proveedores nacionales.'],
    ]),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ====================== 18. CONCLUSIONES Y RECOMENDACIÓN ======================
  sections.push(
    h('18. Conclusiones y recomendación final', HeadingLevel.HEADING_1),
    p(
      fp.van > 0 && fp.tir > inputs.tasaCostoCapital
        ? `Sobre la base del análisis financiero, normativo y de mercado, el proyecto "${projectName}" cumple los criterios de aceptación: `
          + `VAN positivo (${fmtCLP(fp.van)}) y TIR (${fmtPct(fp.tir, 1)}) superior al costo de capital exigido (${fmtPct(inputs.tasaCostoCapital, 0)}). `
          + `Se recomienda avanzar a la siguiente etapa: due diligence operacional, negociación de arriendo, postulación a permisos `
          + `municipales y sanitarios, y selección de proveedores. La estructura de financiamiento propuesta (${fmtPct(inputs.porcentajeDeuda, 0)} de deuda al `
          + `${fmtPct(inputs.tasaBanco, 1)} a ${inputs.plazoDeudaAnos} años) genera escudo tributario que mejora el VAN del inversionista vs. el flujo puro.`
        : `Bajo los supuestos del caso base, el proyecto destruye valor (VAN < 0). Se recomienda iterar sobre las variables más sensibles `
          + `identificadas en la Sección 16 antes de decidir avanzar. Alternativas a explorar: ajuste al alza del ticket promedio, búsqueda `
          + `de localización con menor arriendo, ampliación del horario operativo, o introducción de productos complementarios al combo único.`
    ),
    p(''),
    pSerif('Próximos pasos sugeridos:', 12, true),
    p('1. Validar arriendo del local con propietario y firmar reserva.'),
    p('2. Iniciar trámites SII y SEREMI Salud (plazo estimado 4-6 semanas).'),
    p('3. Concretar línea de crédito bancaria con preaprobación.'),
    p('4. Plan de marketing y comunidad pre-apertura (2 meses antes).'),
    p('5. Plan de capacitación de manipuladores y baristas.'),
    p('6. Cronograma de obra menor y compra de equipos.'),
    p(''),
  );

  // ====================== ANEXOS ======================
  sections.push(
    new Paragraph({ children: [new PageBreak()] }),
    h('Anexos', HeadingLevel.HEADING_1),
    h('A. Glosario', HeadingLevel.HEADING_2),
    p('• VAN: Valor Actual Neto. Suma descontada de los flujos de caja netos al costo de capital. Acepta si > 0.'),
    p('• TIR: Tasa Interna de Retorno. Tasa que hace VAN = 0. Acepta si > Tcc.'),
    p('• Payback: período en que la suma acumulada de flujos pasa de negativa a positiva.'),
    p('• Break-even: demanda mínima para que VAN = 0.'),
    p('• Tcc: tasa de costo de capital del proyecto. Para retail food en Chile: 14% (CAPM con β 1.3, ERP 6.5%).'),
    p('• UAI: Utilidad Antes de Impuesto.'),
    p('• UDI: Utilidad Después de Impuesto.'),
    p('• KT: Capital de Trabajo.'),
    p('• IMM: Ingreso Mínimo Mensual (vigente 2025: $510.636).'),
    p('• UF: Unidad de Fomento (referencial 2025: $39.500).'),
    p('• UTM: Unidad Tributaria Mensual (referencial 2025: $68.785).'),
    p(''),
    h('B. Fórmulas Excel utilizadas', HeadingLevel.HEADING_2),
    pMono('=VNA(tasa, flujo1:flujoN) + flujo0    → VAN'),
    pMono('=TIR(flujo0:flujoN)                   → TIR'),
    pMono('=SLN(costo, residual, vida_útil)      → Depreciación lineal'),
    pMono('=PAGOINT(tasa, k, n, principal)       → Interés cuota k'),
    pMono('=PAGOPRIN(tasa, k, n, principal)      → Capital cuota k'),
    pMono('=PAGO(tasa, n, principal)             → Cuota total constante'),
  );

  // ============== Build doc ==============
  const doc = new Document({
    creator: 'Agente de Evaluación de Proyectos · MBA UAH 2026',
    title: projectName,
    description: 'Informe técnico-financiero de evaluación de proyectos retail food en Chile',
    styles: {
      default: { document: { run: { font: 'Calibri', size: 22 } } },
    },
    sections: [{ properties: {}, children: sections }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slugify(projectName)}_informe.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

// =============== Helpers ===============
function p(text: string, italic = false): Paragraph {
  return new Paragraph({ children: [new TextRun({ text, italics: italic, size: 22 })] });
}
function pMono(text: string): Paragraph {
  return new Paragraph({ children: [new TextRun({ text, size: 20, font: 'Consolas' })] });
}
function pSerif(text: string, size = 22, bold = false): Paragraph {
  return new Paragraph({ children: [new TextRun({ text, bold, size: size * 2, font: 'Cambria' })] });
}
function h(text: string, level: typeof HeadingLevel[keyof typeof HeadingLevel], jumbo = false): Paragraph {
  return new Paragraph({
    heading: level,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: jumbo ? 48 : undefined, font: 'Cambria' })],
  });
}
function tableFromRows(rows: string[][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top:    { style: BorderStyle.SINGLE, size: 4, color: '999999' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '999999' },
      left:   { style: BorderStyle.SINGLE, size: 4, color: '999999' },
      right:  { style: BorderStyle.SINGLE, size: 4, color: '999999' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'cccccc' },
      insideVertical:   { style: BorderStyle.SINGLE, size: 2, color: 'cccccc' },
    },
    rows: rows.map((row, i) =>
      new TableRow({
        children: row.map((cell) =>
          new TableCell({
            shading: i === 0 ? { fill: 'F2EAE0', type: ShadingType.SOLID, color: 'auto' } : undefined,
            children: [new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [new TextRun({ text: cell, bold: i === 0, size: 18, font: 'Calibri' })],
            })],
          }),
        ),
      }),
    ),
  });
}
function flujoTable(cashFlow: any[], conFinanc: boolean): Table {
  const head = ['Concepto', ...cashFlow.map((y) => `Año ${y.ano}`)];
  const rows = [
    head,
    ['Ingresos', ...cashFlow.map((y) => fmtCLP(y.ingresos))],
    ['(-) Costos variables', ...cashFlow.map((y) => fmtCLP(-y.costosVariables))],
    ['(-) Costos fijos (planilla + arriendo + normativos)', ...cashFlow.map((y) => fmtCLP(-y.costosFijos))],
    ['(-) Depreciación', ...cashFlow.map((y) => fmtCLP(-y.depreciacion))],
    ...(conFinanc ? [['(-) Intereses deuda', ...cashFlow.map((y) => fmtCLP(-y.intereses))]] : []),
    ['UAI', ...cashFlow.map((y) => fmtCLP(y.utilidadAntesImpuesto))],
    ['(-) Impuesto', ...cashFlow.map((y) => fmtCLP(-y.impuesto))],
    ['Utilidad neta (UDI)', ...cashFlow.map((y) => fmtCLP(y.utilidadNeta))],
    ['(+) Reversión depreciación', ...cashFlow.map((y) => fmtCLP(y.depreciacion))],
    ['(-) Inversión', ...cashFlow.map((y) => fmtCLP(y.inversion))],
    ['(-) Capital de trabajo', ...cashFlow.map((y) => fmtCLP(y.capitalTrabajo))],
    ...(conFinanc ? [['(+) Préstamo', ...cashFlow.map((y) => fmtCLP(y.prestamoRecibido))]] : []),
    ...(conFinanc ? [['(-) Amortización capital', ...cashFlow.map((y) => fmtCLP(-y.amortizacionDeuda))]] : []),
    ['(+) Recupero CT', ...cashFlow.map((y) => fmtCLP(y.recuperoCT))],
    ['(+) Valor residual', ...cashFlow.map((y) => fmtCLP(y.valorResidual))],
    ['Flujo neto de caja', ...cashFlow.map((y) => fmtCLP(y.flujoCajaNeto))],
  ];
  return tableFromRows(rows);
}
function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60);
}
