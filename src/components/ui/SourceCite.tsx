import { cn } from '@/lib/utils';

interface Props {
  source: string;
  url?: string;
  retrieved?: string;
  isDemo?: boolean;
  className?: string;
}

export function SourceCite({ source, url, retrieved, isDemo, className }: Props) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] text-muted-foreground', className)} title={`${source}${retrieved ? ` · ${retrieved}` : ''}${url ? ` · ${url}` : ''}`}>
      {isDemo && (
        <span className="rounded-sm bg-warning/20 px-1 py-0.5 text-[9px] font-semibold uppercase text-warning-foreground">
          DEMO
        </span>
      )}
      <span className="truncate">{source}</span>
    </span>
  );
}
