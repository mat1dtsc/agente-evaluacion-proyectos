import { MapView3D as MapView } from '@/components/map/MapView3D';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ZonasPanel } from '@/components/panels/ZonasPanel';
import { DemographicsPanel } from '@/components/panels/DemographicsPanel';
import { FlowPanel } from '@/components/panels/FlowPanel';
import { CompetitionPanel } from '@/components/panels/CompetitionPanel';
import { DemandPanel } from '@/components/panels/DemandPanel';
import { FinancialPanel } from '@/components/panels/FinancialPanel';
import { SensitivityPanel } from '@/components/panels/SensitivityPanel';
import { useProjectStore } from '@/store/projectStore';

export default function Dashboard() {
  const activeTab = useProjectStore((s) => s.activeTab);
  const setActiveTab = useProjectStore((s) => s.setActiveTab);

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[60%_40%]">
      <div className="relative min-h-[400px] lg:min-h-0">
        <MapView />
      </div>
      <aside className="overflow-hidden border-l bg-card">
        <Tabs defaultValue="zonas" value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="zonas">Zonas</TabsTrigger>
            <TabsTrigger value="financiero">Financiero</TabsTrigger>
            <TabsTrigger value="demografia">Demografía</TabsTrigger>
            <TabsTrigger value="flujos">Flujos</TabsTrigger>
            <TabsTrigger value="competencia">Competencia</TabsTrigger>
            <TabsTrigger value="demanda">Demanda</TabsTrigger>
            <TabsTrigger value="sensibilidad">Sensibilidad</TabsTrigger>
          </TabsList>
          <TabsContent value="zonas"><ZonasPanel /></TabsContent>
          <TabsContent value="financiero"><FinancialPanel /></TabsContent>
          <TabsContent value="demografia"><DemographicsPanel /></TabsContent>
          <TabsContent value="flujos"><FlowPanel /></TabsContent>
          <TabsContent value="competencia"><CompetitionPanel /></TabsContent>
          <TabsContent value="demanda"><DemandPanel /></TabsContent>
          <TabsContent value="sensibilidad"><SensitivityPanel /></TabsContent>
        </Tabs>
      </aside>
    </div>
  );
}
