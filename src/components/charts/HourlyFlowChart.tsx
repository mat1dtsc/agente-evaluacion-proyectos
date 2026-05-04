import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, ReferenceLine } from 'recharts';

interface Props {
  laborales: number[];
  sabado: number[];
  domingo: number[];
  /** Día activo del filtro temporal — los demás se atenúan */
  activeDay?: 'lunes_viernes' | 'sabado' | 'domingo';
  /** Hora activa (0..23) — pinta línea vertical de referencia */
  activeHour?: number;
}

export function HourlyFlowChart({ laborales, sabado, domingo, activeDay, activeHour }: Props) {
  const data = laborales.map((_, h) => ({
    hora: `${String(h).padStart(2, '0')}h`,
    h,
    'Lun-Vie': laborales[h],
    'Sábado': sabado[h],
    'Domingo': domingo[h],
  }));

  // Opacity por día: el activo en 100%, los demás en 25%
  const opacity = (key: 'lunes_viernes' | 'sabado' | 'domingo'): number => {
    if (!activeDay) return 1;
    return key === activeDay ? 1 : 0.18;
  };
  const stroke = (key: 'lunes_viernes' | 'sabado' | 'domingo'): number => {
    if (!activeDay) return 2;
    return key === activeDay ? 2.5 : 1;
  };

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gLV" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity={0.7} />
            <stop offset="100%" stopColor="#f97316" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="gSAB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="gDOM" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="hora" fontSize={9} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} interval={2} />
        <YAxis fontSize={9} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} width={35} />
        <Tooltip
          contentStyle={{
            fontSize: 11,
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            boxShadow: '0 8px 24px -8px rgba(0,0,0,0.15)',
          }}
        />
        <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} iconType="circle" />
        {activeHour !== undefined && (
          <ReferenceLine
            x={`${String(activeHour).padStart(2, '0')}h`}
            stroke="hsl(var(--accent))"
            strokeWidth={2}
            strokeDasharray="3 3"
            label={{ value: `${activeHour}:00`, fontSize: 10, fill: 'hsl(var(--accent))', position: 'top' }}
          />
        )}
        <Area type="natural" dataKey="Lun-Vie" stroke="#f97316" strokeWidth={stroke('lunes_viernes')} fill="url(#gLV)" opacity={opacity('lunes_viernes')} animationDuration={500} />
        <Area type="natural" dataKey="Sábado"  stroke="#0ea5e9" strokeWidth={stroke('sabado')} fill="url(#gSAB)" opacity={opacity('sabado')} animationDuration={600} />
        <Area type="natural" dataKey="Domingo" stroke="#a78bfa" strokeWidth={stroke('domingo')} fill="url(#gDOM)" opacity={opacity('domingo')} animationDuration={700} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
