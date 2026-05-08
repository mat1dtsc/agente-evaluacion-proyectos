import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  defaultImpuesto: number;
  defaultTcc: number;
  setDefaults: (p: Partial<Pick<SettingsState, 'defaultImpuesto' | 'defaultTcc'>>) => void;
}

const applyTheme = (theme: 'light' | 'dark') => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },
      defaultImpuesto: 0.25, // Pro PYME 14 D N°3
      defaultTcc: 0.14,      // Retail food riesgo MEDIO (CAPM)
      setDefaults: (p) => set(p),
    }),
    {
      name: 'agente-eval-settings',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    },
  ),
);
