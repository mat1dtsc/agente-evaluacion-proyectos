# Agente de Evaluación de Proyectos · Retail Food Chile

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![deck.gl](https://img.shields.io/badge/deck.gl-9.x-000?logo=mapbox&logoColor=white)](https://deck.gl/)
[![Tests](https://img.shields.io/badge/tests-179%20passing-22c55e)](#)
[![Lint](https://img.shields.io/badge/eslint-0%20warnings-22c55e)](#)
[![License](https://img.shields.io/badge/license-Academic-orange)](#)

SPA en React para evaluar **proyectos retail food en cualquier punto de Chile** combinando capas geográficas reales, modelo financiero a 60 períodos mensuales, marco normativo chileno, un **asesor IA** y exportadores Word/Excel/PDF profesionales.

Construido como herramienta del curso **Evaluación de Proyectos** del MBA UAH 2026 (prof. Mauricio Zúñiga). El primer caso de uso es un café express con combo único, pero la herramienta es **genérica para cualquier retail food**: el catálogo incluye 13 formatos precargados en 7 rubros (café, comida rápida, heladería, panadería, restaurante, sushi, jugería).

---

## ✨ Demo

| Vista | Captura |
|---|---|
| Dashboard 3D con polígonos OSM reales | `screenshots/real-08-3d-real-shapes.png` |
| Heatmap peatonal reactivo a hora del día | `screenshots/integrated-02-heatmap-rm.png` |
| 222 rutas RED Movilidad | `screenshots/paths-01-metro-vehicular.png` |
| Panel financiero animado | `screenshots/11-financiero-animado.png` |

---

## 🚀 Cómo correr

```bash
npm install
npm run dev          # http://localhost:5173 — SPA con HMR
npm run build        # producción → dist/
npm run preview      # http://localhost:4173 — sirve el build
npm test             # 179 tests (Vitest)
npm run test:watch   # modo watch
npm run lint         # eslint, 0 warnings tolerados
```

## 🛠 Stack

| Capa | Librerías |
|---|---|
| **Build** | Vite 5 + React 18 + TypeScript strict |
| **Estilos** | Tailwind CSS + design tokens propios (graphite + Food Delivery palette) |
| **Mapa 3D** | deck.gl (TileLayer + GeoJsonLayer + PathLayer + HeatmapLayer + ScatterplotLayer) |
| **Tile basemap** | CartoDB Voyager (claro) / Dark Matter (oscuro) |
| **Datos** | TanStack Query (cache + retries) + Zustand (state global con persist) |
| **Charts** | Recharts (curvas suavizadas spline natural) |
| **Animaciones** | framer-motion v12 (Expo.out cubic-bezier) + react-countup |
| **Tests** | Vitest + @testing-library/react |
| **Export** | SheetJS (xlsx con fórmulas vivas) + docx (informe 18 secciones) |
| **Geocoder** | Nominatim (OSM público) |
| **Live data** | Overpass API (cafés, paraderos, vías, equipamiento, rutas RED) |

## 🗺 Funcionalidad

### Dashboard (`/`)
**Mapa interactivo en 3D** (deck.gl) sobre tile CartoDB. Vista 2D plana o 3D inclinada (toggle). 9 capas conmutables:

| Capa | Origen | Tipo |
|---|---|---|
| Densidad poblacional | INE Censo 2017 + Proyección 2024 | Choropleth teal extruido (3D opcional) |
| Ingreso medio | CASEN 2022 | Choropleth violet |
| Heatmap peatonal | OSM Overpass live ~5000 paraderos RM | HeatmapLayer (intensidad reactiva a hora) |
| Red vial principal | OSM live | PathLayer con grosor por jerarquía |
| Metro | Memoria Metro 2023 + OSM | PathLayer 7 líneas reales (L1-L6 + L4A) + 128 estaciones con bordes color |
| Paraderos RED | OSM live | ScatterplotLayer cyan |
| Competencia (cafés) | OSM live | ScatterplotLayer amber con heurística cadena/independiente |
| Equipamiento urbano | OSM RM live | ScatterplotLayer color por categoría |
| Rutas RED Movilidad | OSM `route=bus` | PathLayer 222 rutas, 26 operadores, 8.304 segments |

**Filtro temporal** (sidebar): tabs L-V/Sáb/Dom + slider hora 6-23 + mini-histograma bimodal. La intensidad del heatmap se modula en vivo.

**Pestañas laterales** (con animaciones framer-motion + sincronización bidireccional con el mapa):

1. **Demografía** — header serif "Providencia" + score ring SVG con breakdown de 5 dimensiones + 6 micro-KPIs grid + pirámide etaria + ranking top 6 comunas RM con progress bars
2. **Flujos** — control temporal in-panel + 2 KPIs vivos (peatonal/vehicular ahora) + curvas spline reactivas con día activo destacado y línea vertical en hora actual + paraderos en radio
3. **Competencia** — total + cadena/independiente donut + lista ordenada por distancia (Starbucks, Café Haití, Tavelli, Pascucci...)
4. **Demanda** — 3 factores editables (residentes activos, flujo/paradero, captura Metro) + 3 escenarios pesimista/base/optimista + benchmarks Procafé
5. **Financiero** — 6 KPIs animados (CountUp) + cashflow chart + sparkline mensual a 60 períodos con marca de payback + tablas flujo puro/inversionista + assumptions inline + export Word/Excel/PDF
6. **Sensibilidad** — tornado animado ±20% sobre 6 variables + heatmap precio×demanda + **simulación Monte Carlo** (2.000 iteraciones con shocks conjuntos en demanda/precio/costo → P(VAN>0) y percentiles P5/P50/P95)
7. **Comparar** — las 7 zonas RM lado a lado (score, VAN, TIR, payback, veredicto), ganadora destacada y sensible al escenario; click carga la zona en Financiero
8. **Asesor IA** — recomendación ejecutiva (veredicto, fortalezas, riesgos, drivers, siguiente paso) sobre el caso actual. **Híbrido**: función serverless con Claude (API key server-side) + fallback determinístico por reglas que funciona sin API key

> **Rutas:** la app es de página única. Las rutas antiguas (`/intro`, `/reports`, `/settings`) ahora redirigen al Dashboard (`/`); sus funciones (exportes, modo claro/oscuro, fuentes) viven integradas en las pestañas y el header.

## 🤖 Asesor IA (`src/lib/advisor/` + `api/asesor.ts`)

El Asesor lee el contexto completo de la evaluación (ubicación, score geográfico, finanzas VAN/TIR/payback, competencia, demanda y drivers de sensibilidad) y redacta una recomendación ejecutiva. Arquitectura **híbrida**:

- **Con API key:** la función serverless `api/asesor.ts` (Vercel) llama a Claude con la `ANTHROPIC_API_KEY` guardada **server-side** (nunca expuesta al navegador) y devuelve la recomendación.
- **Sin API key / en `vite dev`:** el hook `useAdvisor` cae automáticamente al **motor determinístico** (`deterministic.ts`), que produce el mismo informe estructurado por reglas — sin costo, sin key y reproducible.

Para habilitar la IA: copia `.env.example` a `.env.local` y define `ANTHROPIC_API_KEY` (y en Vercel, en *Project Settings → Environment Variables*).

## 🍔 Catálogo multi-rubro (`src/lib/finance/sectores.ts`)

13 formatos retail food precargados con inversión desglosada, planilla con leyes sociales chilenas, demanda (pesimista/base/optimista), financiamiento y fuentes — agrupados por categoría en el onboarding (`SectorSelector`). Cubre café (7 formatos), comida rápida, heladería, panadería, restaurante, sushi y jugería.

## 💰 Modelo financiero (`src/lib/finance/`)

Estructura del flujo según curso EVP UAH (Mauricio Zúñiga):

```
+ Ingresos afectos
- Costos variables (insumos)
- Costos fijos no laborales (arriendo, servicios)
- Costo personal con leyes sociales chilenas
- Costos normativos prorrateados
- Depreciación lineal SLN
- Intereses deuda (solo flujo inversionista)
= UAI
- Impuesto (con crédito tributario acumulado, Caso 1 nueva empresa)
= UDI
+ Reversión depreciación
- Inversión + capital trabajo (mes 0) + permisos iniciales
+ Recupero CT + Valor residual neto + Valor terminal perpetuidad creciente (último mes)
+ Préstamo (mes 0) - Amortización francesa (cuotas mensuales)
= Flujo neto de caja
```

### API pública

| Función | Descripción |
|---|---|
| `npv(cashflows, rate)` | VAN clásico |
| `irr(cashflows)` | TIR con Newton-Raphson + bisección fallback |
| `payback(cashflows)` | Período de recuperación interpolado |
| `amortFrances(P, i, n)` | Tabla amortización francesa |
| `buildPureFlow(inputs)` | Flujo puro anual con perpetuidad steady-state |
| `buildInvestorFlow(inputs)` | Flujo inversionista con escudo tributario |
| `buildMonthlyFlow(inputs)` | Flujo mensual a 60 períodos + agregación anual |
| `breakeven(inputs)` | Demanda mínima diaria para VAN=0 |
| `runSensitivity(inputs)` | Sensibilidad ±10/20% sobre 6 variables |
| `computeCostoLaboral(cargo)` | Costo total empresa con AFC + SIS + Mutual + gratificación + provisiones |
| `regimenTributarioSugerido(ventas)` | Pro PYME 14D N°3 (25%) o General (27%) según UF |

Los tests de lógica financiera cubren: NPV, IRR, payback, amortización francesa, flujos puro/inversionista, breakeven, sensibilidad, planilla con leyes sociales, normativas, monthlyFlow con tasa mensual equivalente, perpetuidad steady-state, crédito tributario acumulado.

## 📋 Marco normativo chileno

`src/lib/finance/normativas.ts` documenta 17 normativas con base legal:
- **SII**: inicio actividades, IRPC Pro PYME, PPM, IVA 19%
- **SEREMI Salud**: informe sanitario, manipulador alimentos (DS 977/96), curso obligatorio
- **Municipalidad**: patente comercial, basura, publicidad
- **DT**: contratos, gratificación Art. 50 CT, IAS Art. 163
- **AFC + Mutual Ley 16.744**

`src/lib/finance/personal.ts` calcula **costo total empresa** con cargas patronales chilenas:
- AFC empleador 2.4% (indefinido) o 3% (plazo fijo)
- SIS 1.85%, Mutual 0.95%
- Gratificación 25% bruto con tope 4.75 IMM ($2.425.521 anuales 2025)
- Provisión vacaciones 8.33% + indemnización 8.33%
- Factor empresa típico: 1.45-1.50x para sueldos medios

## 🌐 Fuentes de datos

| Estado | Fuentes |
|---|---|
| **REAL — pre-procesado** | INE Censo+Proyección 2024, CASEN 2022, Metro Memoria 2023 (62 estaciones), 7 líneas Metro reales, 222 rutas RED Movilidad, BCN comunas (34 polígonos OSM), Procafé consumo, SECTRA EOD 2012 perfil horario |
| **REAL — live (Overpass)** | Cafés competencia, paraderos RED, vías troncales/principales, hospitales/universidades/colegios/malls, oficinas/empresas |
| **REAL — geocoder** | Nominatim (countrycodes=cl) |

`scripts/etl/MOVILIDAD.md` documenta el roadmap completo de fuentes oficiales chilenas (DTPM CSV subidas/bajadas, GTFS RED, Movilidad Abierta MTT, EOD SECTRA crudo, IDE-Chile WFS, UOCT histórico) con instrucciones de incorporación.

`scripts/etl/SOURCES.md` lista cada dataset con `_source` / `_url` / `_retrieved` / `_license` / `_isDemo`.

## 📤 Exportadores

### Word (18 secciones)
1. Resumen ejecutivo · 2. Contexto y oportunidad · 3. Marco normativo (tabla 17 normativas) · 4. Estudio de mercado · 5. Localización · 6. Estudio técnico (8 activos depreciables vida útil SII) · 7. Estructura organizacional + planilla con factor 1.47x · 8. Plan de inversiones · 9. Estructura de costos · 10. Tributación Pro PYME · 11. Financiamiento · 12. Flujo puro · 13. Flujo inversionista · 14. Resumen mensual 60 períodos · 15. Indicadores · 16. Sensibilidad · 17. Riesgos cualitativos · 18. Conclusiones + Anexos

### Excel (8 hojas con fórmulas vivas)
- **Inputs** · **FlujoPuro** + **FlujoInversionista** (`=NPV()`, `=IRR()`, `=CUMIPMT()`, `=CUMPRINC()`) · **KPIs** · **Personal** (cargas patronales) · **Normativas** (régimen tributario) · **FlujoMensual** (60 períodos) · **IVA** (Form 29 separado) · **Sensibilidad**

Modificar un input recalcula VAN/TIR automáticamente.

## ⚙ Performance

`vite.config.ts` con `manualChunks`:
- `deck-gl` 785 KB · `export` (xlsx + docx) 634 KB · `charts` 568 KB · `index` 213 KB · `animation` 128 KB · `data-fetching` 46 KB

Lazy-load: `bus_red_movilidad.json` (2.7 MB) sólo se descarga al activar la capa.

Cache headers en `vercel.json`: `/data/*` 1 día stale-while-revalidate, `/assets/*` 1 año immutable.

## 📐 Cómo agregar comunas

1. Agrega Feature al `public/data/comunas_chile.geojson` con `properties: {codigo, nombre, region, areaKm2}` y `geometry: Polygon`
2. Agrega entrada al `public/data/densidad_ine_2024.json` con el mismo `codigo`
3. Agrega entrada al `public/data/casen_2022_comuna.json`
4. Recarga — capas y paneles se alimentan automáticamente

## 🧪 Tests

```bash
npm test            # corre 179 tests, salida coloreada
npm run test:watch  # modo watch
npm run lint        # eslint 9 (flat config), --max-warnings 0
```

**Cobertura (179 tests en 28 archivos):**

- **Finanzas** — NPV, IRR, payback, amortización francesa, flujos puro/inversionista, breakeven, sensibilidad, Monte Carlo, planilla con leyes sociales chilenas, normativas, flujo mensual con tasa equivalente, perpetuidad steady-state, crédito tributario acumulado.
- **Asesor y comparador** — motor determinístico de reglas, construcción del contexto, comparación de zonas.
- **Paneles** — render con y sin ubicación, selección de zona, botones de export, el comparador abriendo una zona en Financiero, y el Asesor cayendo al motor de reglas cuando el endpoint responde 503.
- **Hooks** — modelo financiero, score geográfico, geocoder, datasets, asesor.

Tres de los tests son de regresión de bugs reales: el orden de hooks en `DemandPanel` (crasheaba el panel al limpiar la ubicación), el foco del input en `AssumptionsPanel` y el cambio de pestaña en `Tabs`.

## ⚡ Rendimiento

La carga inicial es de **373 kB de JS** (125 kB gzip). El mapa (deck.gl), los gráficos (recharts) y los exportadores (xlsx + docx + jspdf, ~1 MB juntos) viven detrás de `import()` dinámico: cada pestaña y cada botón de export baja su chunk cuando se usa, no en el arranque.

## 🔄 CI

`.github/workflows/ci.yml` corre lint + tests + build en cada push a `main` y en cada pull request.

## 🚢 Deploy

```bash
# Vercel (recomendado): conectar repo en vercel.com/new → autodetecta Vite
# o vía CLI:
npm i -g vercel && vercel --prod
```

`vercel.json` ya tiene SPA rewrites + cache headers configurados.

## 📄 Licencia

Código: uso académico (MBA UAH 2026).

Datos:
- INE, MDS CASEN, Metro Santiago, SECTRA, Procafé: cifras públicas con atribución
- OpenStreetMap: [ODbL](https://opendatacommons.org/licenses/odbl/)
- CartoDB tiles: [CC BY 3.0](https://carto.com/attributions/)

---

**Construido para el curso EVP del MBA UAH 2026** · prof. Mauricio Zúñiga
