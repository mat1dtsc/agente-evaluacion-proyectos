import { buildInvestorFlow } from './inversionistaFlow';
import { buildPureFlow } from './puroFlow';
import type { ProjectInputs, SensitivityResult, SensitivityVariable } from './types';

const VAR_TO_FIELD: Record<SensitivityVariable, (i: ProjectInputs, factor: number) => ProjectInputs> = {
  precio: (i, f) => ({ ...i, ticketPromedio: i.ticketPromedio * f }),
  demanda: (i, f) => ({ ...i, combosPorDiaBase: i.combosPorDiaBase * f }),
  costoInsumo: (i, f) => ({ ...i, costoVariableUnitario: i.costoVariableUnitario * f }),
  arriendo: (i, f) => ({ ...i, costosFijosMensuales: i.costosFijosMensuales * f }),
  sueldo: (i, f) => ({ ...i, costosFijosMensuales: i.costosFijosMensuales * f }),
  tasaBanco: (i, f) => ({ ...i, tasaBanco: i.tasaBanco * f }),
  tasaDescuento: (i, f) => ({ ...i, tasaCostoCapital: i.tasaCostoCapital * f }),
};

/**
 * Para cada combinación variable × delta, recalcula VAN puro e inversionista
 * y reporta el impacto absoluto. Ordena por |impactoVanPuro| descendente
 * para alimentar directamente un tornado chart.
 *
 * Nota: la tasa de descuento (tasaDescuento) afecta el VAN tanto vía el factor
 * de descuento (NPV) como vía el valor terminal (Gordon Growth Tcc-g).
 */
export function runSensitivity(
  inputs: ProjectInputs,
  variables: SensitivityVariable[] = ['precio', 'demanda', 'costoInsumo', 'arriendo', 'sueldo', 'tasaBanco', 'tasaDescuento'],
  deltas: number[] = [-0.20, -0.10, 0.10, 0.20],
): SensitivityResult[] {
  const baseVanP = buildPureFlow(inputs).van;
  const baseVanI = buildInvestorFlow(inputs).van;

  const out: SensitivityResult[] = [];
  for (const v of variables) {
    for (const d of deltas) {
      const modified = VAR_TO_FIELD[v](inputs, 1 + d);
      const vanP = buildPureFlow(modified).van;
      const vanI = buildInvestorFlow(modified).van;
      out.push({
        variable: v,
        delta: d,
        vanPuro: vanP,
        vanInversionista: vanI,
        impactoVanPuro: vanP - baseVanP,
        impactoVanInv: vanI - baseVanI,
      });
    }
  }
  out.sort((a, b) => Math.abs(b.impactoVanPuro) - Math.abs(a.impactoVanPuro));
  return out;
}
