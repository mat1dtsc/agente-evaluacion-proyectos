import { useQuery } from '@tanstack/react-query';
import {
  loadDataset,
  type BusRoutesData,
  type CasenEntry,
  type DatasetWithMeta,
  type DensidadEntry,
  type MetroEntry,
  type MetroLineasData,
  type PerfilHorario,
  type PerfilHorarioZonas,
  type ProcafeData,
  type SourceMeta,
} from '@/lib/data/loader';
import type { FeatureCollection } from 'geojson';

export function useComunasGeoJSON() {
  return useQuery({
    queryKey: ['comunas_chile.geojson'],
    queryFn: () => loadDataset<FeatureCollection>('comunas_chile.geojson'),
    staleTime: Infinity,
  });
}

export function useDensidad() {
  return useQuery({
    queryKey: ['densidad_ine_2024.json'],
    queryFn: () => loadDataset<DatasetWithMeta<DensidadEntry[]>>('densidad_ine_2024.json'),
    staleTime: Infinity,
  });
}

export function useCasen() {
  return useQuery({
    queryKey: ['casen_2022_comuna.json'],
    queryFn: () => loadDataset<DatasetWithMeta<CasenEntry[]>>('casen_2022_comuna.json'),
    staleTime: Infinity,
  });
}

export function useMetro() {
  return useQuery({
    queryKey: ['flujo_metro_estacion.json'],
    queryFn: () => loadDataset<DatasetWithMeta<MetroEntry[]>>('flujo_metro_estacion.json'),
    staleTime: Infinity,
  });
}

export function useMetroLineas() {
  return useQuery({
    queryKey: ['metro_lineas.json'],
    queryFn: () => loadDataset<SourceMeta & MetroLineasData>('metro_lineas.json'),
    staleTime: Infinity,
  });
}

export function useBusRoutes(enabled: boolean = true) {
  return useQuery({
    queryKey: ['bus_red_movilidad.json'],
    queryFn: () => loadDataset<SourceMeta & BusRoutesData>('bus_red_movilidad.json'),
    staleTime: Infinity,
    enabled,
  });
}

export function usePerfilHorario() {
  return useQuery({
    queryKey: ['perfil_horario_eod.json'],
    queryFn: () => loadDataset<SourceMeta & PerfilHorario>('perfil_horario_eod.json'),
    staleTime: Infinity,
  });
}

/** Perfiles horarios diferenciados por tipo de zona (oficina/residencial/transit/etc) */
export function usePerfilHorarioZonas() {
  return useQuery({
    queryKey: ['perfil_horario_zonas.json'],
    queryFn: () => loadDataset<SourceMeta & PerfilHorarioZonas>('perfil_horario_zonas.json'),
    staleTime: Infinity,
  });
}

export function useProcafe() {
  return useQuery({
    queryKey: ['procafe_consumo.json'],
    queryFn: () => loadDataset<DatasetWithMeta<ProcafeData>>('procafe_consumo.json'),
    staleTime: Infinity,
  });
}
