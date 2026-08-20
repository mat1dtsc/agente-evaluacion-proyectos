import { Suspense, lazy } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { type ProjectState, useProjectStore } from '@/store/projectStore';

// El mapa (deck.gl) y los paneles con graficos (recharts) son las dependencias
// mas pesadas del bundle. Se cargan cuando se necesitan, no en el arranque:
// asi el shell y la pestaña activa pintan primero.
const MapView = lazy(() =>
  import('@/components/map/MapView3D').then((m) => ({ default: m.MapView3D })),
);
const ZonasPanel = lazy(() =>
  import('@/components/panels/ZonasPanel').then((m) => ({ default: m.ZonasPanel })),
);
const ComparadorPanel = lazy(() =>
  import('@/components/panels/ComparadorPanel').then((m) => ({ default: m.ComparadorPanel })),
);
const FinancialPanel = lazy(() =>
  import('@/components/panels/FinancialPanel').then((m) => ({ default: m.FinancialPanel })),
);
const DemographicsPanel = lazy(() =>
  import('@/components/panels/DemographicsPanel').then((m) => ({ default: m.DemographicsPanel })),
);
const FlowPanel = lazy(() =>
  import('@/components/panels/FlowPanel').then((m) => ({ default: m.FlowPanel })),
);
const CompetitionPanel = lazy(() =>
  import('@/components/panels/CompetitionPanel').then((m) => ({ default: m.CompetitionPanel })),
);
const DemandPanel = lazy(() =>
  import('@/components/panels/DemandPanel').then((m) => ({ default: m.DemandPanel })),
);
const SensitivityPanel = lazy(() =>
  import('@/components/panels/SensitivityPanel').then((m) => ({ default: m.SensitivityPanel })),
);
const AsesorPanel = lazy(() =>
  import('@/components/panels/AsesorPanel').then((m) => ({ default: m.AsesorPanel })),
);

function PanelCargando() {
  return (
    <div className="space-y-3 p-1">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-lg bg-muted/50" />
      ))}
    </div>
  );
}

function MapaCargando() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-muted/30">
      <div className="text-xs text-muted-foreground">Cargando mapa…</div>
    </div>
  );
}

export default function Dashboard() {
  const activeTab = useProjectStore((s) => s.activeTab);
  const setActiveTab = useProjectStore((s) => s.setActiveTab);

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[60%_40%]">
      <div className="relative min-h-[400px] lg:min-h-0">
        <Suspense fallback={<MapaCargando />}>
          <MapView />
        </Suspense>
      </div>
      <aside className="overflow-hidden border-l bg-card">
        <Tabs defaultValue="zonas" value={activeTab} onValueChange={(v) => setActiveTab(v as ProjectState['activeTab'])}>
          <TabsList>
            <TabsTrigger value="zonas">Zonas</TabsTrigger>
            <TabsTrigger value="comparar">Comparar</TabsTrigger>
            <TabsTrigger value="financiero">Financiero</TabsTrigger>
            <TabsTrigger value="demografia">Demografía</TabsTrigger>
            <TabsTrigger value="flujos">Flujos</TabsTrigger>
            <TabsTrigger value="competencia">Competencia</TabsTrigger>
            <TabsTrigger value="demanda">Demanda</TabsTrigger>
            <TabsTrigger value="sensibilidad">Sensibilidad</TabsTrigger>
            <TabsTrigger value="asesor">Asesor IA</TabsTrigger>
          </TabsList>
          <TabsContent value="zonas"><Suspense fallback={<PanelCargando />}><ZonasPanel /></Suspense></TabsContent>
          <TabsContent value="comparar"><Suspense fallback={<PanelCargando />}><ComparadorPanel /></Suspense></TabsContent>
          <TabsContent value="financiero"><Suspense fallback={<PanelCargando />}><FinancialPanel /></Suspense></TabsContent>
          <TabsContent value="demografia"><Suspense fallback={<PanelCargando />}><DemographicsPanel /></Suspense></TabsContent>
          <TabsContent value="flujos"><Suspense fallback={<PanelCargando />}><FlowPanel /></Suspense></TabsContent>
          <TabsContent value="competencia"><Suspense fallback={<PanelCargando />}><CompetitionPanel /></Suspense></TabsContent>
          <TabsContent value="demanda"><Suspense fallback={<PanelCargando />}><DemandPanel /></Suspense></TabsContent>
          <TabsContent value="sensibilidad"><Suspense fallback={<PanelCargando />}><SensitivityPanel /></Suspense></TabsContent>
          <TabsContent value="asesor"><Suspense fallback={<PanelCargando />}><AsesorPanel /></Suspense></TabsContent>
        </Tabs>
      </aside>
    </div>
  );
}
