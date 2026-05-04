import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSettingsStore } from '@/store/settingsStore';
import { useProjectStore } from '@/store/projectStore';
import { Slider } from '@/components/ui/Slider';
import { Label } from '@/components/ui/Label';
import { formatPct } from '@/lib/utils';

export default function Settings() {
  const settings = useSettingsStore();
  const updateInputs = useProjectStore((s) => s.updateInputs);

  return (
    <div className="container max-w-2xl space-y-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Apariencia</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Button variant={settings.theme === 'light' ? 'default' : 'outline'} size="sm" onClick={() => settings.setTheme('light')}>Claro</Button>
          <Button variant={settings.theme === 'dark' ? 'default' : 'outline'} size="sm" onClick={() => settings.setTheme('dark')}>Oscuro</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parámetros tributarios por defecto</CardTitle>
          <CardDescription>Defaults usados al iniciar un nuevo proyecto.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs">
              <Label>Impuesto a la renta</Label>
              <span className="font-mono">{formatPct(settings.defaultImpuesto, 0)}</span>
            </div>
            <Slider value={settings.defaultImpuesto} onChange={(v) => settings.setDefaults({ defaultImpuesto: v })} min={0} max={0.40} step={0.01} />
          </div>
          <div>
            <div className="flex items-center justify-between text-xs">
              <Label>Tasa costo capital (Tcc) por defecto</Label>
              <span className="font-mono">{formatPct(settings.defaultTcc, 0)}</span>
            </div>
            <Slider value={settings.defaultTcc} onChange={(v) => settings.setDefaults({ defaultTcc: v })} min={0.04} max={0.30} step={0.005} />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateInputs({ tasaImpuesto: settings.defaultImpuesto, tasaCostoCapital: settings.defaultTcc })}
          >
            Aplicar a proyecto activo
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fuentes de datos</CardTitle>
          <CardDescription>Todas las fuentes activas son datos reales públicos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1.5 text-xs">
          <SourceLine name="INE — Censo 2017 + Proyección 2024" detail="34 comunas RM con densidad y pirámide etaria" />
          <SourceLine name="MDS — CASEN 2022" detail="Ingreso, quintil, hogares y pobreza por comuna" />
          <SourceLine name="Metro Santiago — Memoria 2023" detail="62 estaciones reales con afluencia anual" />
          <SourceLine name="SECTRA — EOD 2012" detail="Distribución horaria de viajes en RM (PT y vehicular)" />
          <SourceLine name="Procafé / ANCC" detail="Consumo de café Chile + benchmarks" />
          <SourceLine name="BCN — comunas Chile" detail="Geometrías de 34 comunas de la RM" />
          <SourceLine name="OpenStreetMap (Overpass live)" detail="Cafés, paraderos y vías en vivo al fijar punto" />
          <SourceLine name="Nominatim" detail="Geocodificación de direcciones en Chile" />
          <p className="pt-2 text-muted-foreground">
            Para refrescar los datasets, ejecuta <code className="rounded bg-muted px-1">npm run etl</code> en la raíz del repo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SourceLine({ name, detail }: { name: string; detail: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-2">
      <div>
        <div className="font-semibold">{name}</div>
        <div className="text-[10px] text-muted-foreground">{detail}</div>
      </div>
      <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-green-700 dark:text-green-400">
        real
      </span>
    </div>
  );
}
