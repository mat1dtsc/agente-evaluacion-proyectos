/**
 * Pitch Deck — Cafetería Combo Único · Región Metropolitana
 *
 * 14 slides estilo McKinsey para presentar el proyecto:
 *   1. Portada
 *   2. Resumen ejecutivo (1-page)
 *   3. El proyecto (qué vendemos)
 *   4. Mercado y oportunidad
 *   5. Competidores principales
 *   6. Marco normativo
 *   7. Las 7 zonas evaluadas
 *   8. Modelo de demanda (flujo × captura × competencia × ramp-up)
 *   9. Modelo financiero (estructura)
 *  10. Resultados — ranking ubicaciones
 *  11. Ubicación recomendada (El Golf)
 *  12. Sensibilidad y escenarios
 *  13. Riesgos
 *  14. Conclusiones y próximos pasos
 *
 * Output: public/exports/Pitch_Cafe_Combo_RM.pptx
 * Uso: node scripts/pptx/generarPitchDeck.mjs
 */
import pptxgen from 'pptxgenjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import {
  calcularTodas, scoreUbicacion, veredicto,
  TCC, MULT_EBITDA_TERMINAL, COMISION_TARJETAS,
} from '../lib/cafeModel.mjs';

// ==================== CONFIG VISUAL ====================
const COLORS = {
  primary: '0B3D5C',     // azul UAH oscuro
  accent: 'E55934',      // naranja UAH
  warm: 'F4A261',
  bgLight: 'F7F4ED',
  textDark: '1F2937',
  textMid: '4B5563',
  textLight: '9CA3AF',
  positive: '10B981',
  warning: 'F59E0B',
  negative: 'EF4444',
  cardBg: 'FFFFFF',
  divider: 'E5E7EB',
};
const FONT = 'Calibri';

