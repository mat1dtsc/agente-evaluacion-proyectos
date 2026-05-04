import { type ChangeEvent } from 'react';
import { cn } from '@/lib/utils';

interface SliderProps {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  className?: string;
}

export function Slider({ value, onChange, min, max, step = 1, className }: SliderProps) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
      className={cn(
        'w-full cursor-pointer accent-accent',
        className,
      )}
    />
  );
}
