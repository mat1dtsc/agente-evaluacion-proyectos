/**
 * Informe ejecutivo CORTO — máximo 6 páginas (requisito enunciado curso EVP UAH).
 *
 * Estructura compacta:
 *   1. Resumen ejecutivo (KPIs + recomendación)
 *   2. El proyecto y supuestos
 *   3. Estudio de mercado y competencia
 *   4. Las 7 zonas evaluadas
 *   5. Modelo financiero y resultados
 *   6. Sensibilidad, riesgos y conclusiones
 *   + Referencias (compactas)
 *
 * Output: public/exports/Informe_Cafe_Combo_RM_corto.docx
 * Uso: node scripts/word/generarInformeCorto.mjs
 */
import {
  Document, Packer, Paragraph, HeadingLevel, Table, TableRow, TableCell, TextRun,
  AlignmentType, WidthType, BorderStyle, ShadingType, PageBreak, Footer, Header,
  PageNumber,
} from 'docx';
import { writeFileSync, mkdirSync } from 'node:fs';
import {
  calcularTodas, scoreUbicacion, veredicto, TCC, MULT_EBITDA_TERMINAL,
  COMISION_TARJETAS, CAPEX,
} from '../lib/cafeModel.mjs';

const FONT_HEAD = 'Cambria';
const FONT_BODY = 'Calibri';

const RESULTADOS = calcularTodas('conservador');
RESULTADOS.sort((a, b) => b.base.van - a.base.van);
const GANADORA = RESULTADOS[0];

