import { useFinancialModel } from '@/hooks/useFinancialModel';
import { useProjectStore } from '@/store/projectStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { CashflowChart } from '../charts/CashflowChart';
import { MonthlySparkline } from '../charts/MonthlySparkline';
import { AssumptionsPanel } from './AssumptionsPanel';
import { AnimatedKPI } from '../ui/AnimatedKPI';
import { Button } from '../ui/Button';
import { exportExcel } from '@/lib/export/exportExcel';
import { exportWord } from '@/lib/export/exportWord';
import { Download, FileSpreadsheet, TrendingUp, Target, Coins, Calendar, Activity, Banknote } from 'lucide-react';
import { motion } from 'framer-motion';

export function FinancialPanel() {
  const inputs = useProjectStore((s) => s.inputs);
  const projectName = useProjectStore((s) => s.projectName);
  const location = useProjectStore((s) => s.location);
  const model = useFinancialModel();

  const fp = model.flujoPuro;
  const fi = model.flujoInversionista;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <AnimatedKPI
          label="VAN flujo puro"
          value={fp.van}
          prefix="$"
          decimals={0}
          positive={fp.van > 0}
          subtitle={`Tcc ${(inputs.tasaCostoCapital * 100).toFixed(0)}%`}
          icon={<Coins className="h-4 w-4" />}
          delay={0}
        />
        <AnimatedKPI
          label="VAN inversionista"
          value={fi.van}
          prefix="$"
          decimals={0}
          positive={fi.van > 0}
          subtitle={`Deuda ${(inputs.porcentajeDeuda * 100).toFixed(0)}%`}
          icon={<Banknote className="h-4 w-4" />}
          delay={0.05}
        />
        <AnimatedKPI
          label="TIR puro"
          value={Number.isFinite(fp.tir) ? fp.tir * 100 : 0}
          suffix="%"
          decimals={1}
          positive={fp.tir > inputs.tasaCostoCapital}
          subtitle={`vs Tcc ${(inputs.tasaCostoCapital * 100).toFixed(0)}%`}
          icon={<TrendingUp className="h-4 w-4" />}
          delay={0.1}
        />
        <AnimatedKPI
          label="TIR inversionista"
          value={Number.isFinite(fi.tir) ? fi.tir * 100 : 0}
          suffix="%"
          decimals={1}
          positive={fi.tir > inputs.tasaCostoCapital}
          subtitle="Retorno propio"
          icon={<Activity className="h-4 w-4" />}
          delay={0.15}
        />
        <AnimatedKPI
          label="Payback"
          value={fp.payback === Infinity ? 0 : fp.payback}
          suffix={fp.payback === Infinity ? '' : ' años'}
          decimals={2}
          positive={fp.payback < inputs.vidaUtilAnos}
          subtitle={fp.payback === Infinity ? '> horizonte' : 'Recuperación'}
          icon={<Calendar className="h-4 w-4" />}
          delay={0.2}
        />
        <AnimatedKPI
          label="Break-even"
          value={Math.round(model.breakeven)}
          suffix=" combos/día"
          positive={inputs.combosPorDiaBase > model.breakeven}
          subtitle={`Actual: ${inputs.combosPorDiaBase}`}
          icon={<Target className="h-4 w-4" />}
          delay={0.25}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Flujo de caja acumulado</CardTitle>
            <CardDescription>Barras: flujo anual · Área verde: VAN acumulado</CardDescription>
          </CardHeader>
          <CardContent>
            <CashflowChart cashFlow={fp.cashFlow} />
          </CardContent>
        </Card>
      </motion.div>

      {model.flujoMensualPuro && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Flujo mensual a 60 períodos</CardTitle>
              <CardDescription>Curva acumulada con marca de payback</CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlySparkline cashFlow={model.flujoMensualPuro.cashFlowMonthly} />
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Tabla flujo puro (5 años)</CardTitle>
          </CardHeader>
          <CardContent>
            <FlowTable cashFlow={fp.cashFlow} />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Tabla flujo inversionista</CardTitle>
          </CardHeader>
          <CardContent>
            <FlowTable cashFlow={fi.cashFlow} showFinanciamiento />
          </CardContent>
        </Card>
      </motion.div>

      <AssumptionsPanel />

      <Card>
        <CardHeader>
          <CardTitle>Exportar informe</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button onClick={() => exportExcel({ inputs, model, projectName, location })}>
            <FileSpreadsheet className="h-4 w-4" />
            Exportar Excel (con fórmulas vivas)
          </Button>
          <Button variant="outline" onClick={() => exportWord({ inputs, model, projectName, location })}>
            <Download className="h-4 w-4" />
            Exportar Word (informe)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function FlowTable({ cashFlow, showFinanciamiento }: { cashFlow: any[]; showFinanciamiento?: boolean }) {
  const fmt = (v: number) => v === 0 ? '—' : `${(v / 1_000_000).toFixed(2)}M`;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-[11px]">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="py-1.5 text-left font-medium">Concepto</th>
            {cashFlow.map((y) => <th key={y.ano} className="px-2 py-1.5 text-right font-medium">Año {y.ano}</th>)}
          </tr>
        </thead>
        <tbody>
          <Row label="Ingresos" values={cashFlow.map((y) => y.ingresos)} fmt={fmt} />
          <Row label="(-) Costos variables" values={cashFlow.map((y) => -y.costosVariables)} fmt={fmt} />
          <Row label="(-) Costos fijos" values={cashFlow.map((y) => -y.costosFijos)} fmt={fmt} />
          <Row label="(-) Depreciación" values={cashFlow.map((y) => -y.depreciacion)} fmt={fmt} />
          {showFinanciamiento && <Row label="(-) Intereses" values={cashFlow.map((y) => -y.intereses)} fmt={fmt} />}
          <Row label="UAI" values={cashFlow.map((y) => y.utilidadAntesImpuesto)} fmt={fmt} bold />
          <Row label="(-) Impuesto" values={cashFlow.map((y) => -y.impuesto)} fmt={fmt} />
          <Row label="Utilidad neta" values={cashFlow.map((y) => y.utilidadNeta)} fmt={fmt} bold />
          <Row label="(+) Depreciación" values={cashFlow.map((y) => y.depreciacion)} fmt={fmt} />
          <Row label="(-) Inversión" values={cashFlow.map((y) => y.inversion)} fmt={fmt} />
          <Row label="(-) Capital trabajo" values={cashFlow.map((y) => y.capitalTrabajo)} fmt={fmt} />
          {showFinanciamiento && <Row label="(+) Préstamo" values={cashFlow.map((y) => y.prestamoRecibido)} fmt={fmt} />}
          {showFinanciamiento && <Row label="(-) Amortización deuda" values={cashFlow.map((y) => -y.amortizacionDeuda)} fmt={fmt} />}
          <Row label="(+) Recupero CT" values={cashFlow.map((y) => y.recuperoCT)} fmt={fmt} />
          <Row label="(+) Valor residual" values={cashFlow.map((y) => y.valorResidual)} fmt={fmt} />
          <Row label="Flujo neto" values={cashFlow.map((y) => y.flujoCajaNeto)} fmt={fmt} highlight />
        </tbody>
      </table>
    </div>
  );
}

function Row({ label, values, fmt, bold, highlight }: { label: string; values: number[]; fmt: (v: number) => string; bold?: boolean; highlight?: boolean }) {
  return (
    <tr className={`border-b border-border/40 last:border-0 transition-colors hover:bg-secondary/30 ${highlight ? 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 font-bold' : bold ? 'font-semibold' : ''}`}>
      <td className="py-1.5">{label}</td>
      {values.map((v, i) => (
        <td key={i} className={`px-2 py-1.5 text-right font-mono tabular ${v < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>{fmt(v)}</td>
      ))}
    </tr>
  );
}
