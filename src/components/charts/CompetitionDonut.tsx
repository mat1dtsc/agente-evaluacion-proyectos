import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  cadena: number;
  independiente: number;
}

export function CompetitionDonut({ cadena, independiente }: Props) {
  const total = cadena + independiente;
  const data = [
    { name: 'Cadena', value: cadena },
    { name: 'Independiente', value: independiente },
  ];
  if (total === 0) {
    return <div className="py-8 text-center text-xs text-muted-foreground">Sin competidores en el radio</div>;
  }
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <defs>
            <linearGradient id="gCadena" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="gIndep" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3} animationDuration={900}>
            <Cell fill="url(#gCadena)" stroke="hsl(var(--card))" strokeWidth={3} />
            <Cell fill="url(#gIndep)" stroke="hsl(var(--card))" strokeWidth={3} />
          </Pie>
          <Tooltip contentStyle={{ fontSize: 11, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, boxShadow: '0 8px 24px -8px rgba(0,0,0,0.15)' }} />
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center" style={{ marginBottom: 24 }}>
        <div className="text-2xl font-bold text-accent">{total}</div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">cafés</div>
      </div>
    </div>
  );
}