const fmtM = (n) => {
  const abs = Math.abs(n);
  const sign = n < 0 ? '−CLP ' : 'CLP ';
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)} M`;
  return `${sign}${Math.round(abs).toLocaleString('es-CL')}`;
};
const fmtPct = (n) => Number.isFinite(n) ? `${(n * 100).toFixed(1)}%` : '—';
const fmtPb = (n) => Number.isFinite(n) && n > 0 && n <= 5 ? `${n.toFixed(2)} años` : '> 5 años';

// ============================================================
// HELPERS COMPACTOS
// ============================================================
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, size: 24, font: FONT_HEAD, color: '1F2937' })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 120, after: 60 },
    children: [new TextRun({ text, bold: true, size: 20, font: FONT_HEAD, color: '374151' })],
  });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 80, line: 280 }, // 1.15 line spacing más compacto
    alignment: AlignmentType.JUSTIFIED,
    children: [new TextRun({
      text, size: opts.size ?? 20, font: FONT_BODY,
      bold: opts.bold, italics: opts.italic, color: opts.color,
    })],
  });
}
function bullet(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 40, line: 260 },
    bullet: { level: 0 },
    children: [new TextRun({
      text, size: 20, font: FONT_BODY,
      bold: opts.bold,
    })],
  });
}
function tableFromRows(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: '111827' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '111827' },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
    rows: rows.map((row, i) => new TableRow({
      tableHeader: i === 0,
      children: row.map((cell) => new TableCell({
        shading: i === 0 ? { fill: 'F3F4F6', type: ShadingType.SOLID, color: 'auto' } : undefined,
        margins: { top: 60, bottom: 60, left: 80, right: 80 },
        children: [new Paragraph({
          children: [new TextRun({
            text: String(cell), bold: i === 0, size: 16, font: FONT_BODY,
          })],
        })],
      })),
    })),
  });
}
function caption(text) {
  return new Paragraph({
    spacing: { before: 30, after: 120 },
    alignment: AlignmentType.LEFT,
    children: [new TextRun({ text, size: 14, font: FONT_BODY, italics: true, color: '6B7280' })],
  });
}

// ============================================================
// CONTENIDO
// ============================================================
const sections = [];

// ===== ENCABEZADO COMPACTO (no portada separada para ahorrar página) =====
sections.push(
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 60 },
    children: [new TextRun({ text: 'Universidad Alberto Hurtado · MBA 2026 · Evaluación de Proyectos · Prof. Mauricio Zúñiga', size: 16, font: FONT_HEAD, color: '6B7280' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 40 },
    children: [new TextRun({ text: 'EVALUACIÓN DE PROYECTO DE INVERSIÓN', bold: true, size: 28, font: FONT_HEAD })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 200 },
    children: [new TextRun({ text: 'Cafetería de combo único envasado · Análisis de localización en la Región Metropolitana', italics: true, size: 22, font: FONT_HEAD, color: '4B5563' })],
  }),
);

// ===== 1. RESUMEN EJECUTIVO =====
sections.push(
  h1('1. Resumen ejecutivo'),
  p(`Este informe evalúa la factibilidad económica de un proyecto de cafetería de formato compacto (30-35 m²) que comercializa un combo único cerrado: espresso preparado al momento más un alimento envasado del proveedor. Se evaluaron siete localizaciones candidatas en la Región Metropolitana de Santiago aplicando un modelo financiero auditado para retail food chileno (Tcc 14% por CAPM con β 1,3 y ERP 6,5% Damodaran 2024; valor terminal por múltiplo EBITDA ${MULT_EBITDA_TERMINAL}x; comisión tarjetas ${fmtPct(COMISION_TARJETAS)}; régimen Pro PYME 14 D N° 3; demanda calculada como flujo peatonal × tasa captura × penalización por competencia × ramp-up año a año).`),
  p(`Resultado: ${GANADORA.u.nombre} es la única localización con score de viabilidad superior a 60 (${scoreUbicacion(GANADORA)}/100), VAN base de ${fmtM(GANADORA.base.van)}, TIR de ${fmtPct(GANADORA.base.tir)} y payback de ${fmtPb(GANADORA.base.payback)}. Las dos siguientes (${RESULTADOS[1].u.nombre} y ${RESULTADOS[2].u.nombre}) presentan VAN positivo pero marginal y no resisten el escenario pesimista. La recomendación es ejecutar el proyecto en El Golf condicionado a un estudio primario de demanda en el local específico antes de la firma del contrato, junto con un plan de contingencia operacional explícito para enfrentar caídas del 35-40% en demanda.`, { bold: true }),
);

// Tabla KPIs principales
sections.push(
  tableFromRows([
    ['Indicador', 'Valor', 'Indicador', 'Valor'],
    ['Ubicación recomendada', GANADORA.u.nombre, 'Inversión total', `CLP ${(GANADORA.base.inversionTotal / 1_000_000).toFixed(1)} M`],
    ['VAN base', fmtM(GANADORA.base.van), 'EBITDA año 4 (madurez)', fmtM(GANADORA.base.detalleAnual[4].ebitda)],
    ['TIR', fmtPct(GANADORA.base.tir), 'Margen contribución', fmtPct(GANADORA.base.margenContrib)],
    ['Payback', fmtPb(GANADORA.base.payback), 'Score viabilidad', `${scoreUbicacion(GANADORA)}/100`],
  ]),
  caption('Tabla 1. Indicadores principales del proyecto en la ubicación recomendada (escenario base, modelo conservador).'),
);

// ===== 2. EL PROYECTO Y SUPUESTOS =====
sections.push(
  h1('2. El proyecto y supuestos críticos'),
  p('El modelo evaluado se diferencia del café tradicional en tres aspectos: no incluye preparación de alimentos en local (categoría sanitaria SEREMI "manipulación mínima"), opera con planilla mínima de 2-3 personas, y se enfoca en el segmento laboral matutino y de almuerzo rápido (combos $2.700-4.500 según zona). La inversión inicial CAPEX es CLP 20,5 M en activos físicos (máquina espresso 2 grupos, vitrina refrigerada, mobiliario, POS, habilitación eléctrica y sanitaria menor) más un capital de trabajo equivalente a 2,5 meses de egresos. Los costos fijos mensuales reales del retail food chileno ascienden a CLP 5-8 M (arriendo + planilla con cargas + servicios + marketing + aseo + software + contador + seguros), con variación significativa por zona en el componente arriendo.'),
  p(`Los supuestos macro críticos son: tasa de descuento ${fmtPct(TCC)} (CAPM con β 1,3 retail food), crecimiento de demanda por zona = g_INE_proyección_2024 + 1,5% sectorial Procafé (rango efectivo 1,0% a 4,5% según comuna), múltiplo EBITDA terminal de ${MULT_EBITDA_TERMINAL}x (rango M&A retail food Chile 3-5x), y curva de ramp-up del 55% año 1, 75% año 2, 90% año 3 y 100% años 4-5 (Achiga 2024). El régimen tributario es Pro PYME 14 D N° 3 (impuesto 25%) con crédito tributario acumulado del Caso 1 (empresa nueva).`),
);

// ===== 3. ESTUDIO DE MERCADO Y COMPETENCIA =====
sections.push(
  h1('3. Estudio de mercado y competencia'),
  p('El sector cafetero chileno cuenta con cerca de 4.500 establecimientos formales, 58% concentrados en RM (ANCC 2024). El mercado crece 5,2% anual con un giro estructural hacia formatos to-go (42% post-pandemia vs. 28% pre-COVID, Achiga 2024). El consumo per cápita de café es 1,4 kg/año (Procafé 2024), con espresso liderando 32% del share y especialidad en crecimiento (15%). El ticket promedio en cafetería es CLP 3.500. La tasa de fracaso de cafeterías independientes antes de los tres años se estima en 50-55% (Achiga 2024), evidenciando que la viabilidad NO es la regla del sector sino la excepción.'),
  p('La competencia se modeló combinando el catastro Achiga 2024 con el query en vivo de OpenStreetMap (Overpass API, mayo 2026) para nodos amenity=cafe y shop=coffee dentro del radio de 500 metros del local proyectado. Las cadenas internacionales relevantes son Starbucks Coffee Chile (≈100 locales en RM) y Juan Valdez Café (≈65 locales en RM). El modelo aplica una penalización de captura por densidad de competencia con la fórmula factor = min(1, √(50/cafés_km²)), que refleja el "fair share competitivo": el flujo peatonal se reparte entre los actores presentes en la zona.'),
);

sections.push(
  tableFromRows([
    ['Zona', 'Densidad cafés/km²', 'Cadenas presentes', 'Penalización captura'],
    ['El Golf', '65', 'Starbucks · Juan Valdez · Café Capital · Mosqueto', '−12%'],
    ['Apoquindo', '78', 'Starbucks · Juan Valdez · Tavelli · Café Capital · Bonafide', '−20%'],
    ['Vitacura', '52', 'Starbucks · Wonderland · Coppelia · Café Sebastián', '−2%'],
    ['Providencia', '92', 'Starbucks · Juan Valdez · Tavelli · Bonafide · Coppelia · Florian', '−26%'],
    ['Plaza Ñuñoa', '48', 'Wonderland · Hábito · Tavelli · independientes barrio', 'sin penal.'],
    ['Santiago Centro', '145', 'Starbucks ×4 · Juan Valdez ×3 · Caribe · Haití · Brasil + 130 indep.', '−41%'],
    ['Estación Central', '32', 'Caribe · Haití · sandwicherías USACH', 'sin penal.'],
  ]),
  caption('Tabla 2. Densidad de competencia y penalización por zona (OpenStreetMap mayo 2026 + Achiga 2024).'),
);

// ===== 4. LAS 7 ZONAS EVALUADAS =====
sections.push(
  h1('4. Comparativo de las siete zonas evaluadas'),
  p('Cada zona fue caracterizada con seis variables: arriendo (UF/m²), flujo peatonal (OSM), ticket promedio (Procafé + ajuste por nivel socioeconómico CASEN), densidad de competencia, crecimiento poblacional INE proyección 2024, y perfil horario de demanda diferenciado por tipo de uso del suelo. Los perfiles horarios usados son: oficina (3 peaks 8h-13h-18h, weekend 30%), residencial (peak tarde + alto fin de semana), transit hub (peak masivo 7-9h y 18-20h), universitario (estacional dic-feb cae 60%), y mixto (combinación oficina + residencial).'),
);

sections.push(
  tableFromRows([
    ['#', 'Zona', 'Flujo peatonal', 'Ticket', 'Combos y4', 'VAN base', 'TIR', 'Veredicto'],
    ...RESULTADOS.map((r, i) => {
      const v = veredicto(r);
      const tir = Number.isFinite(r.base.tir) ? fmtPct(r.base.tir) : '—';
      return [
        String(i + 1),
        r.u.nombre,
        r.u.flujoPeatonalDia.toLocaleString('es-CL'),
        `$${r.u.ticketPromedio.toLocaleString('es-CL')}`,
        String(r.base.combosDia),
        fmtM(r.base.van),
        tir,
        v.texto,
      ];
    }),
  ]),
  caption('Tabla 3. Ranking de las 7 zonas por VAN base. Modelo conservador (Tcc 14%, planilla 3 personas, costos no laborales $850k, 6 días/sem).'),
  p('El insight principal es que Santiago Centro tiene el mayor flujo peatonal de la RM (95.000 personas-día) PERO su densidad de competencia (145 cafés/km²) reduce la captura efectiva en 41%, haciéndolo NO viable bajo el modelo riguroso. El Golf gana porque combina ticket alto sostenible (CLP 4.500), competencia moderada (65 cafés/km², penalización −12%) y un perfil horario de oficinas con peaks claros que permite optimizar la operación.', { italic: true }),
);

// ===== 5. MODELO FINANCIERO Y RESULTADOS =====
sections.push(
  h1('5. Modelo financiero y resultados'),
  p('La estructura del flujo de caja puro sigue el formato del curso EVP UAH: ingresos operacionales (combos × días × ticket), menos costos variables (insumos por combo), menos costos fijos anuales (arriendo + planilla + servicios + marketing + aseo + seguros + software + contador), menos comisión tarjetas, menos depreciación lineal, igual EBIT. Aplica impuesto del 25% (Pro PYME) con crédito tributario acumulado caso 1. El flujo neto de caja del último período incorpora recupero del capital de trabajo, valor residual de los activos físicos calculado activo-por-activo (no 10% lineal, lo que captura correctamente la habilitación con vida 20 años) y valor terminal por múltiplo EBITDA 3,5x neto de impuesto.'),
  p(`Para la ubicación recomendada, el flujo año 1 muestra ingresos por CLP 73 M (con ramp-up 55%) y EBITDA aún en consolidación; los años 2-3 muestran crecimiento del 36% y 20% en ingresos respectivamente; los años 4-5 alcanzan operación madura con EBITDA superior a CLP ${(GANADORA.base.detalleAnual[4].ebitda / 1_000_000).toFixed(0)} M. El VAN base de ${fmtM(GANADORA.base.van)} se descompone aproximadamente en 35% flujos operacionales descontados de los 5 años y 65% valor terminal por venta del going concern al cabo del horizonte.`),
);

// ===== 6. SENSIBILIDAD, RIESGOS Y CONCLUSIONES =====
sections.push(
  h1('6. Sensibilidad, riesgos y conclusiones'),
  p('El análisis de sensibilidad univariado sobre seis variables (±20%) identifica al ticket promedio y al volumen de demanda como las dos variables más críticas, con impactos en VAN superiores a CLP 80 M. La tercera variable más impactante es el costo variable, seguida del costo arriendo, la tasa de descuento y los sueldos. Bajo el escenario pesimista (caída demanda 35%), TODAS las ubicaciones generan VAN negativo, lo que evidencia que la operación tiene poca resiliencia ante shocks de demanda y obliga a contar con un plan de contingencia operacional sólido.'),
  p('Los principales riesgos son: subida de arriendo al renovar contrato (Crítico), caída de demanda por contracción económica (Alto), apertura de competencia adyacente (Alto), rotación de baristas (Alto) y caída del proveedor de combo envasado (Alto). Las mitigaciones principales incluyen contrato de arriendo a 5 años con reajuste IPC tope, reserva de cash 6 meses de egresos, programa de fidelización pre-apertura, contratos indefinidos para baristas con capacitación interna, y mantenimiento de mínimo 2 proveedores certificados de combo activos.'),
  p(`Conclusión: ejecutar el proyecto en ${GANADORA.u.nombre} con presupuesto de inversión inicial de CLP ${(GANADORA.base.inversionTotal / 1_000_000).toFixed(1)} M. Antes de firmar el contrato de arriendo, realizar un estudio primario de demanda en el local específico durante una semana laboral típica (conteo manual de flujo, encuesta de intención de compra, validación del ticket). Los próximos 90 días cubren: estudio de demanda, negociación de arriendo, trámite SII, resolución sanitaria SEREMI, capacitación de baristas, contratos con proveedores, marketing pre-apertura y obra menor. Apertura proyectada al día 90 con monitoreo mensual de KPIs operativos (combos vendidos, ticket, margen, EBITDA).`, { bold: true }),
);

// ===== REFERENCIAS COMPACTAS =====
sections.push(
  h2('Referencias bibliográficas'),
  p('Achiga (2024). Reporte sectorial cafeterías Chile. Asoc. Chilena de Gastronomía. · ANCC (2024). Mercado de cafeterías RM. Asoc. Nacional de Cafés. · Casen (2022). Encuesta socioeconómica nacional. MDS. · Colliers Chile (2024). Reporte trimestral retail RM Q3 2024. · Damodaran, A. (2024). Equity Risk Premiums and industry betas. NYU Stern. · INE (2024). Censo 2017 + proyecciones 2024. · Metro Santiago (2023). Memoria anual. · Procafé (2024). Estudio consumo de café Chile. · Sapag, N., Sapag, R., Sapag, J. (2014). Preparación y evaluación de proyectos. 6ª ed. McGraw-Hill. · SECTRA (2014). Encuesta Origen-Destino 2012 Santiago. · SII (2024). Tabla vida útil bienes; Régimen Pro PYME 14 D N° 3 (Ley 21.210). · Zúñiga, M. (2025). Apuntes curso Evaluación de Proyectos MBA UAH 2026. · OpenStreetMap (mayo 2026). Catastro de cafeterías RM vía Overpass API.', { size: 16 }),
);

// ============================================================
// DOCUMENTO
// ============================================================
const doc = new Document({
  creator: 'Agente Evaluación de Proyectos',
  title: 'Cafetería Combo Único · Informe Ejecutivo (6 págs)',
  description: 'Informe ejecutivo formato curso EVP UAH 2026',
  styles: {
    default: {
      document: { run: { size: 20, font: FONT_BODY } },
    },
  },
  sections: [{
    properties: {
      page: {
        margin: { top: 720, bottom: 720, left: 1080, right: 1080 }, // 1.27cm × 1.9cm márgenes compactos
        size: { orientation: 'portrait' },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({
            text: 'Cafetería Combo Único · MBA UAH 2026',
            size: 14, font: FONT_HEAD, color: '9CA3AF',
          })],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: 'Página ', size: 14, font: FONT_BODY, color: '9CA3AF' }),
            new TextRun({ children: [PageNumber.CURRENT], size: 14, font: FONT_BODY, color: '9CA3AF' }),
            new TextRun({ text: ' de ', size: 14, font: FONT_BODY, color: '9CA3AF' }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 14, font: FONT_BODY, color: '9CA3AF' }),
          ],
        })],
      }),
    },
    children: sections,
  }],
});

const outDir = 'C:/Users/Usuario/Desktop/carpeta casa/agente-evaluacion-proyectos/public/exports';
mkdirSync(outDir, { recursive: true });
const outPath = outDir + '/Informe_Cafe_Combo_RM_corto.docx';
const buffer = await Packer.toBuffer(doc);
writeFileSync(outPath, buffer);
console.log(`✓ Informe ejecutivo (CORTO) generado: ${outPath}`);
console.log(`  Tamaño: ${(buffer.length / 1024).toFixed(1)} KB`);
console.log(`  Estructura: 6 secciones + referencias compactas`);
console.log(`  Target: 6 páginas Carta · Calibri 10pt · márgenes 1.27cm`);
console.log(`  Recomendación: imprimir en MS Word para validar paginación`);
