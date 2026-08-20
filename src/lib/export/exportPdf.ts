/**
 * Exportador PDF — resumen ejecutivo del proyecto.
 *
 * Genera un PDF compacto (portada + KPIs + flujos puro/inversionista +
 * Monte Carlo + sensibilidad) a partir del MISMO `model` que consumen los
 * exportadores Word/Excel, para mantener coherencia entre entregables.
 *
 * `buildInformePdf` devuelve el documento (testeable sin descargar);
 * `descargarInformePdf` lo construye y dispara la descarga en el navegador.
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CashFlowYear } from '@/lib/finance/types';
import { monteCarlo } from '@/lib/finance/monteCarlo';

import type { ExportArgs as Args } from './types';

const fmtCLP = (v: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Math.round(v));
const fmtPct = (v: number, d = 1) => (Number.isFinite(v) ? `${(v * 100).toFixed(d)}%` : '—');
const fmtM = (v: number) => (v === 0 ? '—' : `${(v / 1_000_000).toFixed(1)}M`);
const ORANGE: [number, number, number] = [249, 115, 22];

function flujoBody(cf: CashFlowYear[], conFinanciamiento: boolean): string[][] {
  const row = (label: string, sel: (y: CashFlowYear) => number) => [label, ...cf.map((y) => fmtM(sel(y)))];
  const rows = [
    row('Ingresos', (y) => y.ingresos),
    row('(-) Costos variables', (y) => -y.costosVariables),
    row('(-) Costos fijos', (y) => -y.costosFijos),
    row('(-) Depreciación', (y) => -y.depreciacion),
  ];
  if (conFinanciamiento) rows.push(row('(-) Intereses', (y) => -y.intereses));
  rows.push(
    row('UAI', (y) => y.utilidadAntesImpuesto),
    row('(-) Impuesto', (y) => -y.impuesto),
    row('Utilidad neta', (y) => y.utilidadNeta),
    row('Flujo neto de caja', (y) => y.flujoCajaNeto),
  );
  return rows;
}

export function buildInformePdf({ inputs, model, projectName, location }: Args): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const fp = model.flujoPuro;
  const fi = model.flujoInversionista;
  const mc = monteCarlo(inputs, { iterations: 2000, seed: 42 });

  let y = 54;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(projectName, 40, y);
  y += 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Informe de Evaluación de Proyectos · Resumen ejecutivo', 40, y);
  y += 15;
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    `Generado: ${new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}  ·  MBA UAH 2026 — Evaluación de Proyectos`,
    40,
    y,
  );
  y += 12;
  doc.text(
    location
      ? `Ubicación: ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}${location.label ? ` — ${location.label}` : ''}`
      : 'Sin ubicación geográfica fijada.',
    40,
    y,
  );
  doc.setTextColor(0);
  y += 22;

  autoTable(doc, {
    startY: y,
    head: [['Indicador', 'Flujo puro', 'Flujo inversionista']],
    body: [
      ['VAN', fmtCLP(fp.van), fmtCLP(fi.van)],
      ['TIR', fmtPct(fp.tir), fmtPct(fi.tir)],
      ['Payback', Number.isFinite(fp.payback) ? `${fp.payback.toFixed(2)} años` : '—', Number.isFinite(fi.payback) ? `${fi.payback.toFixed(2)} años` : '—'],
      ['Break-even', `${Math.round(model.breakeven)} u/día`, `Tcc ${fmtPct(inputs.tasaCostoCapital, 0)}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: ORANGE },
    styles: { fontSize: 9 },
    margin: { left: 40, right: 40 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16;

  const flowHead = [['Concepto', ...fp.cashFlow.map((c) => `Año ${c.ano}`)]];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Flujo de caja puro', 40, y);
  y += 6;
  autoTable(doc, {
    startY: y,
    head: flowHead,
    body: flujoBody(fp.cashFlow, false),
    theme: 'striped',
    headStyles: { fillColor: ORANGE },
    styles: { fontSize: 8, halign: 'right' },
    columnStyles: { 0: { halign: 'left' } },
    margin: { left: 40, right: 40 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Flujo del inversionista', 40, y);
  y += 6;
  autoTable(doc, {
    startY: y,
    head: [['Concepto', ...fi.cashFlow.map((c) => `Año ${c.ano}`)]],
    body: flujoBody(fi.cashFlow, true),
    theme: 'striped',
    headStyles: { fillColor: ORANGE },
    styles: { fontSize: 8, halign: 'right' },
    columnStyles: { 0: { halign: 'left' } },
    margin: { left: 40, right: 40 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16;

  autoTable(doc, {
    startY: y,
    head: [['Simulación Monte Carlo (2.000 iteraciones)', 'Valor']],
    body: [
      ['Probabilidad de VAN > 0', `${Math.round(mc.probVanPositivo * 100)}%`],
      ['VAN mediana (P50)', fmtCLP(mc.vanP50)],
      ['VAN pesimista (P5)', fmtCLP(mc.vanP5)],
      ['VAN optimista (P95)', fmtCLP(mc.vanP95)],
    ],
    theme: 'grid',
    headStyles: { fillColor: ORANGE },
    styles: { fontSize: 9 },
    margin: { left: 40, right: 40 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16;

  if (model.sensitivity.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Sensibilidad — variable', 'Impacto en VAN']],
      body: model.sensitivity.map((s) => [s.variable, fmtCLP(s.impactoVanPuro)]),
      theme: 'grid',
      headStyles: { fillColor: ORANGE },
      styles: { fontSize: 9 },
      margin: { left: 40, right: 40 },
    });
  }

  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(140);
  doc.text(
    'Datos: INE Censo 2017 + Proyección 2024 · CASEN 2022 · Metro Memoria 2023 · SECTRA EOD · Procafé · OpenStreetMap · BCN',
    40,
    pageH - 28,
  );

  return doc;
}

export function descargarInformePdf(args: Args): void {
  const doc = buildInformePdf(args);
  const slug = args.projectName.replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '') || 'Informe';
  doc.save(`Informe_${slug}.pdf`);
}
