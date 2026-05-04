import { useProjectStore } from '@/store/projectStore';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Slider } from '../ui/Slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatPct } from '@/lib/utils';

export function AssumptionsPanel() {
  const inputs = useProjectStore((s) => s.inputs);
  const upd = useProjectStore((s) => s.updateInputs);
  const reset = useProjectStore((s) => s.resetInputs);

  const NumField = (props: { k: keyof typeof inputs; label: string; step?: number }) => (
    <div>
      <Label>{props.label}</Label>
      <Input
        type="number"
        step={props.step ?? 1}
        value={inputs[props.k] as number}
        onChange={(e) => upd({ [props.k]: Number(e.target.value) } as any)}
      />
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supuestos del modelo</CardTitle>
        <CardDescription>Edita en línea, el modelo recompone VAN/TIR al instante.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <NumField k="inversionInicial" label="Inversión inicial (CLP)" step={100000} />
          <NumField k="capitalTrabajo" label="Capital de trabajo (CLP)" step={100000} />
          <NumField k="ticketPromedio" label="Ticket promedio (CLP)" step={100} />
          <NumField k="costoVariableUnitario" label="Costo variable unit. (CLP)" step={50} />
          <NumField k="costosFijosMensuales" label="Costos fijos mensuales (CLP)" step={50000} />
          <NumField k="combosPorDiaBase" label="Combos/día base" />
          <NumField k="diasOperacionAno" label="Días operación/año" />
          <NumField k="vidaUtilAnos" label="Horizonte (años)" />
          <NumField k="depreciacionAnos" label="Depreciación lineal (años)" />
          <NumField k="valorResidual" label="Valor residual (CLP)" step={100000} />
          <NumField k="crecimientoPerpetuidad" label="Crecimiento perpetuidad (g)" step={0.005} />
        </div>
        <hr className="border-border" />
        <div className="space-y-2 text-xs">
          <div>
            <div className="flex items-center justify-between"><Label>Crecimiento demanda anual</Label><span className="font-mono">{formatPct(inputs.crecimientoDemanda, 1)}</span></div>
            <Slider value={inputs.crecimientoDemanda} onChange={(v) => upd({ crecimientoDemanda: v })} min={-0.05} max={0.20} step={0.005} />
          </div>
          <div>
            <div className="flex items-center justify-between"><Label>Tasa impuesto</Label><span className="font-mono">{formatPct(inputs.tasaImpuesto, 0)}</span></div>
            <Slider value={inputs.tasaImpuesto} onChange={(v) => upd({ tasaImpuesto: v })} min={0} max={0.40} step={0.01} />
          </div>
          <div>
            <div className="flex items-center justify-between"><Label>Tasa costo capital (Tcc)</Label><span className="font-mono">{formatPct(inputs.tasaCostoCapital, 0)}</span></div>
            <Slider value={inputs.tasaCostoCapital} onChange={(v) => upd({ tasaCostoCapital: v })} min={0.04} max={0.30} step={0.005} />
          </div>
          <div>
            <div className="flex items-center justify-between"><Label>% Financiamiento bancario</Label><span className="font-mono">{formatPct(inputs.porcentajeDeuda, 0)}</span></div>
            <Slider value={inputs.porcentajeDeuda} onChange={(v) => upd({ porcentajeDeuda: v })} min={0} max={0.80} step={0.05} />
          </div>
          <div>
            <div className="flex items-center justify-between"><Label>Tasa banco</Label><span className="font-mono">{formatPct(inputs.tasaBanco, 1)}</span></div>
            <Slider value={inputs.tasaBanco} onChange={(v) => upd({ tasaBanco: v })} min={0.05} max={0.25} step={0.005} />
          </div>
          <div>
            <Label>Plazo deuda (años)</Label>
            <Input type="number" value={inputs.plazoDeudaAnos} onChange={(e) => upd({ plazoDeudaAnos: Number(e.target.value) })} />
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>Restablecer valores por defecto</Button>
      </CardContent>
    </Card>
  );
}
