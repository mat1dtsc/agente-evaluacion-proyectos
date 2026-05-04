import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface AnimatedKPIProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  /** when true → green tint, when false → red tint, undefined → neutral */
  positive?: boolean;
  subtitle?: string;
  icon?: ReactNode;
  /** stagger delay in seconds */
  delay?: number;
  className?: string;
}

export function AnimatedKPI({
  label, value, prefix, suffix, decimals = 0, positive, subtitle, icon, delay = 0, className,
}: AnimatedKPIProps) {
  const tone =
    positive === true
      ? 'border-green-500/40 bg-gradient-to-br from-green-50/70 to-emerald-50/40 dark:from-green-950/40 dark:to-emerald-950/30'
      : positive === false
      ? 'border-red-500/40 bg-gradient-to-br from-red-50/70 to-rose-50/40 dark:from-red-950/40 dark:to-rose-950/30'
      : 'border-border bg-card';

  const valueColor =
    positive === true
      ? 'text-green-700 dark:text-green-400'
      : positive === false
      ? 'text-red-700 dark:text-red-400'
      : 'text-foreground';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={cn('relative overflow-hidden rounded-xl border p-3 shadow-sm', tone, className)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className={cn('mt-1.5 text-xl font-bold tabular leading-tight', valueColor)}>
        {prefix}
        <CountUp end={value} duration={1.4} decimals={decimals} separator="." decimal="," preserveValue />
        {suffix}
      </div>
      {subtitle && <div className="mt-0.5 text-[10px] text-muted-foreground">{subtitle}</div>}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-orange-500 via-amber-500 to-blue-500 transition-transform duration-300 group-hover:scale-x-100" />
    </motion.div>
  );
}
