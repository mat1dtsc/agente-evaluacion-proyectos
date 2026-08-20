import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { MonteCarloResult } from '@/lib/finance/monteCarlo';
import { formatCLP } from '@/lib/utils';

export function MonteCarloChart({ result }: { result: MonteCarloResult }) {
  const data = result.histogram;
  const probPct = Math.round(result.probVanPositivo * 100);

  return (
    <div>
      <ResponsiveContainer width="100%" height={170}>
        <BarChart data={data} margin={{ top: 6, right: 8, left: 8, bottom: 4 }}>
          <XAxis dataKey="bin" tick={false} axisLine={{ stroke: 'hsl(var(--border))' }} height={4} />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
            formatter={(v: number) => [`${v} iteraciones`, 'Frecuencia']}
            labelFormatter={(bin: number) => `VAN ≈ ${formatCLP(bin, true)}`}
            contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
          />
          <Bar dataKey="count" radius={[2, 2, 0, 0]} isAnimationActive={false}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.bin >= 0 ? '#22c55e' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-2 grid grid-cols-4 gap-2 text-center">
        <Stat label="P(VAN>0)" value={`${probPct}%`} tone={probPct >= 60 ? 'pos' : probPct >= 40 ? 'warn' : 'neg'} />
        <Stat label="P5" value={formatCLP(result.vanP5, true)} />
        <Stat label="Mediana" value={formatCLP(result.vanP50, true)} />
        <Stat label="P95" value={formatCLP(result.vanP95, true)} />
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'pos' | 'warn' | 'neg' }) {
  const color = tone === 'pos' ? 'text-emerald-600 dark:text-emerald-400'
    : tone === 'warn' ? 'text-amber-600 dark:text-amber-400'
    : tone === 'neg' ? 'text-rose-600 dark:text-rose-400'
    : '';
  return (
    <div className="rounded-lg border bg-card/60 p-1.5">
      <div className="text-[8px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`font-mono text-[11px] font-bold tabular ${color}`}>{value}</div>
    </div>
  );
}
