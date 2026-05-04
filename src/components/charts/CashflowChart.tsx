import { Area, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, Bar, ComposedChart } from 'recharts';
import type { CashFlowYear } from '@/lib/finance/types';

interface Props {
  cashFlow: CashFlowYear[];
}

export function CashflowChart({ cashFlow }: Props) {
  let acc = 0;
  const data = cashFlow.map((y) => {
    acc += y.flujoCajaNeto;
    return { ano: `Año ${y.ano}`, anual: Math.round(y.flujoCajaNeto), acumulado: Math.round(acc) };
  });
  return (
    <ResponsiveContainer width="100%" height={240}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gAcumPos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="gAcumNeg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dc2626" stopOpacity={0.05} />
            <stop offset="100%" stopColor="#dc2626" stopOpacity={0.55} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="ano" fontSize={10} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
        <YAxis fontSize={10} tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}M`} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
        <Tooltip
          contentStyle={{ fontSize: 11, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, boxShadow: '0 8px 24px -8px rgba(0,0,0,0.15)' }}
          formatter={(v: number) => `$${(v / 1_000_000).toFixed(2)}M`}
        />
        <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
        <Bar dataKey="anual" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={20} animationDuration={800} />
        <Area type="monotone" dataKey="acumulado" stroke="#22c55e" strokeWidth={2.5} fill="url(#gAcumPos)" animationDuration={1100} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
