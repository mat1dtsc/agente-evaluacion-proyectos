import { useProjectStore } from '@/store/projectStore';
import type { ProjectInputs } from '@/lib/finance/types';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Slider } from '../ui/Slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatPct } from '@/lib/utils';

type NumFieldProps = {
  k: keyof ProjectInputs;
  label: string;
  step?: number;
  value: number;
  onChange: (k: keyof ProjectInputs, v: number) => void;
};

/**
 * Declarado fuera de AssumptionsPanel a proposito: si se define dentro del
 * render, React lo trata como un tipo de componente nuevo en cada render y
 * remonta el <input>, que pierde el foco al teclear cada digito.
 */
function NumField({ k, label, step, value, onChange }: NumFieldProps) {
  const id = `supuesto-${k}`;
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        step={step ?? 1}
        value={value}
        onChange={(e) => onChange(k, Number(e.target.value))}
      />
    </div>
  );
}

export function AssumptionsPanel() {
  const inputs = useProjectStore((s) => s.inputs);
  const upd = useProjectStore((s) => s.updateInputs);
  const reset = useProjectStore((s) => s.resetInputs);

  const setField = (k: keyof ProjectInputs, v: number) =>
    upd({ [k]: v } as Partial<ProjectInputs>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supuestos del modelo (modelo libre)</CardTitle>
        <CardDescription>Edita en línea, el modelo recompone VAN/TIR al instante.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md border border-amber-500/30 bg-amber-50/50 p-2 text-[10.5px] dark:bg-amber-950/15">
          <span className="font-semibold text-amber-700 dark:text-amber-400">⚠ Diferencias vs modelo auditado:</span>
          <span className="text-muted-foreground"> el modo libre usa valor terminal por Gordon Growth (perpetuidad creciente) y NO incluye comisión de tarjetas. Para evaluar zonas reales con todos los ajustes (comisión 2,8%, valor terminal 3,5x EBITDA, costos fijos auditados), selecciona una zona en el panel "Zonas".</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <NumField k="inversionInicial" label="Inversión inicial (CLP)" step={100000} value={inputs.inversionInicial} onChange={setField} />
          <NumField k="capitalTrabajo" label="Capital de trabajo (CLP)" step={100000} value={inputs.capitalTrabajo} onChange={setField} />
          <NumField k="ticketPromedio" label="Ticket promedio (CLP)" step={100} value={inputs.ticketPromedio} onChange={setField} />
          <NumField k="costoVariableUnitario" label="Costo variable unit. (CLP)" step={50} value={inputs.costoVariableUnitario} onChange={setField} />
          <NumField k="costosFijosMensuales" label="Costos fijos mensuales (CLP)" step={50000} value={inputs.costosFijosMensuales} onChange={setField} />
          <NumField k="combosPorDiaBase" label="Combos/día base" value={inputs.combosPorDiaBase} onChange={setField} />
          <NumField k="diasOperacionAno" label="Días operación/año" value={inputs.diasOperacionAno} onChange={setField} />
          <NumField k="vidaUtilAnos" label="Horizonte (años)" value={inputs.vidaUtilAnos} onChange={setField} />
          <NumField k="depreciacionAnos" label="Depreciación lineal (años)" value={inputs.depreciacionAnos} onChange={setField} />
          <NumField k="valorResidual" label="Valor residual (CLP)" step={100000} value={inputs.valorResidual} onChange={setField} />
          <NumField k="crecimientoPerpetuidad" label="Crecimiento perpetuidad (g)" step={0.005} value={inputs.crecimientoPerpetuidad} onChange={setField} />
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
