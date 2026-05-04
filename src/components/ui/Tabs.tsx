import { type ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (v: string) => void;
  children: ReactNode;
  className?: string;
}
interface TabContextValue {
  active: string;
  setActive: (v: string) => void;
}

const TabContext = createContext<TabContextValue | null>(null);

export function Tabs({ defaultValue, value, onValueChange, children, className }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue);
  const active = value ?? internal;

  useEffect(() => {
    if (value !== undefined) setInternal(value);
  }, [value]);

  const setActive = (v: string) => {
    setInternal(v);
    onValueChange?.(v);
  };

  return (
    <TabContext.Provider value={{ active, setActive }}>
      <LayoutGroup>
        <div className={cn('flex flex-col h-full overflow-hidden', className)}>{children}</div>
      </LayoutGroup>
    </TabContext.Provider>
  );
}

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('relative flex flex-wrap gap-0.5 border-b border-border/40 bg-gradient-to-r from-orange-50/50 via-amber-50/30 to-blue-50/50 dark:from-orange-950/20 dark:via-amber-950/10 dark:to-blue-950/20 px-1 py-1.5 shrink-0 backdrop-blur', className)}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useContext(TabContext)!;
  const isActive = ctx.active === value;
  return (
    <button
      onClick={() => ctx.setActive(value)}
      className={cn(
        'relative rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
        isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {isActive && (
        <motion.div
          layoutId="tab-bg"
          className="absolute inset-0 rounded-md bg-card shadow-sm border border-border/40"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export function TabsContent({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const ctx = useContext(TabContext)!;
  return (
    <AnimatePresence mode="wait">
      {ctx.active === value && (
        <motion.div
          key={value}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={cn('flex-1 overflow-y-auto p-4', className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
