import { describe, it, expect } from 'vitest';
import { buildInformePdf } from '../exportPdf';
import { defaultInputs } from '@/store/projectStore';
import type { FinancialModelOutput } from '@/hooks/useFinancialModel';
import type { CashFlowYear, FinancialResult } from '@/lib/finance/types';

const cfy = (ano: number, flujo: number): CashFlowYear => ({
  ano,
  ingresos: 1000,
  costosVariables: 300,
  costosFijos: 200,
  depreciacion: 50,
  intereses: 0,
  utilidadAntesImpuesto: 450,
  impuesto: 100,
  utilidadNeta: 350,
  flujoOperacional: 400,
  inversion: ano === 0 ? -2000 : 0,
  capitalTrabajo: 0,
  recuperoCT: 0,
  valorResidual: 0,
  prestamoRecibido: 0,
  amortizacionDeuda: 0,
  flujoCajaNeto: flujo,
});

const fr = (rows: CashFlowYear[], van: number): FinancialResult => ({
  cashFlow: rows,
  van,
  tir: 0.25,
  payback: 3.2,
  breakeven: 60,
});

const model: FinancialModelOutput = {
  flujoPuro: fr([cfy(0, -2000), cfy(1, 600), cfy(2, 800)], 40_000_000),
  flujoInversionista: fr([cfy(0, -1200), cfy(1, 500), cfy(2, 700)], 50_000_000),
  breakeven: 60,
  sensitivity: [
    { variable: 'demanda', delta: 0.1, vanPuro: 0, vanInversionista: 0, impactoVanPuro: 30_000_000, impactoVanInv: 0 },
  ],
  usandoModeloCorregido: false,
};

describe('buildInformePdf', () => {
  it('genera un PDF con al menos una página sin lanzar', () => {
    const doc = buildInformePdf({ inputs: defaultInputs, model, projectName: 'Café Test', location: null });
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('produce una salida binaria no vacía', () => {
    const doc = buildInformePdf({
      inputs: defaultInputs,
      model,
      projectName: 'X',
      location: { lat: -33.4, lng: -70.6, label: 'El Golf' },
    });
    const out = doc.output('arraybuffer');
    expect(out.byteLength).toBeGreaterThan(500);
  });
});
