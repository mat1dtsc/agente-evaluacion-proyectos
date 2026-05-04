import { useFinancialModel } from '@/hooks/useFinancialModel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { SensitivityTornado } from '../charts/SensitivityTornado';
import { useProjectStore } from '@/store/projectStore';
import { buildPureFlow } from '@/lib/finance/puroFlow';
import { useMemo } from 'react';
import { formatCLP } from '@/lib/utils';

export function SensitivityPanel() {
  const inputs = useProjectStore((s) => s.inputs);
  const { sensitivity, flujoPuro } = useFinancialModel();

  // Heatmap precio × demanda
  const heatmap = useMemo(() => {
    const priceFactors = [0.85, 0.92, 1.0, 1.08, 1.15];
    const demandFactors = [0.7, 0.85, 1.0, 1.15, 1.3];
    const grid = priceFactors.map((pf) =>
      demandFactors.map((df) => {
        const r = buildPureFlow({
          ...inputs,
          ticketPromedio: inputs.ticketPromedio * pf,
          combosPorDiaBase: inputs.combosPorDiaBase * df,
        });
        return { pf, df, van: r.van };
      }),
    );
    const allVans = grid.flat().map((c) => c.van);
    return { grid, min: Math.min(...allVans), max: Math.max(...allVans), priceFactors, demandFactors };
  }, [inputs]);

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>Tornado de sensibilidad</CardTitle>
          <CardDescription>Impacto en VAN al variar ±20% cada variable</CardDescription>
        </CardHeader>
        <CardContent>
          <SensitivityTornado results={sensitivity} baseVan={flujoPuro.van} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Heatmap precio × demanda</CardTitle>
          <CardDescription>VAN en cada combinación. Verde = positivo, rojo = negativo.</CardDescription>
        </CardHeader>
        <CardContent>
          <table className="w-full text-[10px]">
            <thead>
              <tr>
                <th className="p-1 text-right text-muted-foreground">Precio↓ / Demanda→</th>
                {heatmap.demandFactors.map((d) => (
                  <th key={d} className="p-1 text-center">{Math.round(d * 100)}%</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmap.grid.map((row, i) => (
                <tr key={i}>
                  <td className="p-1 text-right font-semibold">{Math.round(heatmap.priceFactors[i] * 100)}%</td>
                  {row.map((cell, j) => {
                    const range = Math.max(Math.abs(heatmap.min), Math.abs(heatmap.max));
                    const intensity = Math.min(1, Math.abs(cell.van) / Math.max(1, range));
                    const color = cell.van >= 0
                      ? `rgba(34,197,94,${0.15 + intensity * 0.6})`
                      : `rgba(220,38,38,${0.15 + intensity * 0.6})`;
                    return (
                      <td key={j} className="p-1 text-center font-mono" style={{ background: color }} title={formatCLP(cell.van)}>
                        {(cell.van / 1_000_000).toFixed(0)}M
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 text-[10px] text-muted-foreground">
            Cada celda muestra el VAN en millones de CLP para esa combinación de precio y demanda relativos al caso base.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
