import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import { Coffee, FileSpreadsheet, FileText, MapPin, TrendingUp, Award } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Puntos neurálgicos del proyecto — comunicados en el header como "credenciales".
 * Estos resultados provienen del análisis financiero a 5 años con flujo puro,
 * tasa de descuento 11.5% y régimen Pro PYME 14 D N°3 (impuesto 25%).
 */
const KEY_FACTS = [
  { icon: MapPin, label: '7 zonas RM', value: 'evaluadas', tone: 'from-orange-500 to-rose-500' },
  { icon: Award, label: 'Ganadora', value: 'El Golf', tone: 'from-amber-500 to-orange-500' },
  { icon: TrendingUp, label: 'VAN líder', value: '$544 M', tone: 'from-emerald-500 to-teal-500' },
];

export default function App() {
  return (
    <div className="flex h-screen flex-col">
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border/40 px-6 py-3 glass-elevated">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3"
        >
          <motion.div
            whileHover={{ rotate: 12, scale: 1.08 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-rose-500 text-white shadow-glow-orange animate-gradient"
          >
            <Coffee className="h-5 w-5" strokeWidth={2.5} />
          </motion.div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">
              <span className="gradient-text">Cafetería Combo Único · Región Metropolitana</span>
            </h1>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Evaluación de Proyecto · MBA UAH 2026 · Prof. Mauricio Zúñiga
            </p>
          </div>
        </motion.div>

        {/* Puntos neurálgicos — estilo "stat strip" */}
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="hidden items-center gap-2 md:flex"
        >
          {KEY_FACTS.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2 rounded-full border border-border/50 bg-card/60 px-3 py-1.5 backdrop-blur"
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br ${f.tone} text-white shadow-sm`}>
                <f.icon className="h-3 w-3" strokeWidth={2.5} />
              </span>
              <div className="leading-tight">
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{f.label}</div>
                <div className="text-[11px] font-bold">{f.value}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Descargas: entregables académicos */}
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-1.5"
        >
          <a
            href="/exports/Analisis_Cafe_Combo_RM.xlsx"
            download
            className="group flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-all hover:bg-emerald-500/20 hover:shadow-sm dark:text-emerald-400"
            title="Modelo financiero con fórmulas vivas (NPV, IRR, CUMIPMT)"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 transition-transform group-hover:-rotate-6" />
            Excel
          </a>
          <a
            href="/exports/Informe_Cafe_Combo_RM.docx"
            download
            className="group flex items-center gap-1.5 rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-600 transition-all hover:bg-blue-500/20 hover:shadow-sm dark:text-blue-400"
            title="Informe académico Word — 16 capítulos + bibliografía + anexos"
          >
            <FileText className="h-3.5 w-3.5 transition-transform group-hover:rotate-6" />
            Word
          </a>
        </motion.div>
      </header>

      <main className="relative flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          {/* Cualquier ruta antigua (intro, reports, settings) redirige al dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="border-t border-border/40 bg-card/40 px-6 py-1.5 text-[10px] text-muted-foreground backdrop-blur">
        Datos: <span className="font-medium text-foreground/80">INE Censo 2017 + Proyección 2024</span> · CASEN 2022 · Metro Memoria 2023 · SECTRA EOD 2012 · Procafé · OpenStreetMap (live) · BCN
      </footer>
    </div>
  );
}
