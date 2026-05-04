import { useMemo } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useCasen, useComunasGeoJSON, useDensidad, useMetro } from '@/hooks/useDatasets';
import { useBusStopsNearby, useCafesNearby, useUrbanEquipmentRM } from '@/hooks/useOSMOverpass';
import { findComuna } from '@/lib/geo/zoneLookup';
import { haversine } from '@/lib/geo/distanceUtils';
import { computeScore, scoreColor, scoreLabel } from '@/lib/score';
import { Card, CardContent } from '../ui/Card';
import { SourceCite } from '../ui/SourceCite';
import { ScoreRing } from '../ui/ScoreRing';
import { PopulationPyramid } from '../charts/PopulationPyramid';
import { formatNumber } from '@/lib/utils';
import { NoLocationPlaceholder } from './NoLocationPlaceholder';
import { Users, TrendingUp, Bus, Train, Coffee, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';

export function DemographicsPanel() {
  const location = useProjectStore((s) => s.location);
  const radius = useProjectStore((s) => s.radiusMeters);
  const { data: comunas } = useComunasGeoJSON();
  const { data: densidad } = useDensidad();
  const { data: casen } = useCasen();
  const { data: metro } = useMetro();
  const { data: cafes } = useCafesNearby(location, radius);
  const { data: busStopsLocal } = useBusStopsNearby(location, radius);
  const { data: urbanRM } = useUrbanEquipmentRM(true);

  const comuna = useMemo(() => location ? findComuna(location, comunas as any) : null, [location, comunas]);
  const dens = comuna && densidad?.data.find((d) => d.codigo === comuna.properties.codigo);
  const ing = comuna && casen?.data.find((d) => d.codigo === comuna.properties.codigo);

  const areaKm2 = Math.PI * Math.pow(radius / 1000, 2);
  const poblacionRadio = dens ? Math.round(dens.densidad * areaKm2) : 0;

  const closestMetro = useMemo(() => {
    if (!location || !metro) return null;
    return [...metro.data]
      .map((m) => ({ ...m, dist: haversine(location, m) }))
      .sort((a, b) => a.dist - b.dist)[0];
  }, [location, metro]);

  const equipamientoEnRadio = useMemo(() => {
    if (!location || !urbanRM) return [];
    return urbanRM.filter((p) => haversine(location, p) <= radius);
  }, [location, urbanRM, radius]);

  const score = useMemo(() => {
    if (!location || !dens || !ing) return null;
    return computeScore({
      densidad: dens.densidad,
      ingreso: ing.ingresoMedio,
      paraderos: busStopsLocal?.length ?? 0,
      distMetro: closestMetro?.dist ?? null,
      cafes: cafes?.length ?? 0,
      equipamiento: equipamientoEnRadio.length,
    });
  }, [location, dens, ing, busStopsLocal, closestMetro, cafes, equipamientoEnRadio]);

  // Top 6 comunas por score
  const topComunas = useMemo(() => {
    if (!densidad || !casen) return [];
    return densidad.data.map((d) => {
      const i = casen.data.find((c) => c.codigo === d.codigo);
      if (!i) return null;
      const s = computeScore({
        densidad: d.densidad,
        ingreso: i.ingresoMedio,
        paraderos: 12,
        distMetro: 600,
        cafes: 6,
        equipamiento: 4,
      });
      return { codigo: d.codigo, comuna: d.comuna, score: s.total };
    })
    .filter((x): x is { codigo: string; comuna: string; score: number } => x !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
  }, [densidad, casen]);

  if (!location) return <NoLocationPlaceholder />;
  if (!comuna || !dens || !ing) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-xs text-muted-foreground">
          Punto fuera de las comunas RM con datos. Selecciona un punto dentro del Gran Santiago.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* HEADER serif + score ring */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-xl border bg-card p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Punto evaluado · {radius}m radio
            </div>
            <h2 className="font-serif-display text-2xl leading-tight">
              {comuna.properties.nombre}
            </h2>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {formatNumber(dens.poblacion2024)} hab · {formatNumber(dens.densidad)} hab/km² · Q{ing.quintilDominante}
            </p>
          </div>
          {score && (
            <div className="flex flex-col items-center gap-1">
              <ScoreRing score={score.total} size={72} strokeWidth={7} />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider" style={{ color: scoreColor(score.total) }}>
                {scoreLabel(score.total)}
              </span>
            </div>
          )}
        </div>

        {/* Score breakdown bars */}
        {score && (
          <div className="mt-4 grid grid-cols-5 gap-1.5">
            {[
              { label: 'Pob', v: score.densidad },
              { label: 'Ing', v: score.ingreso },
              { label: 'Tra', v: score.transporte },
              { label: 'Com', v: score.competencia },
              { label: 'Equ', v: score.equipamiento },
            ].map((b) => (
              <div key={b.label}>
                <div className="mb-0.5 flex justify-between text-[9px] font-mono text-muted-foreground">
                  <span>{b.label}</span><span className="tabular">{b.v}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${b.v}%` }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full"
                    style={{ background: scoreColor(b.v) }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* 6 Micro-KPIs en grid 2-col, hairline dividers */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="overflow-hidden rounded-xl border bg-card"
      >
        <div className="grid grid-cols-2 divide-x divide-y hairline border-collapse">
          <KPI icon={<Users className="h-3.5 w-3.5" />} label="Pob. en radio" value={poblacionRadio} suffix=" hab" />
          <KPI icon={<TrendingUp className="h-3.5 w-3.5" />} label="Ingreso medio" value={ing.ingresoMedio} prefix="$" />
          <KPI icon={<Bus className="h-3.5 w-3.5" />} label="Paraderos en radio" value={busStopsLocal?.length ?? 0} suffix="" highlight={(busStopsLocal?.length ?? 0) > 5} />
          <KPI icon={<Train className="h-3.5 w-3.5" />} label="Metro más cercano" value={closestMetro?.dist ?? 0} suffix="m" caption={closestMetro?.nombre} />
          <KPI icon={<Coffee className="h-3.5 w-3.5" />} label="Cafés en radio" value={cafes?.length ?? 0} suffix="" />
          <KPI icon={<Building2 className="h-3.5 w-3.5" />} label="Equipamiento" value={equipamientoEnRadio.length} suffix=" POIs" />
        </div>
      </motion.div>

      {/* Pirámide etaria */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-bold tracking-tight">Pirámide etaria</h3>
            <SourceCite source="INE" url={densidad?._url} retrieved={densidad?._retrieved} />
          </div>
          <PopulationPyramid piramide={dens.piramide} />
        </CardContent>
      </Card>

      {/* Ranking comunas RM */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold tracking-tight">Ranking score · Top 6 comunas RM</h3>
            <span className="font-mono text-[10px] text-muted-foreground">composite</span>
          </div>
          <ul className="space-y-1.5">
            {topComunas.map((c, i) => {
              const isCurrent = c.codigo === comuna.properties.codigo;
              return (
                <li
                  key={c.codigo}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${isCurrent ? 'bg-accent/10 ring-1 ring-accent/40' : 'hover:bg-secondary/50'}`}
                >
                  <span className={`font-mono text-[10px] font-bold ${isCurrent ? 'text-accent' : 'text-muted-foreground'}`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-1 truncate font-medium">{c.comuna}</span>
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${c.score}%`, background: scoreColor(c.score) }} />
                  </div>
                  <span className="w-6 text-right font-mono tabular text-[11px] font-bold" style={{ color: scoreColor(c.score) }}>
                    {c.score}
                  </span>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function KPI({ icon, label, value, prefix, suffix, caption, highlight }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  caption?: string;
  highlight?: boolean;
}) {
  return (
    <div className="p-3">
      <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="font-mono text-[9px] uppercase tracking-wider">{label}</span>
      </div>
      <div className={`font-mono text-base font-bold tabular leading-none ${highlight ? 'text-accent' : ''}`}>
        {prefix}<CountUp end={value} duration={1.0} separator="." preserveValue />{suffix}
      </div>
      {caption && <div className="mt-1 truncate text-[9px] text-muted-foreground">{caption}</div>}
    </div>
  );
}
