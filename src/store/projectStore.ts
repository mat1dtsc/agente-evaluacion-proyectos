import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProjectInputs } from '@/lib/finance/types';

export interface Location {
  lat: number;
  lng: number;
  label?: string;
}

export interface ProjectState {
  // Geográficos
  location: Location | null;
  radiusMeters: number;
  setLocation: (loc: Location | null) => void;
  setRadius: (m: number) => void;

  // Capas activas en el mapa
  activeLayers: {
    densidad: boolean;
    ingreso: boolean;
    peatonal: boolean;
    metro: boolean;
    paraderos: boolean;
    competencia: boolean;
    vehicular: boolean;
    equipamiento: boolean;
    busRoutes: boolean;
  };
  toggleLayer: (k: keyof ProjectState['activeLayers']) => void;

  // Demanda y supuestos
  inputs: ProjectInputs;
  updateInputs: (patch: Partial<ProjectInputs>) => void;
  resetInputs: () => void;

  // Tasa de captura del flujo (afecta cálculo de combos/día)
  tasaCaptura: number;
  setTasaCaptura: (v: number) => void;

  // Factores de estimación de demanda (calibrables)
  factorResidentes: number;
  setFactorResidentes: (v: number) => void;
  flujoPorParadero: number;
  setFlujoPorParadero: (v: number) => void;
  factorCapturaMetro: number;
  setFactorCapturaMetro: (v: number) => void;

  // Nombre del proyecto (para informes)
  projectName: string;
  setProjectName: (s: string) => void;

  // Sincronización mapa ↔ paneles
  activeTab: 'zonas' | 'demografia' | 'flujos' | 'competencia' | 'demanda' | 'financiero' | 'sensibilidad';
  setActiveTab: (t: ProjectState['activeTab']) => void;
  highlightedComuna: string | null;
  setHighlightedComuna: (codigo: string | null) => void;

  // Ubicación pre-evaluada seleccionada (para el panel comparativo)
  selectedLocationId: string | null;
  setSelectedLocationId: (id: string | null) => void;

  // Filtro temporal — afecta heatmap peatonal en vivo
  dayType: 'lunes_viernes' | 'sabado' | 'domingo';
  hour: number; // 0..23
  setDayType: (d: ProjectState['dayType']) => void;
  setHour: (h: number) => void;
}

import { PLANILLA_CAFE_DEFAULT, planillaAnual } from '@/lib/finance/personal';
import { costoInicialNormativo, costoAnualNormativo } from '@/lib/finance/normativas';

const planillaMensualDefault = planillaAnual(PLANILLA_CAFE_DEFAULT) / 12;

export const defaultInputs: ProjectInputs = {
  inversionInicial: 30_000_000,
  capitalTrabajo: 4_000_000,
  vidaUtilAnos: 5,
  combosPorDiaBase: 80,
  diasOperacionAno: 360,
  crecimientoDemanda: 0.05,
  ticketPromedio: 3500,
  costoVariableUnitario: 900,
  costosFijosMensuales: planillaMensualDefault + 1_400_000, // arriendo + servicios + insumos no var
  costosFijosNoLaboralesMensuales: 1_400_000,
  tasaImpuesto: 0.25, // Pro PYME default
  tasaCostoCapital: 0.12,
  porcentajeDeuda: 0.4,
  tasaBanco: 0.10,
  plazoDeudaAnos: 5,
  depreciacionAnos: 5,
  valorResidual: 0,
  crecimientoPerpetuidad: 0.02,
  personal: PLANILLA_CAFE_DEFAULT,
  costosNormativosIniciales: costoInicialNormativo(),
  costosNormativosAnuales: costoAnualNormativo(),
  proPyme: true,
  tasaIVA: 0.19,
  granularidad: 'anual',
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      location: null,
      radiusMeters: 500,
      setLocation: (location) => set({ location }),
      setRadius: (radiusMeters) => set({ radiusMeters }),

      activeLayers: {
        densidad: true,
        ingreso: false,
        peatonal: true,
        metro: true,
        paraderos: false,
        competencia: false,
        vehicular: false,
        equipamiento: false,
        busRoutes: false,
      },
      toggleLayer: (k) => set((s) => ({ activeLayers: { ...s.activeLayers, [k]: !s.activeLayers[k] } })),

      inputs: defaultInputs,
      updateInputs: (patch) => set((s) => ({ inputs: { ...s.inputs, ...patch } })),
      resetInputs: () => set({ inputs: defaultInputs }),

      tasaCaptura: 0.020,
      setTasaCaptura: (tasaCaptura) => set({ tasaCaptura }),

      factorResidentes: 0.5,
      setFactorResidentes: (factorResidentes) => set({ factorResidentes }),
      flujoPorParadero: 800,
      setFlujoPorParadero: (flujoPorParadero) => set({ flujoPorParadero }),
      factorCapturaMetro: 0.05,
      setFactorCapturaMetro: (factorCapturaMetro) => set({ factorCapturaMetro }),

      projectName: 'Café Express - Combo Espresso + Croissant',
      setProjectName: (projectName) => set({ projectName }),

      activeTab: 'zonas',
      setActiveTab: (activeTab) => set({ activeTab }),
      highlightedComuna: null,
      setHighlightedComuna: (highlightedComuna) => set({ highlightedComuna }),

      selectedLocationId: null,
      setSelectedLocationId: (selectedLocationId) => set({ selectedLocationId }),

      dayType: 'lunes_viernes',
      hour: 13,
      setDayType: (dayType) => set({ dayType }),
      setHour: (hour) => set({ hour }),
    }),
    {
      name: 'agente-eval-proyectos',
      partialize: (state) => ({
        location: state.location,
        radiusMeters: state.radiusMeters,
        inputs: state.inputs,
        tasaCaptura: state.tasaCaptura,
        projectName: state.projectName,
      }),
    },
  ),
);
