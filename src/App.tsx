import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Intro from './pages/Intro';
import { Coffee, FileBarChart, Settings as SettingsIcon, LayoutDashboard, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { to: '/intro', label: 'Inicio', icon: Sparkles },
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/reports', label: 'Informes', icon: FileBarChart },
  { to: '/settings', label: 'Ajustes', icon: SettingsIcon },
];

export default function App() {
  return (
    <div className="flex h-screen flex-col">
      <header className="relative z-10 flex items-center justify-between border-b border-border/40 px-6 py-3 glass-elevated">
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
              <span className="gradient-text">Agente de Evaluación de Proyectos</span>
            </h1>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Retail food · Chile · MBA UAH 2026
            </p>
          </div>
        </motion.div>

        <motion.nav
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-1 rounded-full border border-border/50 bg-card/60 p-1 backdrop-blur"
        >
          {navItems.map((item, i) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all relative ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-glow-orange'
                    : 'text-foreground/70 hover:bg-secondary'
                }`
              }
              style={{ transitionDelay: `${i * 30}ms` }}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </NavLink>
          ))}
        </motion.nav>
      </header>

      <main className="relative flex-1 overflow-hidden">
        <Routes>
          <Route path="/intro" element={<Intro />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>

      <footer className="border-t border-border/40 bg-card/40 px-6 py-1.5 text-[10px] text-muted-foreground backdrop-blur">
        Datos: <span className="font-medium text-foreground/80">INE</span> · CASEN · Metro Santiago · SECTRA EOD 2012 · Procafé · OpenStreetMap (live) · BCN
      </footer>
    </div>
  );
}
