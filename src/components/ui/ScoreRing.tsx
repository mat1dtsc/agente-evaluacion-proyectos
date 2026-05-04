import { motion } from 'framer-motion';
import { scoreColor } from '@/lib/score';

interface Props {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export function ScoreRing({ score, size = 64, strokeWidth = 6, showLabel = true }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * (score / 100);
  const color = scoreColor(score);
  // Indicador no-cromático para daltonismo
  const pattern = score >= 80 ? '●' : score >= 65 ? '◆' : score >= 50 ? '▲' : '■';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - dash }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-base font-bold tabular leading-none" style={{ color }}>{score}</span>
          <span className="text-[8px] uppercase tracking-wider text-muted-foreground">{pattern} score</span>
        </div>
      )}
    </div>
  );
}
