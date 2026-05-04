import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useProjectStore } from '@/store/projectStore';
import { useFinancialModel } from '@/hooks/useFinancialModel';
import { exportExcel } from '@/lib/export/exportExcel';
import { exportWord } from '@/lib/export/exportWord';
import { AnimatedKPI } from '@/components/ui/AnimatedKPI';
import { Download, FileSpreadsheet, Share2, Coins, TrendingUp, Activity, Target } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Reports() {
  const inputs = useProjectStore((s) => s.inputs);
  const projectName = useProjectStore((s) => s.projectName);
  const setProjectName = useProjectStore((s) => s.setProjectName);
  const location = useProjectStore((s) => s.location);
  const model = useFinancialModel();

  const shareUrl = (() => {
    const state = btoa(unescape(encodeURIComponent(JSON.stringify({
      location, radius: useProjectStore.getState().radiusMeters, inputs, projectName,
    }))));
    return `${window.location.origin}/?state=${state}`;
  })();

  const copyShare = async () => {
    try { await navigator.clipboard.writeText(shareUrl); alert('URL copiada al portapapeles'); }
    catch { prompt('Copia esta URL:', shareUrl); }
  };

  return (
    <div className="container max-w-3xl space-y-4 py-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informes y exportación</CardTitle>
            <CardDescription>Configura el proyecto y descarga los entregables.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nombre del proyecto</label>
              <input
                className="mt-1 w-full rounded-lg border bg-card/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <AnimatedKPI label="VAN puro" value={model.flujoPuro.van} prefix="$" decimals={0} positive={model.flujoPuro.van > 0} icon={<Coins className="h-4 w-4" />} delay={0} />
              <AnimatedKPI label="TIR puro" value={Number.isFinite(model.flujoPuro.tir) ? model.flujoPuro.tir * 100 : 0} suffix="%" decimals={1} positive={model.flujoPuro.tir > inputs.tasaCostoCapital} icon={<TrendingUp className="h-4 w-4" />} delay={0.05} />
              <AnimatedKPI label="VAN inv." value={model.flujoInversionista.van} prefix="$" decimals={0} positive={model.flujoInversionista.van > 0} icon={<Activity className="h-4 w-4" />} delay={0.1} />
              <AnimatedKPI label="Break-even" value={Math.round(model.breakeven)} suffix=" cb/día" icon={<Target className="h-4 w-4" />} delay={0.15} />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={() => exportExcel({ inputs, model, projectName, location })}>
                <FileSpreadsheet className="h-4 w-4" />
                Descargar Excel
              </Button>
              <Button variant="outline" onClick={() => exportWord({ inputs, model, projectName, location })}>
                <Download className="h-4 w-4" />
                Descargar Word
              </Button>
              <Button variant="outline" onClick={copyShare}>
                <Share2 className="h-4 w-4" />
                Compartir URL
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
        <Card>
          <CardHeader>
            <CardTitle>Persistencia</CardTitle>
            <CardDescription>El estado del proyecto se guarda automáticamente en localStorage.</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Para múltiples proyectos guardados en una misma sesión, exporta el modelo Excel y guarda el archivo localmente.
            La función de catálogo de proyectos múltiples está planificada para V2.
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