const fmtM = (n) => {
  const abs = Math.abs(n);
  const sign = n < 0 ? '−$' : '$';
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(0)}M`;
  return `${sign}${(abs / 1_000).toFixed(0)}k`;
};
const fmtPct = (n) => Number.isFinite(n) ? `${(n * 100).toFixed(0)}%` : '—';

// ==================== DATA ====================
const RESULTADOS = calcularTodas('conservador');
RESULTADOS.sort((a, b) => b.base.van - a.base.van);
const GANADORA = RESULTADOS[0];

// ==================== PRES INIT ====================
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.33" × 7.5"
pres.author = 'MBA UAH 2026';
pres.title = 'Cafetería Combo Único · RM';
pres.company = 'Universidad Alberto Hurtado';

// ==================== HELPERS ====================
function addFooter(slide, num, total) {
  slide.addText(`MBA UAH 2026 · Evaluación de Proyectos · Prof. Mauricio Zúñiga`, {
    x: 0.4, y: 7.05, w: 8, h: 0.3,
    fontSize: 9, fontFace: FONT, color: COLORS.textLight,
  });
  slide.addText(`${num} / ${total}`, {
    x: 12.5, y: 7.05, w: 0.5, h: 0.3,
    fontSize: 9, fontFace: FONT, color: COLORS.textLight, align: 'right',
  });
}

function topBar(slide, label) {
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: 13.33, h: 0.4, fill: { color: COLORS.primary },
  });
  slide.addText(label, {
    x: 0.4, y: 0.05, w: 12, h: 0.3,
    fontSize: 11, fontFace: FONT, bold: true, color: 'FFFFFF',
  });
}

function title(slide, text, opts = {}) {
  slide.addText(text, {
    x: 0.4, y: 0.6, w: 12.5, h: 0.7,
    fontSize: opts.size ?? 28, fontFace: FONT, bold: true,
    color: COLORS.primary, ...opts,
  });
}

function subtitle(slide, text) {
  slide.addText(text, {
    x: 0.4, y: 1.25, w: 12.5, h: 0.4,
    fontSize: 14, fontFace: FONT, color: COLORS.textMid, italic: true,
  });
}

const TOTAL_SLIDES = 14;
let slideNum = 0;

// ==================== SLIDE 1: PORTADA ====================
{
  slideNum++;
  const s = pres.addSlide();
  s.background = { color: COLORS.primary };

  // Banda lateral naranja
  s.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: 0.5, h: 7.5, fill: { color: COLORS.accent },
  });

  // Logo UAH (ASCII fallback si no hay imagen disponible)
  s.addText('UAH', {
    x: 1.0, y: 0.6, w: 2, h: 0.7,
    fontSize: 28, fontFace: FONT, bold: true, color: 'FFFFFF',
  });
  s.addText('Universidad Alberto Hurtado', {
    x: 1.0, y: 1.15, w: 8, h: 0.4,
    fontSize: 14, fontFace: FONT, color: 'FFFFFF',
  });

  // Título principal
  s.addText('Cafetería Combo Único', {
    x: 1.0, y: 2.5, w: 11, h: 1.0,
    fontSize: 54, fontFace: FONT, bold: true, color: 'FFFFFF',
  });
  s.addText('Análisis de factibilidad y selección de localización', {
    x: 1.0, y: 3.6, w: 11, h: 0.6,
    fontSize: 22, fontFace: FONT, color: COLORS.warm, italic: true,
  });
  s.addText('Región Metropolitana de Santiago · 7 zonas evaluadas', {
    x: 1.0, y: 4.2, w: 11, h: 0.4,
    fontSize: 16, fontFace: FONT, color: 'FFFFFF',
  });

  // Pie
  s.addText('MBA UAH · Promoción 2026', {
    x: 1.0, y: 6.0, w: 8, h: 0.3,
    fontSize: 13, fontFace: FONT, color: COLORS.warm,
  });
  s.addText('Curso: Evaluación de Proyectos', {
    x: 1.0, y: 6.3, w: 8, h: 0.3,
    fontSize: 12, fontFace: FONT, color: 'FFFFFF',
  });
  s.addText('Profesor: Mauricio Zúñiga', {
    x: 1.0, y: 6.6, w: 8, h: 0.3,
    fontSize: 12, fontFace: FONT, color: 'FFFFFF',
  });
  s.addText(new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long' }),
    { x: 11, y: 6.6, w: 2, h: 0.3, fontSize: 11, fontFace: FONT, color: COLORS.textLight, align: 'right' });
}

// ==================== SLIDE 2: RESUMEN EJECUTIVO ====================
{
  slideNum++;
  const s = pres.addSlide();
  topBar(s, 'RESUMEN EJECUTIVO');
  title(s, 'El proyecto en una página');
  subtitle(s, 'Cafetería compacta de combo único en la RM. Modelo evaluado en 7 zonas con datos reales.');

  // 4 KPI cards
  const kpis = [
    { label: 'Ubicación recomendada', value: GANADORA.u.comuna, color: COLORS.primary },
    { label: 'VAN base', value: fmtM(GANADORA.base.van), color: COLORS.positive },
    { label: 'TIR', value: fmtPct(GANADORA.base.tir), color: COLORS.accent },
    { label: 'Payback', value: `${GANADORA.base.payback.toFixed(1)} años`, color: COLORS.warm },
  ];
  kpis.forEach((kpi, i) => {
    const x = 0.4 + i * 3.15;
    s.addShape(pres.ShapeType.rect, {
      x, y: 2.0, w: 3.0, h: 1.5, fill: { color: COLORS.cardBg }, line: { color: COLORS.divider, width: 1 },
    });
    s.addText(kpi.label, {
      x: x + 0.2, y: 2.15, w: 2.7, h: 0.3,
      fontSize: 10, fontFace: FONT, color: COLORS.textMid, bold: true,
    });
    s.addText(kpi.value, {
      x: x + 0.2, y: 2.55, w: 2.7, h: 0.7,
      fontSize: 32, fontFace: FONT, bold: true, color: kpi.color,
    });
  });

  // Texto narrativo
  s.addText([
    { text: 'Bajo el modelo financiero aplicado', options: { bold: true, color: COLORS.textDark } },
    { text: ' (costos fijos a precio de mercado del retail food chileno, comisión de tarjetas, valor terminal por múltiplo EBITDA, tasa de descuento de 14%, penalización por densidad de competencia, curva de ramp-up año a año), ' },
    { text: GANADORA.u.nombre, options: { bold: true, color: COLORS.accent } },
    { text: ` resulta la única ubicación claramente recomendable. Genera VAN base de ${fmtM(GANADORA.base.van)} con TIR de ${fmtPct(GANADORA.base.tir)}, con un payback de ${GANADORA.base.payback.toFixed(1)} años a partir de una inversión inicial de $${(GANADORA.base.inversionTotal / 1_000_000).toFixed(1)}M (CAPEX + capital de trabajo).` },
  ], {
    x: 0.4, y: 3.8, w: 12.5, h: 1.5,
    fontSize: 13, fontFace: FONT, color: COLORS.textMid,
  });

  s.addText([
    { text: 'Recomendación: ', options: { bold: true, color: COLORS.accent } },
    { text: 'ejecutar el proyecto en El Golf · Las Condes, sujeto a estudio primario de demanda en el local específico durante una semana laboral típica antes de la firma del contrato de arriendo. Implementar plan de contingencia operacional para escenario pesimista (caída demanda 35-40%).' },
  ], {
    x: 0.4, y: 5.4, w: 12.5, h: 1.0,
    fontSize: 14, fontFace: FONT, color: COLORS.textDark,
  });

  addFooter(s, slideNum, TOTAL_SLIDES);
}

// ==================== SLIDE 3: EL PROYECTO ====================
{
  slideNum++;
  const s = pres.addSlide();
  topBar(s, 'EL PROYECTO');
  title(s, '¿Qué proponemos?');

  s.addText('Cafetería compacta (30-35 m²) que vende UN combo único cerrado:', {
    x: 0.4, y: 1.5, w: 12.5, h: 0.5,
    fontSize: 18, fontFace: FONT, color: COLORS.textDark,
  });

  // 2 columnas: combo + ventajas
  // Columna A: combo
  s.addShape(pres.ShapeType.rect, {
    x: 0.4, y: 2.2, w: 5.8, h: 4.0, fill: { color: COLORS.bgLight }, line: { color: COLORS.divider, width: 1 },
  });
  s.addText('COMBO ÚNICO', {
    x: 0.6, y: 2.4, w: 5.4, h: 0.4,
    fontSize: 14, fontFace: FONT, bold: true, color: COLORS.accent,
  });
  s.addText([
    { text: '☕ Espresso preparado al momento\n', options: { bold: true, fontSize: 16 } },
    { text: 'Máquina semiautomática 2 grupos. Café de origen seleccionado. Personalización con leche / sin leche.\n\n' },
    { text: '🥐 Producto envasado individual\n', options: { bold: true, fontSize: 16 } },
    { text: 'Croissant, sándwich premium o snack del proveedor certificado SEREMI. SIN preparación de alimentos en local.\n\n' },
    { text: '💵 Ticket esperado: $3.500 - $4.500 según zona', options: { bold: true, color: COLORS.primary } },
  ], {
    x: 0.6, y: 2.8, w: 5.4, h: 3.3,
    fontSize: 13, fontFace: FONT, color: COLORS.textMid,
  });

  // Columna B: 3 ventajas estratégicas
  s.addText('Ventajas estratégicas vs. café tradicional', {
    x: 6.6, y: 2.2, w: 6.5, h: 0.4,
    fontSize: 14, fontFace: FONT, bold: true, color: COLORS.primary,
  });
  const ventajas = [
    { num: '1', title: 'Menor inversión', desc: '−30-35% vs café tradicional. Sin cocina industrial, lavavajillas HORECA ni mobiliario gourmet.' },
    { num: '2', title: 'Operación simple', desc: 'Planilla mínima 2-3 personas (baristas certificados). Menos rotación crítica, menos gestión.' },
    { num: '3', title: 'Menor exposición regulatoria', desc: 'Categoría sanitaria SEREMI "manipulación mínima" (no HACCP completo). Plazos y arancel menores.' },
  ];
  ventajas.forEach((v, i) => {
    const y = 2.7 + i * 1.2;
    s.addShape(pres.ShapeType.ellipse, {
      x: 6.7, y: y + 0.05, w: 0.5, h: 0.5, fill: { color: COLORS.accent },
    });
    s.addText(v.num, {
      x: 6.7, y: y + 0.05, w: 0.5, h: 0.5,
      fontSize: 18, fontFace: FONT, bold: true, color: 'FFFFFF', align: 'center',
    });
    s.addText(v.title, {
      x: 7.4, y: y + 0.0, w: 5.5, h: 0.4,
      fontSize: 14, fontFace: FONT, bold: true, color: COLORS.textDark,
    });
    s.addText(v.desc, {
      x: 7.4, y: y + 0.4, w: 5.7, h: 0.7,
      fontSize: 11, fontFace: FONT, color: COLORS.textMid,
    });
  });

  addFooter(s, slideNum, TOTAL_SLIDES);
}

// ==================== SLIDE 4: MERCADO Y OPORTUNIDAD ====================
{
  slideNum++;
  const s = pres.addSlide();
  topBar(s, 'MERCADO Y OPORTUNIDAD');
  title(s, 'El sector café crece en Chile pero el formato tradicional se satura');

  // 4 stats grandes
  const stats = [
    { value: '4.500+', label: 'cafeterías formales en Chile', source: 'ANCC 2024' },
    { value: '58%', label: 'concentradas en RM', source: 'ANCC 2024' },
    { value: '5,2%', label: 'crecimiento anual sector', source: 'Achiga 2024' },
    { value: '50%+', label: 'cierran antes de 3 años', source: 'Achiga 2024' },
  ];
  stats.forEach((st, i) => {
    const x = 0.4 + i * 3.15;
    s.addShape(pres.ShapeType.rect, {
      x, y: 1.7, w: 3.0, h: 1.8, fill: { color: COLORS.bgLight }, line: { type: 'none' },
    });
    s.addText(st.value, {
      x, y: 1.85, w: 3.0, h: 0.9,
      fontSize: 44, fontFace: FONT, bold: true, color: COLORS.accent, align: 'center',
    });
    s.addText(st.label, {
      x, y: 2.85, w: 3.0, h: 0.4,
      fontSize: 12, fontFace: FONT, color: COLORS.textDark, align: 'center',
    });
    s.addText(st.source, {
      x, y: 3.25, w: 3.0, h: 0.25,
      fontSize: 9, fontFace: FONT, italic: true, color: COLORS.textLight, align: 'center',
    });
  });

  // Tendencias relevantes
  s.addText('Tendencias relevantes para este formato:', {
    x: 0.4, y: 3.9, w: 12.5, h: 0.4,
    fontSize: 14, fontFace: FONT, bold: true, color: COLORS.primary,
  });
  s.addText([
    { text: '• Formato to-go: el 42% de las transacciones en cafés post-2022 son take-away (vs. 28% pre-COVID), favoreciendo formatos compactos sin servicio en mesa\n', options: {} },
    { text: '• Consumo de café en Chile creciendo a 4-6% anual, impulsado por espresso (32% del share) y café de especialidad (15%)\n', options: {} },
    { text: '• Ticket promedio cafetería en Chile: $3.500 (Procafé 2024)\n', options: {} },
    { text: '• Densidad de competencia en zonas premium RM: 60-145 cafés/km² ', options: { bold: true, color: COLORS.negative } },
    { text: '— factor crítico de localización', options: {} },
  ], {
    x: 0.4, y: 4.3, w: 12.5, h: 2.3,
    fontSize: 13, fontFace: FONT, color: COLORS.textMid,
  });

  addFooter(s, slideNum, TOTAL_SLIDES);
}

// ==================== SLIDE 5: COMPETIDORES ====================
{
  slideNum++;
  const s = pres.addSlide();
  topBar(s, 'COMPETIDORES');
  title(s, 'Competencia identificada por zona (OpenStreetMap + Achiga)');

  const tableRows = [
    [
      { text: 'Zona', options: { bold: true, fill: { color: COLORS.primary }, color: 'FFFFFF' } },
      { text: 'Densidad cafés/km²', options: { bold: true, fill: { color: COLORS.primary }, color: 'FFFFFF' } },
      { text: 'Cadenas presentes', options: { bold: true, fill: { color: COLORS.primary }, color: 'FFFFFF' } },
      { text: 'Penalización', options: { bold: true, fill: { color: COLORS.primary }, color: 'FFFFFF' } },
    ],
    ...RESULTADOS.slice(0, 7).map((r) => {
      const factor = Math.min(1, Math.sqrt(50 / Math.max(r.u.densidadCompetenciaKm2, 30)));
      const penal = factor < 1 ? `−${Math.round((1 - factor) * 100)}%` : 'sin penal.';
      const cadenas =
        r.u.id === 'el_golf' ? 'Starbucks · Juan Valdez · Café Capital' :
        r.u.id === 'apoquindo' ? 'Starbucks · Juan Valdez · Tavelli · Café Capital' :
        r.u.id === 'vitacura' ? 'Starbucks · Café Wonderland · Coppelia' :
        r.u.id === 'providencia' ? 'Starbucks · Juan Valdez · Tavelli · Bonafide · Coppelia' :
        r.u.id === 'nunoa_plaza' ? 'Wonderland · Hábito · Tavelli · independientes' :
        r.u.id === 'santiago_centro' ? 'Starbucks ×4 · Juan Valdez ×3 · Caribe · Haití · Brasil' :
        'Caribe · Haití · sandwicherías USACH';
      return [
        { text: r.u.nombre, options: { bold: true } },
        { text: String(r.u.densidadCompetenciaKm2), options: { align: 'center' } },
        { text: cadenas, options: { fontSize: 9 } },
        { text: penal, options: { bold: true, color: factor < 1 ? COLORS.negative : COLORS.textMid, align: 'center' } },
      ];
    }),
  ];
  s.addTable(tableRows, {
    x: 0.4, y: 1.7, w: 12.5,
    fontSize: 11, fontFace: FONT, color: COLORS.textDark,
    rowH: 0.45,
    colW: [3.5, 2.0, 5.5, 1.5],
    border: { type: 'solid', color: COLORS.divider, pt: 0.5 },
  });

  s.addText([
    { text: 'Modelo de penalización: ', options: { bold: true, color: COLORS.accent } },
    { text: 'factor = min(1, √(50 / densidad_km²)). Refleja "fair share competitivo": el flujo peatonal se reparte entre los cafés del radio. Una densidad de 145/km² (Santiago Centro) penaliza la captura efectiva en 41%. Una densidad ≤ 50 (Plaza Ñuñoa, Estación Central) no penaliza.' },
  ], {
    x: 0.4, y: 6.3, w: 12.5, h: 0.7,
    fontSize: 11, fontFace: FONT, italic: true, color: COLORS.textMid,
  });

  addFooter(s, slideNum, TOTAL_SLIDES);
}

// ==================== SLIDE 6: MARCO NORMATIVO ====================
{
  slideNum++;
  const s = pres.addSlide();
  topBar(s, 'MARCO NORMATIVO');
  title(s, 'Cumplimiento regulatorio chileno aplicable');

  const normativas = [
    { cat: 'Tributario', items: ['SII Pro PYME 14 D N° 3 (impuesto 25%)', 'IVA 19% (DL 825/74)', 'Código de actividad 561010'] },
    { cat: 'Sanitario', items: ['SEREMI Salud "manipulación mínima"', 'Curso manipulador alimentos OTEC (10h)', 'Resolución sanitaria local'] },
    { cat: 'Laboral', items: ['Código del Trabajo Art. 50 (gratificación 25%)', 'AFC 2,4% empleador (Ley 19.728)', 'SIS 1,85% (Ley 20.255)'] },
    { cat: 'Comercial', items: ['Patente comercial municipal', 'Permiso de obra menor (DOM)', 'Contrato arriendo notarial 3-5 años'] },
  ];

  normativas.forEach((n, i) => {
    const x = 0.4 + (i % 2) * 6.4;
    const y = 1.7 + Math.floor(i / 2) * 2.6;
    s.addShape(pres.ShapeType.rect, {
      x, y, w: 6.0, h: 2.3, fill: { color: COLORS.bgLight }, line: { color: COLORS.divider, width: 1 },
    });
    s.addText(n.cat, {
      x: x + 0.2, y: y + 0.15, w: 5.6, h: 0.4,
      fontSize: 16, fontFace: FONT, bold: true, color: COLORS.accent,
    });
    n.items.forEach((it, j) => {
      s.addText('• ' + it, {
        x: x + 0.2, y: y + 0.6 + j * 0.4, w: 5.6, h: 0.35,
        fontSize: 11, fontFace: FONT, color: COLORS.textMid,
      });
    });
  });

  addFooter(s, slideNum, TOTAL_SLIDES);
}

// ==================== SLIDE 7: 7 ZONAS EVALUADAS ====================
{
  slideNum++;
  const s = pres.addSlide();
  topBar(s, 'LOCALIZACIÓN');
  title(s, 'Las 7 zonas evaluadas en la Región Metropolitana');

  const zonasData = RESULTADOS.map((r) => ({
    nombre: r.u.nombre.split('·')[0].trim(),
    comuna: r.u.comuna,
    flujo: r.u.flujoPeatonalDia,
    ticket: r.u.ticketPromedio,
    arriendo: r.u.arriendoUFm2,
    perfil: r.u.tipoZona,
  }));

  const tableRows = [
    [
      { text: 'Zona', options: { bold: true, fill: { color: COLORS.primary }, color: 'FFFFFF' } },
      { text: 'Comuna', options: { bold: true, fill: { color: COLORS.primary }, color: 'FFFFFF' } },
      { text: 'Flujo peatonal/día', options: { bold: true, fill: { color: COLORS.primary }, color: 'FFFFFF' } },
      { text: 'Ticket', options: { bold: true, fill: { color: COLORS.primary }, color: 'FFFFFF' } },
      { text: 'Arriendo UF/m²', options: { bold: true, fill: { color: COLORS.primary }, color: 'FFFFFF' } },
      { text: 'Perfil horario', options: { bold: true, fill: { color: COLORS.primary }, color: 'FFFFFF' } },
    ],
    ...zonasData.map((z) => [
      { text: z.nombre, options: { bold: true } },
      { text: z.comuna },
      { text: z.flujo.toLocaleString('es-CL'), options: { align: 'right' } },
      { text: `$${z.ticket.toLocaleString('es-CL')}`, options: { align: 'right' } },
      { text: z.arriendo.toFixed(2), options: { align: 'right' } },
      { text: z.perfil, options: { italic: true, color: COLORS.accent } },
    ]),
  ];
  s.addTable(tableRows, {
    x: 0.4, y: 1.7, w: 12.5,
    fontSize: 11, fontFace: FONT, color: COLORS.textDark,
    rowH: 0.4,
    colW: [3.5, 2.0, 2.0, 1.5, 1.7, 1.8],
    border: { type: 'solid', color: COLORS.divider, pt: 0.5 },
  });

  s.addText([
    { text: 'Fuentes: ', options: { bold: true, color: COLORS.primary } },
    { text: 'Mercado Libre · Portalinmobiliario · Toctoc · Colliers Chile Q3 2025 (arriendos) · OpenStreetMap (densidad competencia) · Achiga 2024 (ticket promedio sectorial) · INE Censo 2017 + Proyección 2024 (perfilamiento poblacional).' },
  ], {
    x: 0.4, y: 5.7, w: 12.5, h: 0.8,
    fontSize: 11, fontFace: FONT, italic: true, color: COLORS.textMid,
  });

  addFooter(s, slideNum, TOTAL_SLIDES);
}

// ==================== SLIDE 8: MODELO DE DEMANDA ====================
{
  slideNum++;
  const s = pres.addSlide();
  topBar(s, 'MODELO DE DEMANDA');
  title(s, 'Combos día = Flujo × Captura × Competencia × Ramp-up');
  subtitle(s, 'Cuatro factores reales del retail food chileno, no atajos numéricos');

  // Diagrama de fórmula
  const factores = [
    { label: 'Flujo peatonal', desc: 'OSM + EOD SECTRA', valor: 'p/día', color: COLORS.primary },
    { label: 'Tasa captura', desc: 'Procafé 0.20-0.65%', valor: '× ~0.5%', color: COLORS.accent },
    { label: 'Competencia', desc: '√(50 / cafés/km²)', valor: '× 0.59-1.0', color: COLORS.negative },
    { label: 'Ramp-up año', desc: 'Achiga: 55% → 100%', valor: '× 0.55-1.0', color: COLORS.warning },
  ];
  factores.forEach((f, i) => {
    const x = 0.4 + i * 3.15;
    s.addShape(pres.ShapeType.rect, {
      x, y: 2.0, w: 3.0, h: 2.0, fill: { color: f.color }, line: { type: 'none' },
    });
    s.addText(f.label, {
      x: x + 0.1, y: 2.15, w: 2.8, h: 0.4,
      fontSize: 14, fontFace: FONT, bold: true, color: 'FFFFFF',
    });
    s.addText(f.desc, {
      x: x + 0.1, y: 2.6, w: 2.8, h: 0.6,
      fontSize: 11, fontFace: FONT, color: 'FFFFFF', italic: true,
    });
    s.addText(f.valor, {
      x: x + 0.1, y: 3.3, w: 2.8, h: 0.6,
      fontSize: 18, fontFace: FONT, bold: true, color: 'FFFFFF',
    });
    if (i < 3) {
      s.addText('×', {
        x: x + 2.95, y: 2.7, w: 0.3, h: 0.6,
        fontSize: 24, fontFace: FONT, bold: true, color: COLORS.textDark, align: 'center',
      });
    }
  });

  // Resultado final
  s.addText([
    { text: 'Ejemplo · El Golf: ', options: { bold: true, color: COLORS.primary } },
    { text: '28.000 peatones × 0,55% captura × 0,88 competencia × 0,55 ramp año 1 ≈ ', options: { color: COLORS.textMid } },
    { text: '75 combos día 1', options: { bold: true, color: COLORS.accent, fontSize: 18 } },
    { text: ' → escalando a 154 combos día 4-5 (madurez)', options: { color: COLORS.textMid } },
  ], {
    x: 0.4, y: 4.5, w: 12.5, h: 0.8,
    fontSize: 14, fontFace: FONT,
  });

  s.addText([
    { text: '5 perfiles horarios diferenciados: ', options: { bold: true, color: COLORS.primary } },
    { text: 'oficina (3 peaks 8h-13h-18h, weekend 30%) · residencial (peak tarde + alto sábado) · transit (peak 7-9 entrada masiva) · universitario (estacional, dic-feb cae 60%) · mixto (combinación)' },
  ], {
    x: 0.4, y: 5.5, w: 12.5, h: 1.0,
    fontSize: 12, fontFace: FONT, color: COLORS.textMid,
  });

  addFooter(s, slideNum, TOTAL_SLIDES);
}

// ==================== SLIDE 9: MODELO FINANCIERO ====================
{
  slideNum++;
  const s = pres.addSlide();
  topBar(s, 'MODELO FINANCIERO');
  title(s, 'Estructura del flujo de caja proyectado a 5 años');

  // 2 columnas: estructura + supuestos
  // Columna A: estructura del flujo
  s.addText('ESTRUCTURA DEL FLUJO PURO', {
    x: 0.4, y: 1.7, w: 6.2, h: 0.4,
    fontSize: 14, fontFace: FONT, bold: true, color: COLORS.primary,
  });
  const estructura = [
    '+  Ingresos (combos × ticket)',
    '−  Costos variables ($1.300-1.700/combo)',
    '−  Costos fijos (arriendo + planilla + servicios)',
    '−  Comisión tarjetas 2,8%',
    '=  EBITDA',
    '−  Depreciación SLN (vida útil ponderada 8 años)',
    '=  EBIT (UAI)',
    '−  Impuesto 25% (con crédito acumulado caso 1)',
    '=  Utilidad neta',
    '+  Reversión depreciación',
    '=  Flujo operacional',
    '+  Recupero KT + Valor residual + Valor terminal (último año)',
    '=  FLUJO NETO DE CAJA',
  ];
  estructura.forEach((line, i) => {
    s.addText(line, {
      x: 0.4, y: 2.15 + i * 0.32, w: 6.2, h: 0.3,
      fontSize: 11, fontFace: FONT,
      color: line.startsWith('=') ? COLORS.accent : COLORS.textMid,
      bold: line.startsWith('='),
      fontFace: line.startsWith('+') || line.startsWith('−') || line.startsWith('=') ? 'Consolas' : FONT,
    });
  });

  // Columna B: supuestos críticos
  s.addText('SUPUESTOS CRÍTICOS', {
    x: 7.0, y: 1.7, w: 5.9, h: 0.4,
    fontSize: 14, fontFace: FONT, bold: true, color: COLORS.primary,
  });
  const supuestos = [
    { k: 'Tcc (CAPM retail food)', v: `${fmtPct(TCC)}` },
    { k: 'β (sector retail food)', v: '1.30' },
    { k: 'Crecimiento demanda', v: 'Por zona INE + 1,5% sectorial' },
    { k: 'Múltiplo EBITDA terminal', v: `${MULT_EBITDA_TERMINAL}x` },
    { k: 'Comisión tarjetas', v: `${fmtPct(COMISION_TARJETAS)}` },
    { k: 'Días operación', v: '312/año (6 días/sem)' },
    { k: 'Horizonte evaluación', v: '5 años + valor terminal' },
    { k: 'CAPEX activos', v: '$20,5M' },
    { k: 'Capital trabajo', v: '2,5 meses egresos' },
    { k: 'Régimen tributario', v: 'Pro PYME 14 D N° 3' },
  ];
  supuestos.forEach((sup, i) => {
    const y = 2.2 + i * 0.4;
    s.addText(sup.k, {
      x: 7.0, y, w: 3.5, h: 0.3,
      fontSize: 11, fontFace: FONT, color: COLORS.textMid,
    });
    s.addText(sup.v, {
      x: 10.5, y, w: 2.4, h: 0.3,
      fontSize: 11, fontFace: FONT, bold: true, color: COLORS.textDark, align: 'right',
    });
  });

  addFooter(s, slideNum, TOTAL_SLIDES);
}

// ==================== SLIDE 10: RANKING DE UBICACIONES ====================
{
  slideNum++;
  const s = pres.addSlide();
  topBar(s, 'RESULTADOS — RANKING POR VAN');
  title(s, 'El Golf y Providencia son los únicos proyectos claramente recomendables');

  const tableRows = [
    [
      { text: '#', options: { bold: true, fill: { color: COLORS.primary }, color: 'FFFFFF' } },
      { text: 'Ubicación', options: { bold: true, fill: { color: COLORS.primary }, color: 'FFFFFF' } },
      { text: 'VAN', options: { bold: true, fill: { color: COLORS.primary }, color: 'FFFFFF' } },
      { text: 'TIR', options: { bold: true, fill: { color: COLORS.primary }, color: 'FFFFFF' } },
      { text: 'Payback', options: { bold: true, fill: { color: COLORS.primary }, color: 'FFFFFF' } },
      { text: 'Combos y4', options: { bold: true, fill: { color: COLORS.primary }, color: 'FFFFFF' } },
      { text: 'Veredicto', options: { bold: true, fill: { color: COLORS.primary }, color: 'FFFFFF' } },
    ],
    ...RESULTADOS.map((r, i) => {
      const v = veredicto(r);
      const color = v.tono === 'positivo' ? COLORS.positive : v.tono === 'neutral' ? COLORS.warning : COLORS.negative;
      const tir = Number.isFinite(r.base.tir) ? fmtPct(r.base.tir) : '—';
      const pb = Number.isFinite(r.base.payback) && r.base.payback > 0 && r.base.payback <= 5 ? `${r.base.payback.toFixed(1)}y` : '> 5y';
      return [
        { text: String(i + 1), options: { bold: true, align: 'center' } },
        { text: r.u.nombre, options: { bold: true } },
        { text: fmtM(r.base.van), options: { align: 'right', bold: true, color } },
        { text: tir, options: { align: 'right' } },
        { text: pb, options: { align: 'right' } },
        { text: String(r.base.combosDia), options: { align: 'right' } },
        { text: v.texto, options: { color, bold: true, fontSize: 10 } },
      ];
    }),
  ];
  s.addTable(tableRows, {
    x: 0.4, y: 1.7, w: 12.5,
    fontSize: 11, fontFace: FONT, color: COLORS.textDark,
    rowH: 0.4,
    colW: [0.6, 3.6, 1.6, 1.2, 1.2, 1.4, 2.9],
    border: { type: 'solid', color: COLORS.divider, pt: 0.5 },
  });

  s.addText([
    { text: 'Insight clave: ', options: { bold: true, color: COLORS.accent } },
    { text: 'Santiago Centro tiene el mayor flujo peatonal de la RM (95k pax/día) PERO su densidad de competencia (145 cafés/km²) reduce la captura efectiva en 41% — pasando de "ganador esperado" a "no conviene". El Golf gana porque combina ticket alto ($4.500) con baja competencia (65 cafés/km²) y perfil oficina con peaks claros.' },
  ], {
    x: 0.4, y: 6.0, w: 12.5, h: 0.9,
    fontSize: 12, fontFace: FONT, italic: true, color: COLORS.textMid,
  });

  addFooter(s, slideNum, TOTAL_SLIDES);
}

// ==================== SLIDE 11: GANADORA EL GOLF ====================
{
  slideNum++;
  const s = pres.addSlide();
  topBar(s, 'UBICACIÓN RECOMENDADA');
  title(s, GANADORA.u.nombre);
  subtitle(s, GANADORA.u.direccion_referencia + ' · Comuna ' + GANADORA.u.comuna);

  // 6 KPI cards
  const kpis = [
    { label: 'VAN base', value: fmtM(GANADORA.base.van), color: COLORS.positive },
    { label: 'TIR', value: fmtPct(GANADORA.base.tir), color: COLORS.accent },
    { label: 'Payback', value: `${GANADORA.base.payback.toFixed(1)}y`, color: COLORS.warm },
    { label: 'EBITDA año 4', value: fmtM(GANADORA.base.detalleAnual[4].ebitda), color: COLORS.primary },
    { label: 'Inversión total', value: `$${(GANADORA.base.inversionTotal / 1_000_000).toFixed(1)}M`, color: COLORS.textDark },
    { label: 'Score viabilidad', value: `${scoreUbicacion(GANADORA)}/100`, color: COLORS.accent },
  ];
  kpis.forEach((kpi, i) => {
    const x = 0.4 + (i % 3) * 4.2;
    const y = 1.85 + Math.floor(i / 3) * 1.4;
    s.addShape(pres.ShapeType.rect, {
      x, y, w: 4.0, h: 1.2, fill: { color: COLORS.cardBg }, line: { color: COLORS.divider, width: 1 },
    });
    s.addText(kpi.label, {
      x: x + 0.2, y: y + 0.1, w: 3.8, h: 0.3,
      fontSize: 11, fontFace: FONT, color: COLORS.textMid, bold: true,
    });
    s.addText(kpi.value, {
      x: x + 0.2, y: y + 0.4, w: 3.8, h: 0.7,
      fontSize: 28, fontFace: FONT, bold: true, color: kpi.color,
    });
  });

  // Justificación
  s.addText('¿Por qué El Golf?', {
    x: 0.4, y: 4.7, w: 12.5, h: 0.4,
    fontSize: 14, fontFace: FONT, bold: true, color: COLORS.primary,
  });
  s.addText([
    { text: '• Ticket alto sostenible: ', options: { bold: true, color: COLORS.accent } },
    { text: '$4.500 (oficinas torre AAA, ejecutivos)\n' },
    { text: '• Volumen estable: ', options: { bold: true, color: COLORS.accent } },
    { text: '154 combos/día en madurez (28k peatones × 0,55% captura, capeado)\n' },
    { text: '• Competencia moderada: ', options: { bold: true, color: COLORS.accent } },
    { text: '65 cafés/km² (penalización solo −12%, manejable)\n' },
    { text: '• Resiliencia financiera: ', options: { bold: true, color: COLORS.accent } },
    { text: 'EBITDA año 4 supera $50M, cobertura amplia de costos fijos\n' },
    { text: '• Riesgo principal: ', options: { bold: true, color: COLORS.negative } },
    { text: 'dependencia del horario laboral L-V; weekend cae 60-100%' },
  ], {
    x: 0.4, y: 5.1, w: 12.5, h: 1.7,
    fontSize: 12, fontFace: FONT, color: COLORS.textMid,
  });

  addFooter(s, slideNum, TOTAL_SLIDES);
}

// ==================== SLIDE 12: SENSIBILIDAD Y ESCENARIOS ====================
{
  slideNum++;
  const s = pres.addSlide();
  topBar(s, 'SENSIBILIDAD Y ESCENARIOS');
  title(s, 'El VAN es altamente sensible a 4 supuestos clave');

  // Tabla escenarios
  const escenarios = [
    { nombre: 'Conservador', tcc: '14%', planilla: '3 personas', cf: '$850k', g: '2,5%', dias: '6 d/sem', impacto: 'baseline' },
    { nombre: 'Intermedio',  tcc: '14%', planilla: '2 personas', cf: '$560k', g: '2,5%', dias: '6 d/sem', impacto: '+~$60M' },
    { nombre: 'Optimista',   tcc: '12%', planilla: '2 personas', cf: '$560k', g: '3,0%', dias: '7 d/sem', impacto: '+~$90M' },
  ];
  const tableRows = [
    [
      { text: 'Escenario', options: { bold: true, fill: { color: COLORS.primary }, color: 'FFFFFF' } },
      { text: 'Tcc', options: { bold: true, fill: { color: COLORS.primary }, color: 'FFFFFF' } },
      { text: 'Planilla', options: { bold: true, fill: { color: COLORS.primary }, color: 'FFFFFF' } },
      { text: 'C.fijos no lab', options: { bold: true, fill: { color: COLORS.primary }, color: 'FFFFFF' } },
      { text: 'g demanda', options: { bold: true, fill: { color: COLORS.primary }, color: 'FFFFFF' } },
      { text: 'Días/sem', options: { bold: true, fill: { color: COLORS.primary }, color: 'FFFFFF' } },
      { text: 'Δ VAN El Golf', options: { bold: true, fill: { color: COLORS.primary }, color: 'FFFFFF' } },
    ],
    ...escenarios.map((e) => [
      { text: e.nombre, options: { bold: true } },
      { text: e.tcc, options: { align: 'center' } },
      { text: e.planilla, options: { align: 'center' } },
      { text: e.cf, options: { align: 'center' } },
      { text: e.g, options: { align: 'center' } },
      { text: e.dias, options: { align: 'center' } },
      { text: e.impacto, options: { align: 'center', bold: true, color: COLORS.accent } },
    ]),
  ];
  s.addTable(tableRows, {
    x: 0.4, y: 2.0, w: 12.5,
    fontSize: 11, fontFace: FONT, color: COLORS.textDark,
    rowH: 0.4,
    colW: [2.0, 1.0, 1.8, 2.0, 1.5, 1.5, 2.7],
    border: { type: 'solid', color: COLORS.divider, pt: 0.5 },
  });

  s.addText('Variables de sensibilidad univariada (±20% sobre VAN base):', {
    x: 0.4, y: 4.0, w: 12.5, h: 0.4,
    fontSize: 13, fontFace: FONT, bold: true, color: COLORS.primary,
  });
  const vars = [
    { v: '1. Demanda (combos/día)', impacto: 'Alta' },
    { v: '2. Ticket promedio', impacto: 'Alta' },
    { v: '3. Costo variable insumos', impacto: 'Media' },
    { v: '4. Tasa de descuento', impacto: 'Media' },
    { v: '5. Arriendo', impacto: 'Media' },
    { v: '6. Sueldos planilla', impacto: 'Baja' },
  ];
  vars.forEach((vr, i) => {
    const x = 0.4 + (i % 3) * 4.2;
    const y = 4.5 + Math.floor(i / 3) * 0.6;
    s.addText(vr.v, {
      x, y, w: 3.5, h: 0.4,
      fontSize: 11, fontFace: FONT, color: COLORS.textMid,
    });
    s.addText(vr.impacto, {
      x: x + 3.5, y, w: 0.7, h: 0.4,
      fontSize: 11, fontFace: FONT, bold: true,
      color: vr.impacto === 'Alta' ? COLORS.negative : vr.impacto === 'Media' ? COLORS.warning : COLORS.positive,
    });
  });

  addFooter(s, slideNum, TOTAL_SLIDES);
}

// ==================== SLIDE 13: RIESGOS ====================
{
  slideNum++;
  const s = pres.addSlide();
  topBar(s, 'GESTIÓN DE RIESGOS');
  title(s, 'Matriz cualitativa de los 12 riesgos identificados');

  const riesgos = [
    { num: '1', cat: 'Inmobiliario', riesgo: 'Subida de arriendo al renovar contrato', sev: 'Crítico', mit: 'Cláusula reajuste IPC tope 6%' },
    { num: '2', cat: 'Mercado',      riesgo: 'Caída demanda por contracción económica', sev: 'Alto', mit: 'Reserva cash 6 meses egresos' },
    { num: '3', cat: 'Competencia',  riesgo: 'Apertura cadena en radio < 500m', sev: 'Alto', mit: 'Programa fidelización pre-apertura' },
    { num: '4', cat: 'Talento',      riesgo: 'Rotación alta de baristas', sev: 'Alto', mit: 'Contratos indefinidos + capacitación' },
    { num: '5', cat: 'Sanitario',    riesgo: 'Pandemia que reduce flujo peatonal', sev: 'Alto', mit: 'Capacidad delivery rápido + canal B2B' },
    { num: '6', cat: 'Suministro',   riesgo: 'Caída del proveedor combo envasado', sev: 'Alto', mit: 'Min. 2 proveedores activos cert.' },
  ];

  const tableRows = [
    [
      { text: '#', options: { bold: true, fill: { color: COLORS.primary }, color: 'FFFFFF' } },
      { text: 'Categoría', options: { bold: true, fill: { color: COLORS.primary }, color: 'FFFFFF' } },
      { text: 'Riesgo', options: { bold: true, fill: { color: COLORS.primary }, color: 'FFFFFF' } },
      { text: 'Severidad', options: { bold: true, fill: { color: COLORS.primary }, color: 'FFFFFF' } },
      { text: 'Mitigación principal', options: { bold: true, fill: { color: COLORS.primary }, color: 'FFFFFF' } },
    ],
    ...riesgos.map((r) => [
      { text: r.num, options: { bold: true, align: 'center' } },
      { text: r.cat },
      { text: r.riesgo, options: { fontSize: 10 } },
      { text: r.sev, options: { bold: true, color: r.sev === 'Crítico' ? COLORS.negative : COLORS.warning, align: 'center' } },
      { text: r.mit, options: { fontSize: 10 } },
    ]),
  ];
  s.addTable(tableRows, {
    x: 0.4, y: 1.7, w: 12.5,
    fontSize: 11, fontFace: FONT, color: COLORS.textDark,
    rowH: 0.55,
    colW: [0.5, 1.8, 4.0, 1.4, 4.8],
    border: { type: 'solid', color: COLORS.divider, pt: 0.5 },
  });

  s.addText('Riesgos adicionales documentados en informe Word: tipo de cambio insumos importados · cambios regulatorios sanitarios · falla de máquina espresso · robo/vandalismo · aumento salario mínimo · comisión tarjetas (regulatorio).', {
    x: 0.4, y: 6.2, w: 12.5, h: 0.7,
    fontSize: 10, fontFace: FONT, italic: true, color: COLORS.textLight,
  });

  addFooter(s, slideNum, TOTAL_SLIDES);
}

// ==================== SLIDE 14: CONCLUSIONES ====================
{
  slideNum++;
  const s = pres.addSlide();
  topBar(s, 'CONCLUSIONES Y PRÓXIMOS PASOS');
  title(s, 'Recomendación: ejecutar en El Golf bajo monitoreo activo');

  // 2 columnas: conclusiones + plan acción
  s.addText('CONCLUSIONES PRINCIPALES', {
    x: 0.4, y: 1.7, w: 6.2, h: 0.4,
    fontSize: 14, fontFace: FONT, bold: true, color: COLORS.primary,
  });
  s.addText([
    { text: '✓  El Golf ', options: { bold: true, color: COLORS.positive } },
    { text: `presenta VAN ${fmtM(GANADORA.base.van)} con TIR ${fmtPct(GANADORA.base.tir)} (única zona con score ≥ 65 y resiliencia probada).\n\n` },
    { text: '✓  Modelo robusto ', options: { bold: true, color: COLORS.positive } },
    { text: 'con costos fijos a precio de mercado ($850k/mes), comisión tarjetas, valor terminal por múltiplo EBITDA, penalización por competencia y ramp-up año a año.\n\n' },
    { text: '⚠  Escenario pesimista ', options: { bold: true, color: COLORS.warning } },
    { text: 'destruye valor en TODAS las ubicaciones — el plan de contingencia es obligatorio.\n\n' },
    { text: '✗  Santiago Centro NO conviene ', options: { bold: true, color: COLORS.negative } },
    { text: 'pese al mayor flujo peatonal: la hipercompetencia (145 cafés/km²) hace inviable la captación de mercado.' },
  ], {
    x: 0.4, y: 2.15, w: 6.2, h: 4.5,
    fontSize: 12, fontFace: FONT, color: COLORS.textMid,
  });

  s.addText('PLAN DE ACCIÓN — PRÓXIMOS 90 DÍAS', {
    x: 7.0, y: 1.7, w: 5.9, h: 0.4,
    fontSize: 14, fontFace: FONT, bold: true, color: COLORS.primary,
  });
  const pasos = [
    { d: 'Día 1-15', t: 'Estudio primario demanda en local específico (1 semana)' },
    { d: 'Día 15-30', t: 'Negociación arriendo + reserva con cláusula de gracia' },
    { d: 'Día 30-45', t: 'SII inicio actividades + SEREMI sanitaria' },
    { d: 'Día 45-60', t: 'Línea crédito PYME + obra menor' },
    { d: 'Día 60-75', t: 'Capacitación baristas + contratos proveedores combo' },
    { d: 'Día 75-90', t: 'Marketing pre-apertura (Instagram + Google Maps)' },
    { d: 'Día 90+', t: 'APERTURA · monitoreo mensual KPIs' },
  ];
  pasos.forEach((p, i) => {
    const y = 2.2 + i * 0.55;
    s.addShape(pres.ShapeType.ellipse, {
      x: 7.0, y: y + 0.05, w: 0.4, h: 0.4, fill: { color: COLORS.accent },
    });
    s.addText(String(i + 1), {
      x: 7.0, y: y + 0.05, w: 0.4, h: 0.4,
      fontSize: 14, fontFace: FONT, bold: true, color: 'FFFFFF', align: 'center',
    });
    s.addText(p.d, {
      x: 7.5, y: y, w: 1.6, h: 0.5,
      fontSize: 10, fontFace: FONT, bold: true, color: COLORS.primary,
    });
    s.addText(p.t, {
      x: 9.1, y: y, w: 4.0, h: 0.5,
      fontSize: 10, fontFace: FONT, color: COLORS.textMid,
    });
  });

  addFooter(s, slideNum, TOTAL_SLIDES);
}

// ==================== GUARDAR ====================
const outDir = 'C:/Users/Usuario/Desktop/carpeta casa/agente-evaluacion-proyectos/public/exports';
mkdirSync(outDir, { recursive: true });
const outPath = outDir + '/Pitch_Cafe_Combo_RM.pptx';
await pres.writeFile({ fileName: outPath });
console.log(`✓ Pitch deck generado: ${outPath}`);
console.log(`  Slides: ${TOTAL_SLIDES}`);
console.log(`  Estructura: portada + 13 slides ejecutivos`);
