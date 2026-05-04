import { useProjectStore } from '@/store/projectStore';
import { Slider } from '../ui/Slider';
import { Target } from 'lucide-react';

export function RadiusSelector() {
  const radius = useProjectStore((s) => s.radiusMeters);
  const setRadius = useProjectStore((s) => s.setRadius);
  const areaKm2 = (Math.PI * Math.pow(radius / 1000, 2)).toFixed(2);

  return (
    <div className="glass rounded-xl p-3 shadow-xl shadow-black/5">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-bold">
          <Target className="h-3.5 w-3.5 text-accent" />
          Radio de evaluación
        </span>
        <span className="font-mono text-accent font-bold">{radius} m</span>
      </div>
      <Slider value={radius} onChange={setRadius} min={100} max={1500} step={50} />
      <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Área: <b>{areaKm2} km²</b></span>
        <span>{radius < 300 ? '🚶 Caminata' : radius < 800 ? '🚲 Cercanía' : '🚌 Influencia amplia'}</span>
      </div>
    </div>
  );
}
