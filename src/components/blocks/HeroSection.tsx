import { Link } from 'react-router-dom';
import { AnimatedGroup } from '@/components/ui/animated-group';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Sparkles, MapPin, Coffee } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { motion } from 'framer-motion';

const transitionVariants = {
  item: {
    hidden: { opacity: 0, filter: 'blur(12px)', y: 12 },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: { type: 'spring' as const, bounce: 0.3, duration: 1.5 },
    },
  },
};

const stats = [
  { value: '34', label: 'Comunas RM' },
  { value: '62', label: 'Estaciones Metro' },
  { value: '7', label: 'Fuentes reales' },
  { value: '39', label: 'Tests financieros' },
];

const sources = [
  { name: 'INE', label: 'Censo + Proyección 2024' },
  { name: 'CASEN', label: 'MDS 2022' },
  { name: 'Metro', label: 'Memoria 2023' },
  { name: 'SECTRA', label: 'EOD 2012' },
  { name: 'OSM', label: 'Overpass live' },
  { name: 'Procafé', label: 'Consumo Chile' },
  { name: 'BCN', label: 'Comunas geo' },
  { name: 'CARTO', label: 'Voyager tiles' },
];

export function HeroSection() {
  const setLocation = useProjectStore((s) => s.setLocation);
  const setRadius = useProjectStore((s) => s.setRadius);

  const presetLasCondes = () => {
    setLocation({ lat: -33.4181, lng: -70.6018, label: 'Tobalaba, Las Condes' });
    setRadius(500);
  };

  return (
    <main className="relative overflow-hidden">
      {/* Section: hero */}
      <section>
        <div className="relative pt-12 md:pt-20">
          {/* Background radial fade */}
          <div className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,hsl(var(--background))_75%)]" />

          {/* Ambient blobs */}
          <div className="pointer-events-none absolute -top-32 -left-32 -z-10 h-96 w-96 rounded-full bg-orange-500/20 blur-3xl animate-blob-drift" />
          <div className="pointer-events-none absolute -top-20 right-0 -z-10 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl animate-blob-drift" style={{ animationDelay: '6s' }} />

          <div className="mx-auto max-w-5xl px-6">
            <AnimatedGroup
              variants={{
                container: {
                  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.25 } },
                },
                ...transitionVariants,
              }}
              className="text-center"
            >
              {/* Badge */}
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs font-medium backdrop-blur shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                <span>MBA UAH 2026 · Evaluación de Proyectos</span>
                <span className="rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">v1</span>
              </div>

              <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                Evalúa tu próximo café <br className="hidden md:block" />
                en cualquier punto de <span className="gradient-text">Chile</span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
                Selecciona un punto en el mapa y obtén demografía INE/CASEN, competencia OSM en vivo,
                modelo financiero VAN/TIR/payback y sensibilización ±20% — todo con datos reales y exportable a Word/Excel.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <div className="rounded-[14px] border border-border/60 bg-foreground/[0.04] p-0.5 shadow-glow-orange">
                  <Link to="/" onClick={presetLasCondes}>
                    <Button size="lg" className="rounded-xl px-5 text-base bg-gradient-to-r from-orange-500 to-rose-500 hover:opacity-90">
                      <MapPin className="h-4 w-4" />
                      <span className="text-nowrap">Probar con Las Condes</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <Link to="/">
                  <Button size="lg" variant="ghost" className="h-[42px] rounded-xl px-5 text-base">
                    <span className="text-nowrap">Abrir dashboard</span>
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-xl border border-border/60 bg-card/60 backdrop-blur px-3 py-2.5">
                    <div className="text-xl font-bold tabular gradient-text">{s.value}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
            </AnimatedGroup>
          </div>

          {/* Hero image */}
          <AnimatedGroup
            variants={{
              container: {
                visible: { transition: { staggerChildren: 0.05, delayChildren: 0.75 } },
              },
              ...transitionVariants,
            }}
          >
            <div className="relative -mr-56 mt-10 overflow-hidden px-2 sm:mr-0 sm:mt-14 md:mt-16">
              <div
                aria-hidden
                className="absolute inset-0 z-10 bg-gradient-to-b from-transparent from-35% to-background"
              />
              <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-border/60 bg-card p-3 shadow-2xl shadow-orange-500/10 ring-1 ring-border/40">
                <img
                  src="/hero/dashboard-light.png"
                  alt="Dashboard del Agente — sensibilidad y mapa"
                  className="aspect-[15/8] w-full rounded-xl object-cover object-top"
                  width={2700}
                  height={1440}
                  loading="eager"
                />
                {/* Floating chips over hero image */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute left-6 top-6 hidden md:flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-green-700 dark:text-green-400 shadow-lg"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                  </span>
                  Datos en vivo · Overpass + Nominatim
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.6, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-6 top-6 hidden md:flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-orange-700 dark:text-orange-300 shadow-lg"
                >
                  <Coffee className="h-3.5 w-3.5" />
                  VAN · TIR · Payback · Sensibilización
                </motion.div>
              </div>
            </div>
          </AnimatedGroup>
        </div>
      </section>

      {/* Section: data sources */}
      <section className="bg-background/50 pb-20 pt-16 md:pb-32">
        <div className="group relative m-auto max-w-5xl px-6">
          <div className="absolute inset-0 z-10 flex scale-95 items-center justify-center opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100">
            <Link
              to="/settings"
              className="block rounded-full bg-card/80 px-4 py-2 text-sm font-medium backdrop-blur shadow-lg duration-150 hover:opacity-90"
            >
              <span>Ver detalle de fuentes</span>
              <ArrowRight className="ml-1 inline-block size-3" />
            </Link>
          </div>
          <p className="text-center text-xs uppercase tracking-wider text-muted-foreground">
            Datos reales públicos · 0 demos
          </p>
          <div className="group-hover:blur-[2px] mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 transition-all duration-500 group-hover:opacity-50 sm:grid-cols-4">
            {sources.map((s) => (
              <div
                key={s.name}
                className="rounded-xl border border-border/60 bg-card/60 backdrop-blur px-3 py-3 text-center transition hover:border-orange-500/40 hover:shadow-glow-orange"
              >
                <div className="text-sm font-bold tracking-tight">{s.name}</div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
