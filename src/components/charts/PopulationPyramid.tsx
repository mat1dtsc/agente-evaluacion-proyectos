import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';

interface Props {
  piramide: Record<string, number>;
}

const COLORS = ['#fbbf24', '#f97316', '#dc2626', '#a16207', '#7c3aed', '#1e3a8a'];

export function PopulationPyramid({ piramide }: Props) {
  const data = Object.entries(piramide).map(([rango, share]) => ({
    rango,
    Porcentaje: +(share * 100).toFixed(1),
  }));
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} layout="vertical" margin={{ left: 32, right: 8 }}>
        <defs>
          <linearGradient id="grad-pyramid" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" horizontal={false} />
        <XAxis type="number" fontSize={10} unit="%" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
        <YAxis dataKey="rango" type="category" fontSize={10} width={42} tick={{ fill: 'hsl(var(--foreground))', fontWeight: 500 }} />
        <Tooltip
          contentStyle={{ fontSize: 11, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, boxShadow: '0 8px 24px -8px rgba(0,0,0,0.15)' }}
        />
        <Bar dataKey="Porcentaje" radius={[0, 6, 6, 0]} animationDuration={900}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
