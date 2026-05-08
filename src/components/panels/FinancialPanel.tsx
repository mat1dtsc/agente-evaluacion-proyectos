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
import { Download, FileSpreadsheet, TrendingUp, Target, Coins, Calendar, Activity, Banknote, Shield, Edit3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { UBICACIONES } from '@/lib/finance/cafeModel';

export function FinancialPanel() {
  const inputs = useProjectStore((s) => s.inputs);
  const projectName = useProjectStore((s) => s.projectName);
  const location = useProjectStore((s) => s.location);
  const selectedLocationId = useProjectStore((s) => s.selectedLocationId);
  const setActiveTab = useProjectStore((s) => s.setActiveTab);
  const model = useFinancialModel();

  const fp = model.flujoPuro;
  const fi = model.flujoInversionista;
  const ubicSeleccionada = selectedLocationId
    ? UBICACIONES.find((u) => u.id === selectedLocationId)
    : null;

  return (
    <div className="space-y-3">
      {/* Banner de origen del modelo */}
      {model.usandoModeloCorregido && ubicSeleccionada ? (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2.5 rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-50 to-teal-50/60 px-3 py-2 dark:from-emerald-950/30 dark:to-teal-950/20"
        >
          <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                Modelo corregido · {ubicSeleccionada.nombre}
              </div>
              <button
                onClick={() => setActiveTab('zonas')}
                className="text-[10px] font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
              >
                Cambiar zona →
              </button>
            </div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">
              Tcc 14% · Valor terminal 3,5x EBITDA · Comisión tarjetas 2,8% · Costos fijos a precio de mercado
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-50/60 px-3 py-2 dark:bg-amber-950/20">
          <Edit3 className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                Modelo libre · Inputs editables
              </div>
              <button
                onClick={() => setActiveTab('zonas')}
                className="text-[10px] font-semibold text-amber-600 hover:underline dark:text-amber-400"
              >
                Usar zona pre-evaluada →
              </button>
            </div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">
              Sin zona seleccionada — los KPIs salen de los supuestos editables abajo
            </div>
          </div>
        </div>
      )}

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
          suffix={Number.isFinite(fp.tir) ? '%' : ''}
          decimals={1}
          positive={Number.isFinite(fp.tir) && fp.tir > inputs.tasaCostoCapital}
          subtitle={Number.isFinite(fp.tir)
            ? `vs Tcc ${(inputs.tasaCostoCapital * 100).toFixed(0)}%`
            : 'no rentable'}
          icon={<TrendingUp className="h-4 w-4" />}
          delay={0.1}
        />
        <AnimatedKPI
          label="TIR inversionista"
          value={Number.isFinite(fi.tir) ? fi.tir * 100 : 0}
          suffix={Number.isFinite(fi.tir) ? '%' : ''}
          decimals={1}
          positive={Number.isFinite(fi.tir) && fi.tir > inputs.tasaCostoCapital}
          subtitle={Number.isFinite(fi.tir) ? 'Retorno propio' : 'no rentable'}
          icon={<Activity className="h-4 w-4" />}
          delay={0.15}
        />
        <AnimatedKPI
          label="Payback"
          value={Number.isFinite(fp.payback) && fp.payback > 0 ? fp.payback : 0}
          suffix={Number.isFinite(fp.payback) && fp.payback > 0 ? ' años' : ''}
          decimals={2}
          positive={Number.isFinite(fp.payback) && fp.payback < inputs.vidaUtilAnos}
          subtitle={!Number.isFinite(fp.payback) || fp.payback < 0
            ? 'no repaga en 5y'
            : fp.payback >= inputs.vidaUtilAnos
            ? '> horizonte'
            : 'Recuperación'}
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
          <CardDescription>
            {model.usandoModeloCorregido
              ? 'Descarga los entregables auditados (modelo corregido para retail food chileno)'
              : 'Genera Excel/Word desde los inputs editables actuales'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {model.usandoModeloCorregido ? (
            <>
              <a
                href="/exports/Analisis_Cafe_Combo_RM.xlsx"
                download
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-500/20 dark:text-emerald-400"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Análisis comparativo Excel (7 zonas, modelo auditado)
              </a>
              <a
                href="/exports/Informe_Cafe_Combo_RM.docx"
                download
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 text-xs font-semibold text-blue-700 transition-all hover:bg-blue-500/20 dark:text-blue-400"
              >
                <Download className="h-4 w-4" />
                Informe académico Word (16 capítulos)
              </a>
              <div className="text-[10px] text-muted-foreground">
                Estos archivos contienen las 7 zonas evaluadas + capítulo de auditoría del modelo. Para exportar un Excel personalizado con tus propios inputs editables, deselecciona la zona en el panel "Zonas".
              </div>
            </>
          ) : (
            <>
              <Button onClick={() => exportExcel({ inputs, model, projectName, location })}>
                <FileSpreadsheet className="h-4 w-4" />
                Exportar Excel (con fórmulas vivas)
              </Button>
              <Button variant="outline" onClick={() => exportWord({ inputs, model, projectName, location })}>
                <Download className="h-4 w-4" />
                Exportar Word (informe)
              </Button>
            </>
          )}
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
