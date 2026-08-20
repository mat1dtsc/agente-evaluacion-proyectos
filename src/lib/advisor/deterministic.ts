/**
 * Motor determinístico del Asesor.
 *
 * Genera una recomendación ejecutiva a partir de reglas de negocio sobre los
 * mismos datos que vería la IA. Es el fallback cuando no hay API key (o en
 * `vite dev`, donde la función serverless no corre) y garantiza que el asesor
 * SIEMPRE entrega algo defendible, reproducible y sin costo.
 */

import type { AdvisorContext, AdvisoryReport } from './types';
import { formatCLP, formatPct } from '@/lib/utils';

const LABEL_VAR: Record<string, string> = {
  precio: 'precio / ticket',
  demanda: 'demanda (unidades/día)',
  costoInsumo: 'costo de insumos',
  arriendo: 'arriendo',
  sueldo: 'sueldos',
  tasaBanco: 'tasa del banco',
  tasaDescuento: 'tasa de descuento (Tcc)',
};

const paybackTxt = (p: number) => (Number.isFinite(p) ? `${p.toFixed(1)} años` : '—');
const tirTxt = (t: number, tcc: number) => (Number.isFinite(t) ? formatPct(t, 0) : '—') + ` (Tcc ${formatPct(tcc, 0)})`;

export function deterministicAdvisory(ctx: AdvisorContext): AdvisoryReport {
  const f = ctx.finanzas;
  const tirOk = Number.isFinite(f.tirPuro) && f.tirPuro > f.tcc;
  const vanOk = f.vanPuro > 0;
  const paybackOk = Number.isFinite(f.paybackPuro) && f.paybackPuro <= 4;
  const scoreOk = (ctx.scoreGeo?.total ?? 60) >= 65;

  let veredicto: AdvisoryReport['veredicto'];
  if (vanOk && tirOk && paybackOk && scoreOk) veredicto = 'Recomendado';
  else if (!vanOk || !Number.isFinite(f.tirPuro) || f.tirPuro < f.tcc) veredicto = 'No conviene';
  else veredicto = 'Aceptable con riesgo';

  const fortalezas: string[] = [];
  const riesgos: string[] = [];

  if (vanOk) fortalezas.push(`VAN positivo de ${formatCLP(f.vanPuro, true)} (flujo puro): crea valor sobre el costo de capital.`);
  else riesgos.push(`VAN negativo (${formatCLP(f.vanPuro, true)}): el proyecto destruye valor a la tasa exigida.`);

  if (tirOk) fortalezas.push(`TIR ${tirTxt(f.tirPuro, f.tcc)}: spread favorable sobre la tasa exigida.`);
  else if (Number.isFinite(f.tirPuro)) riesgos.push(`TIR ${tirTxt(f.tirPuro, f.tcc)}: rentabilidad insuficiente frente a la Tcc.`);
  else riesgos.push('No existe TIR real positiva: los flujos no recuperan la inversión.');

  if (paybackOk) fortalezas.push(`Payback de ${paybackTxt(f.paybackPuro)}: recuperación dentro de un horizonte razonable.`);
  else if (Number.isFinite(f.paybackPuro)) riesgos.push(`Payback largo (${paybackTxt(f.paybackPuro)}): recuperación lenta de la inversión.`);
  else riesgos.push('La inversión no se recupera dentro del horizonte evaluado.');

  if (ctx.scoreGeo) {
    const g = ctx.scoreGeo;
    if (g.transporte >= 70) fortalezas.push('Fuerte acceso a transporte público (paraderos + Metro cercanos).');
    if (g.ingreso >= 70) fortalezas.push('Zona de ingreso alto, coherente con un ticket premium.');
    else if (g.ingreso <= 40) riesgos.push('Ingreso medio bajo en la zona: presiona el ticket y el mix de productos.');
    if (g.densidad >= 70) fortalezas.push('Alta densidad poblacional en el radio de captación.');
    if (g.competencia <= 40) riesgos.push('Alta saturación de competencia en el radio: difícil capturar demanda.');
    else if (g.competencia >= 80) fortalezas.push('Nivel de competencia sano: zona validada pero no saturada.');
  }

  if (ctx.competencia && ctx.competencia.totalCafes > 15) {
    riesgos.push(`${ctx.competencia.totalCafes} competidores directos en el radio: mercado muy disputado.`);
  }

  const drivers = [...ctx.sensibilidadTop]
    .sort((a, b) => Math.abs(b.impactoVan) - Math.abs(a.impactoVan))
    .slice(0, 3)
    .map((d) => `${LABEL_VAR[d.variable] ?? d.variable}: ${formatCLP(d.impactoVan, true)} de impacto en VAN.`);

  if (fortalezas.length === 0) fortalezas.push('Modelo financiero consistente y trazable a fuentes.');
  if (riesgos.length === 0) riesgos.push('Riesgo de ejecución típico del retail food (ramp-up, rotación de personal).');

  const resumen =
    veredicto === 'Recomendado'
      ? `${ctx.proyecto}: caso sólido en el escenario ${ctx.escenario}. VAN ${formatCLP(f.vanPuro, true)}, TIR ${tirTxt(f.tirPuro, f.tcc)}, payback ${paybackTxt(f.paybackPuro)}. Recomendado avanzar.`
      : veredicto === 'No conviene'
        ? `${ctx.proyecto}: el caso no se sostiene en el escenario ${ctx.escenario}. VAN ${formatCLP(f.vanPuro, true)} / TIR ${Number.isFinite(f.tirPuro) ? formatPct(f.tirPuro, 0) : '—'}. Reformular ubicación, ticket o estructura de costos antes de invertir.`
        : `${ctx.proyecto}: caso viable pero con holgura ajustada (escenario ${ctx.escenario}). VAN ${formatCLP(f.vanPuro, true)}, payback ${paybackTxt(f.paybackPuro)}. Conviene mitigar los riesgos antes de comprometer capital.`;

  const siguientePaso =
    veredicto === 'Recomendado'
      ? 'Validar arriendo real y demanda con un piloto o pre-venta; cerrar financiamiento al porcentaje de deuda evaluado.'
      : veredicto === 'No conviene'
        ? 'Probar otra zona del comparador o ajustar el formato (ticket/costos) y reevaluar; revisar la pestaña Sensibilidad.'
        : 'Atacar los 1-2 drivers de mayor impacto (arriba) y contrastar el escenario optimista vs conservador antes de decidir.';

  return { veredicto, resumen, fortalezas, riesgos, drivers, siguientePaso, fuente: 'reglas' };
}
