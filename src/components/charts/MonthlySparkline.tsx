import { Area, AreaChart, ResponsiveContainer, Tooltip, ReferenceLine, XAxis, YAxis } from 'recharts';
import type { CashFlowMonth } from '@/lib/finance/monthlyFlow';

interface Props {
  cashFlow: CashFlowMonth[];
  height?: number;
}

/**
 * Sparkline mensual a 60 períodos. Muestra el flujo acumulado mes a mes con
 * línea de break-even (acumulado = 0). Útil para ver el payback mensual exacto
 * y la curva de recuperación.
 */
export function MonthlySparkline({ cashFlow, height = 140 }: Props) {
  let acc = 0;
  const data = cashFlow.map((m) => {
    acc += m.flujoCajaNeto;
    return {
      mes: m.mes,
      ano: m.ano,
      label: m.mes === 0 ? 'Inv' : `M${m.mes} (A${m.ano})`,
      anual: m.flujoCajaNeto,
      acumulado: acc,
    };
  });

  // Encontrar el mes de payback (cruce a positivo)
  const paybackMonth = data.find((d) => d.acumulado >= 0 && d.mes > 0)?.mes;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gMonthlyPos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="gMonthlyNeg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.05} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.5} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="mes"
          fontSize={9}
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
          tickFormatter={(v: number) => v % 12 === 0 && v > 0 ? `A${v / 12}` : ''}
        />
        <YAxis hide />
        <Tooltip
          contentStyle={{
            fontSize: 11,
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
          }}
          formatter={(v: number) => `$${(v / 1_000_000).toFixed(1)}M`}
          labelFormatter={(_label: any, payload: any) => {
            const d = payload?.[0]?.payload;
            return d ? `Mes ${d.mes} · Año ${d.ano}` : '';
          }}
        />
        <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
        {paybackMonth && (
          <ReferenceLine
            x={paybackMonth}
            stroke="hsl(var(--accent))"
            strokeDasharray="2 2"
            label={{ value: `Payback M${paybackMonth}`, fontSize: 9, fill: 'hsl(var(--accent))' }}
          />
        )}
        <Area
          type="monotone"
          dataKey="acumulado"
          stroke="#22c55e"
          strokeWidth={1.5}
          fill="url(#gMonthlyPos)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
