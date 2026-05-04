import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { SensitivityResult } from '@/lib/finance/types';

const VAR_LABELS: Record<string, string> = {
  precio: 'Precio del combo',
  demanda: 'Demanda (combos/día)',
  costoInsumo: 'Costo insumo',
  arriendo: 'Arriendo / fijos',
  sueldo: 'Sueldos',
  tasaBanco: 'Tasa banco',
};

interface Props {
  results: SensitivityResult[];
  baseVan: number;
}

export function SensitivityTornado({ results, baseVan }: Props) {
  const grouped = useMemo(() => {
    const map = new Map<string, { neg: number; pos: number }>();
    for (const r of results) {
      if (Math.abs(r.delta) !== 0.20) continue;
      const cur = map.get(r.variable) ?? { neg: 0, pos: 0 };
      if (r.delta < 0) cur.neg = r.impactoVanPuro;
      else cur.pos = r.impactoVanPuro;
      map.set(r.variable, cur);
    }
    return Array.from(map.entries())
      .map(([variable, v]) => ({ variable, ...v, range: Math.max(Math.abs(v.neg), Math.abs(v.pos)) }))
      .sort((a, b) => b.range - a.range);
  }, [results]);

  const maxRange = Math.max(...grouped.map((g) => g.range), 1);

  return (
    <div className="space-y-2 py-2">
      {grouped.map((g, i) => {
        const negPct = Math.abs(g.neg) / maxRange * 50;
        const posPct = Math.abs(g.pos) / maxRange * 50;
        return (
          <motion.div
            key={g.variable}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="group flex items-center gap-2 text-[11px]"
          >
            <div className="w-32 truncate text-right font-medium">{VAR_LABELS[g.variable] ?? g.variable}</div>
            <div className="relative flex h-6 flex-1 items-center rounded-md bg-muted/40">
              <div className="absolute left-1/2 top-0 h-full w-px bg-border" />
              {g.neg < 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${negPct}%` }}
                  transition={{ delay: i * 0.06 + 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-1/2 h-full rounded-l-md bg-gradient-to-l from-red-500 to-red-600 shadow-sm"
                  title={`-20%: $${(g.neg / 1_000_000).toFixed(1)}M`}
                />
              )}
              {g.pos > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${posPct}%` }}
                  transition={{ delay: i * 0.06 + 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute left-1/2 h-full rounded-r-md bg-gradient-to-r from-green-500 to-emerald-600 shadow-sm"
                  title={`+20%: $${(g.pos / 1_000_000).toFixed(1)}M`}
                />
              )}
            </div>
            <div className="w-20 text-right font-mono text-[10px] tabular text-muted-foreground">
              ±${(g.range / 1_000_000).toFixed(1)}M
            </div>
          </motion.div>
        );
      })}
      <div className="pt-2 text-[10px] text-muted-foreground">
        VAN base: <span className="font-mono font-semibold text-foreground">${(baseVan / 1_000_000).toFixed(2)}M</span> · barras = impacto ±20%
      </div>
    </div>
  );
}
