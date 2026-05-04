import { useMemo } from 'react';
import { buildPureFlow } from '@/lib/finance/puroFlow';
import { buildInvestorFlow } from '@/lib/finance/inversionistaFlow';
import { breakeven } from '@/lib/finance/breakeven';
import { runSensitivity } from '@/lib/finance/sensitivity';
import { buildMonthlyFlow, type MonthlyFlowResult } from '@/lib/finance/monthlyFlow';
import { useProjectStore } from '@/store/projectStore';
import type { FinancialResult } from '@/lib/finance/types';

export interface FinancialModelOutput {
  flujoPuro: FinancialResult;
  flujoInversionista: FinancialResult;
  breakeven: number;
  sensitivity: ReturnType<typeof runSensitivity>;
  /** Flujo mensual a 60 períodos (puro) — opcional, presente si granularidad incluye mensual */
  flujoMensualPuro?: MonthlyFlowResult;
  /** Flujo mensual del inversionista */
  flujoMensualInversionista?: MonthlyFlowResult;
}

export function useFinancialModel(): FinancialModelOutput {
  const inputs = useProjectStore((s) => s.inputs);

  return useMemo(() => {
    const fp = buildPureFlow(inputs);
    const fi = buildInvestorFlow(inputs);
    const be = breakeven(inputs);
    const sens = runSensitivity(inputs);

    // Flujo mensual siempre se calcula — útil para informe detallado
    const flujoMensualPuro = buildMonthlyFlow(inputs, { conDeuda: false });
    const flujoMensualInversionista = buildMonthlyFlow(inputs, { conDeuda: true });

    return {
      flujoPuro: { ...fp, breakeven: be },
      flujoInversionista: { ...fi, breakeven: be },
      breakeven: be,
      sensitivity: sens,
      flujoMensualPuro,
      flujoMensualInversionista,
    };
  }, [inputs]);
}
