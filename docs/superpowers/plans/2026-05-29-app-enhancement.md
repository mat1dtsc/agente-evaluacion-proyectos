# App Enhancement Implementation Plan — Agente de Evaluación de Proyectos

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Calibration note:** This plan is written for an executor that has the codebase loaded in context. Interface-locking parts (new types, the serverless function, the deterministic advisor engine, config changes, key test cases) are given as complete code. UI components are specified by props/structure/behavior and the existing pattern to follow (match the Tailwind + framer-motion idiom already in `src/components/`), rather than duplicating full JSX. Match the comment density and naming of surrounding code.

**Goal:** Turn the café-only evaluation app into a generic retail-food evaluator with an AI advisor, a multi-location comparator, and production-grade polish — without breaking the existing 64 passing tests or the Vercel deploy.

**Architecture:** Four independent features layered on the existing React 18 + Vite + Zustand + deck.gl SPA. The financial/scoring engines (`cafeModel.ts`, `score.ts`, `sectores.ts`) are reused as-is; new code plugs into the existing `projectStore` and the `Dashboard` tab system. The AI advisor is a Vercel serverless function holding the API key server-side, with a deterministic rule-based engine as an always-available fallback (and the only path in local `vite dev`).

**Tech Stack:** React 18, TypeScript strict, Vite 5, Zustand (persist), Recharts, framer-motion, Vitest, `@anthropic-ai/sdk` (new, serverless only), `jspdf` + `jspdf-autotable` (new, PDF export).

---

## Conventions & Verification Gates

- **Money/rates:** CLP integers, rates as decimals (0.14 = 14%) — match `types.ts`.
- **Tests:** Vitest. Pure logic (finance, scoring, advisory rules, Monte Carlo) is TDD: write failing test → run → implement → pass → commit. UI gets a smoke render test where practical.
- **Commit cadence:** one commit per task. Conventional commits in Spanish to match repo history (`feat:`, `fix:`, `test:`, `docs:`, `refactor:`).
- **Gate after every feature:** `npm test` (all green) AND `npm run build` (tsc + vite, no errors) AND `npm run lint` (0 warnings — repo uses `--max-warnings 0`). Do not start the next feature until the gate passes.
- **Branch:** work on a feature branch off `main` (`feat/app-enhancement`), not on `main` directly.

---

## Feature 1 — Multi-rubro retail food

**Why:** `sectores.ts` header says "EXCLUSIVAMENTE café" but README promises "genérico para cualquier retail food." Resolve the contradiction by making it actually generic. The `SectorPreset` / `applySectorToInputs` infra is already generic — we add a category field, new non-café presets, and group the selector UI.

**File structure:**
- Modify: `src/lib/finance/sectores.ts` — add `categoria` to `SectorPreset`, tag the 7 café presets, append new non-café presets, fix header comment.
- Modify: `src/components/panels/SectorSelector.tsx` — group grid by category with a category filter; update copy ("retail food", not "café").
- Create: `src/lib/finance/__tests__/sectores.test.ts` — sanity tests for every preset.
- Modify: `README.md` — align the "genérico" claim with reality; update the SectorSelector count.

- [ ] **Task 1.1 — Add category to the type + tag café presets**

In `sectores.ts`, extend the interface and the risk→Tcc helper stays as-is:

```ts
export type CategoriaRubro =
  | 'cafe' | 'comida_rapida' | 'heladeria' | 'panaderia'
  | 'restaurante' | 'sushi' | 'jugueria' | 'pizzeria';

export const CATEGORIA_META: Record<CategoriaRubro, { label: string; emoji: string }> = {
  cafe:         { label: 'Café',          emoji: '☕' },
  comida_rapida:{ label: 'Comida rápida', emoji: '🍔' },
  heladeria:    { label: 'Heladería',     emoji: '🍦' },
  panaderia:    { label: 'Panadería',     emoji: '🥖' },
  restaurante:  { label: 'Restaurante',   emoji: '🍽️' },
  sushi:        { label: 'Sushi',         emoji: '🍣' },
  jugueria:     { label: 'Jugería / Saludable', emoji: '🥤' },
  pizzeria:     { label: 'Pizzería',      emoji: '🍕' },
};
```

Add `categoria: CategoriaRubro;` to `SectorPreset`. Set `categoria: 'cafe'` on the 7 existing presets. Replace the header comment's "EXCLUSIVAMENTE cafetero / No incluye otros rubros" with an accurate description (catálogo genérico retail food, café is the first vertical).

- [ ] **Task 1.2 — Append new non-café presets (real Chile 2024-25 figures)**

Append at least 6 presets covering other categories, each with the full `SectorPreset` shape (inversión desglose with `vidaUtilSII`, operación, personal with Chilean `sueldoBrutoMensual`, demanda pesimista/base/optimista, financiamiento, `fuentes`). Minimum set: `comida_rapida` (hamburguesería de barrio), `heladeria` (artesanal), `panaderia` (boutique + cafetería), `restaurante` (casual ~40 cubiertos), `sushi` (delivery-first), `jugueria` (saludable to-go). Use defensible HORECA Chile equipment costs and `riesgo` 2–5 driving `TCC_POR_RIESGO`. Keep numbers internally consistent (the existing `applySectorToInputs` will derive inputs from them — no new math needed). Cite sources in `fuentes` (Achiga, sector studies, supplier catalogs).

- [ ] **Task 1.3 — Tests for presets**

`src/lib/finance/__tests__/sectores.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { SECTORES_RETAIL_FOOD, applySectorToInputs, inversionTotal } from '../sectores';

describe('SECTORES_RETAIL_FOOD catálogo', () => {
  it('tiene ids únicos', () => {
    const ids = SECTORES_RETAIL_FOOD.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('cubre más de un rubro (ya no es café-only)', () => {
    const cats = new Set(SECTORES_RETAIL_FOOD.map((s) => s.categoria));
    expect(cats.size).toBeGreaterThan(1);
    expect(cats.has('cafe')).toBe(true);
  });
  it.each(SECTORES_RETAIL_FOOD.map((s) => [s.id, s] as const))(
    'preset %s es coherente', (_id, s) => {
      expect(inversionTotal(s)).toBeGreaterThan(0);
      expect(s.operacion.ticketPromedio).toBeGreaterThan(s.operacion.costoVariableUnitario);
      expect(s.demanda.pesimista).toBeLessThanOrEqual(s.demanda.base);
      expect(s.demanda.base).toBeLessThanOrEqual(s.demanda.optimista);
      expect(s.personal.length).toBeGreaterThan(0);
      const inputs = applySectorToInputs(s);
      expect(inputs.inversionInicial).toBe(inversionTotal(s));
      expect(inputs.ticketPromedio).toBe(s.operacion.ticketPromedio);
    },
  );
});
```

Run `npm test -- sectores` → expect all pass. Commit.

- [ ] **Task 1.4 — Group SectorSelector by category**

Add a category filter row (chips from `CATEGORIA_META`, plus "Todos") above the grid; filter `SECTORES_RETAIL_FOOD` by selected category with `useState<CategoriaRubro | 'todos'>('todos')`. Update header copy from "tu cafetería / formatos de café" to "tu proyecto retail food / formatos". Keep the existing card markup, animations, detail card, and `handleApply` unchanged. Add a smoke test `SectorSelector.test.tsx` (render, assert a non-café label like "Heladería" appears). Gate (test+build+lint). Commit.

- [ ] **Task 1.5 — README alignment**

Update README: reflect multi-rubro reality, the new preset count, and remove the now-false café-only framing in the relevant sections. Note the routing change (`/intro`, `/reports`, `/settings` now redirect to `/`). Commit `docs:`.

---

## Feature 2 — Comparador de ubicaciones

**Why:** `projectStore` already has `selectedLocationId` "para el panel comparativo"; `cafeModel.ts` already exposes `calcularTodas()`, `scoreUbicacion()`, `veredicto()`. We surface a side-by-side comparison and let the user pin arbitrary evaluated locations.

**File structure:**
- Create: `src/lib/compare/comparison.ts` — pure builder of comparison rows from zone results + saved user locations.
- Create: `src/lib/compare/__tests__/comparison.test.ts`.
- Modify: `src/store/projectStore.ts` — add `savedLocations: SavedLocation[]` + actions, persisted.
- Create: `src/components/panels/ComparadorPanel.tsx` — the comparison table/cards UI.
- Modify: `src/pages/Dashboard.tsx` — add a `comparar` tab; wire the panel.
- Modify: `src/store/projectStore.ts` `activeTab` union — add `'comparar'`.

- [ ] **Task 2.1 — Store: saved locations (TDD-lite via store unit test)**

Add to `projectStore.ts`:

```ts
export interface SavedLocation {
  id: string;            // crypto.randomUUID()
  label: string;         // e.g. "El Golf · Las Condes"
  lat: number; lng: number;
  scoreGeo: number;      // 0-100 from computeScore
  van: number; tir: number; payback: number;
  zoneId?: string;       // if it maps to a cafeModel UBICACION
  savedAt: number;
}
```
Add state `savedLocations: SavedLocation[]` (default `[]`), actions `saveLocation(loc: Omit<SavedLocation,'id'|'savedAt'>)`, `removeSavedLocation(id)`, `clearSavedLocations()`. Add `savedLocations` to the `partialize` persist allowlist. Extend the `activeTab` union with `'comparar'`.

- [ ] **Task 2.2 — Comparison builder (TDD)**

`src/lib/compare/comparison.ts`:

```ts
import { calcularTodas, scoreUbicacion, veredicto, type Escenario } from '@/lib/finance/cafeModel';

export interface CompareRow {
  id: string;
  label: string;
  comuna?: string;
  scoreFinanciero: number;   // scoreUbicacion 0-100 (zones) or derived
  van: number; tir: number; payback: number;
  veredicto: string;
  esGanadora: boolean;
}

/** Comparison of all 7 pre-evaluated zones for the given escenario, sorted by VAN desc. */
export function compareZones(escenario: Escenario = 'conservador'): CompareRow[] { /* ... */ }
```
Implementation maps `calcularTodas(escenario)` → rows using `scoreUbicacion(r, escenario)`, `r.base.{van,tir,payback}`, `veredicto(r).texto`; sort by `van` desc; mark `esGanadora` on the top row (only if its `van > 0`).

Test `comparison.test.ts`: assert 7 rows, sorted descending by van, exactly one `esGanadora` when any van>0, and that ids are unique. Run `npm test -- comparison`. Commit.

- [ ] **Task 2.3 — ComparadorPanel UI**

Card list / responsive table comparing zones (from `compareZones(escenarioActivo)`) and any `savedLocations`. Columns: label, score (use existing `ScoreRing` or a compact bar), VAN (`formatCLP`), TIR (`formatPct`), payback, veredicto chip (color via tono). Highlight the winner row (ring + "🏆 Ganadora"). Clicking a zone row calls `setSelectedLocationId(zoneId)` + `setActiveTab('financiero')` to drill in. Include a "Limpiar guardadas" button when `savedLocations.length > 0`. Follow the framer-motion stagger pattern used in `DemographicsPanel`/`SectorSelector`. Smoke test: render with default store, assert winner badge present.

- [ ] **Task 2.4 — "Guardar ubicación" action + Dashboard tab**

Add a small "Guardar para comparar" button in the existing location/financial flow (where `location` + score + financials are available — e.g. in `FinancialPanel` header or near the geocoder result) that builds a `SavedLocation` from current `computeScore` inputs + `useFinancialModel()` outputs and calls `saveLocation`. Add the `comparar` tab to `Dashboard.tsx`'s tab list (icon: `lucide-react` `Scale` or `Columns3`) rendering `<ComparadorPanel/>`. Gate (test+build+lint). Commit.

---

## Feature 3 — Asesor IA (serverless + deterministic fallback)

**Why:** the app is named "Agente de evaluación" but today is a calculator. Add an advisor that reads the full evaluation context and renders an executive recommendation. Hybrid: Vercel function with server-side key for real Claude prose; deterministic engine as fallback (and the local-dev path).

**File structure:**
- Create: `src/lib/advisor/context.ts` — `buildAdvisorContext(...)` gathers a serializable snapshot.
- Create: `src/lib/advisor/deterministic.ts` — `deterministicAdvisory(context)` rule engine.
- Create: `src/lib/advisor/types.ts` — shared `AdvisorContext` + `AdvisoryReport`.
- Create: `src/lib/advisor/__tests__/deterministic.test.ts`.
- Create: `api/asesor.ts` — Vercel serverless function (Node runtime).
- Create: `src/hooks/useAdvisor.ts` — calls `/api/asesor`, falls back to deterministic on non-200.
- Create: `src/components/panels/AsesorPanel.tsx` — the advisor UI.
- Modify: `src/pages/Dashboard.tsx` + `activeTab` union — add `'asesor'` tab.
- Modify: `vercel.json` — exclude `/api` from the SPA rewrite.
- Modify: `package.json` — add `@anthropic-ai/sdk` dep.
- Create: `.env.example` — document `ANTHROPIC_API_KEY`.

- [ ] **Task 3.1 — Shared advisor types**

`src/lib/advisor/types.ts`:

```ts
export interface AdvisorContext {
  proyecto: string;
  ubicacion: { label: string; comuna?: string; lat: number; lng: number } | null;
  scoreGeo: { total: number; densidad: number; ingreso: number; transporte: number; competencia: number; equipamiento: number } | null;
  finanzas: { vanPuro: number; tirPuro: number; paybackPuro: number; vanInv: number; tirInv: number; breakevenCombosDia: number; tcc: number };
  competencia: { totalCafes: number } | null;
  demanda: { combosDiaBase: number; ticket: number } | null;
  sensibilidadTop: Array<{ variable: string; impactoVan: number }>;
  escenario: string;
}

export interface AdvisoryReport {
  veredicto: 'Recomendado' | 'Aceptable con riesgo' | 'No conviene';
  resumen: string;
  fortalezas: string[];
  riesgos: string[];
  drivers: string[];
  siguientePaso: string;
  fuente: 'ia' | 'reglas';
}
```

- [ ] **Task 3.2 — Deterministic advisory engine (TDD)**

`deterministic.ts`: `deterministicAdvisory(ctx: AdvisorContext): AdvisoryReport` with `fuente: 'reglas'`. Rules (derive verdict from thresholds, no LLM):
- verdict: `Recomendado` if `vanPuro>0 && tirPuro>tcc && paybackPuro<=4 && (scoreGeo?.total ?? 60)>=65`; `No conviene` if `vanPuro<=0 || tirPuro<tcc`; else `Aceptable con riesgo`.
- fortalezas/riesgos: push human-readable strings from the strong/weak dimensions (e.g. VAN positivo y monto, TIR vs Tcc spread, score de transporte alto, competencia saturada, payback largo, ingreso bajo for premium ticket).
- drivers: top 3 from `sensibilidadTop` by `abs(impactoVan)`.
- siguientePaso: actionable line keyed to the verdict.

Test `deterministic.test.ts`: a clearly-good context → `Recomendado` with non-empty fortalezas; a negative-VAN context → `No conviene` with a risk mentioning VAN; drivers length ≤ 3 and sorted by |impacto|. Run `npm test -- deterministic`. Commit.

- [ ] **Task 3.3 — buildAdvisorContext**

`context.ts`: `buildAdvisorContext(args)` assembles `AdvisorContext` from store + hook outputs (project name, location, `computeScore` breakdown if geo inputs available, `useFinancialModel` outputs incl. `tcc` from `cafeModel.TCC` or inputs, sensitivity mapped to `{variable, impactoVan}` sorted desc). Pure function (inputs passed in, not hooks) so it's unit-testable and reusable by the panel. Add a minimal test that it produces a well-formed context from sample inputs.

- [ ] **Task 3.4 — Serverless function**

`api/asesor.ts` (Vercel Node function — runs only on Vercel / `vercel dev`, never bundled into the client):

```ts
import Anthropic from '@anthropic-ai/sdk';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: 'no_key' }); // client → deterministic fallback
  try {
    const ctx = req.body; // AdvisorContext
    const client = new Anthropic({ apiKey: key });
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 900,
      system:
        'Eres un asesor de evaluación de proyectos retail food en Chile (marco MBA UAH). ' +
        'Devuelves SOLO JSON válido con las claves: veredicto ("Recomendado"|"Aceptable con riesgo"|"No conviene"), ' +
        'resumen (string), fortalezas (string[]), riesgos (string[]), drivers (string[]), siguientePaso (string). ' +
        'Tono ejecutivo, conciso, en español de Chile. Basa todo en los números entregados; no inventes cifras.',
      messages: [{ role: 'user', content: JSON.stringify(ctx) }],
    });
    const text = msg.content.find((c) => c.type === 'text')?.text ?? '{}';
    const parsed = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
    return res.status(200).json({ ...parsed, fuente: 'ia' });
  } catch (e) {
    return res.status(502).json({ error: 'llm_failed' });
  }
}
```

Add `@anthropic-ai/sdk` to `dependencies` and `@vercel/node` to `devDependencies` (types only). Create `.env.example` with `ANTHROPIC_API_KEY=`. **Do not** put the key in any client code or commit a real key.

- [ ] **Task 3.5 — vercel.json: protect /api from SPA rewrite**

Change the rewrite so `/api/*` is not swallowed by the SPA fallback:

```json
"rewrites": [
  { "source": "/((?!api/).*)", "destination": "/index.html" }
]
```
Keep the existing headers block.

- [ ] **Task 3.6 — useAdvisor hook + AsesorPanel + tab**

`useAdvisor.ts`: `requestAdvisory(ctx)` POSTs to `/api/asesor`; on non-200 (incl. 503/local dev) returns `deterministicAdvisory(ctx)`; exposes `{ report, loading, run, fuente }`. `AsesorPanel.tsx`: a "Generar recomendación" button, a loading shimmer, then renders the `AdvisoryReport` — verdict chip (color by tono), resumen, fortalezas/riesgos two-column, drivers list, siguiente paso callout, and a small badge showing `fuente` ("IA" vs "Reglas") so it's honest about provenance. Add `asesor` to `activeTab` union and Dashboard tabs (icon `Sparkles` or `Bot`). Gate (test+build+lint). Commit.

---

## Feature 4 — Pulido + robustez

**File structure:**
- Create: `src/lib/finance/monteCarlo.ts` + `__tests__/monteCarlo.test.ts`.
- Create: `src/components/charts/MonteCarloChart.tsx` (histogram of VAN via Recharts).
- Modify: `src/components/panels/SensitivityPanel.tsx` — add Monte Carlo section.
- Create: `src/lib/export/exportPdf.ts` — PDF informe via `jspdf` + `jspdf-autotable`.
- Modify: `src/components/panels/FinancialPanel.tsx` (or wherever Word/Excel buttons live) — add a "PDF" button.
- Modify: `package.json` — add `jspdf`, `jspdf-autotable`.
- Modify: `vite.config.ts` — add `jspdf` to the `export` manualChunk.
- Modify: `README.md` — document PDF export + Monte Carlo + AI advisor + comparator.

- [ ] **Task 4.1 — Monte Carlo engine (TDD)**

`monteCarlo.ts`:

```ts
import type { ProjectInputs } from '@/lib/finance/types';
export interface MonteCarloResult {
  iterations: number;
  vanMedia: number; vanP5: number; vanP50: number; vanP95: number;
  probVanPositivo: number;        // 0..1
  histogram: Array<{ bin: number; count: number }>;
}
export interface MonteCarloOptions {
  iterations?: number;            // default 2000
  seed?: number;                  // deterministic RNG for reproducible tests
  sigma?: { demanda?: number; precio?: number; costoVar?: number }; // rel. std-dev
}
export function monteCarlo(inputs: ProjectInputs, opts?: MonteCarloOptions): MonteCarloResult;
```
Use a seeded RNG (mulberry32) so tests are deterministic. Each iteration perturbs `combosPorDiaBase`, `ticketPromedio`, `costoVariableUnitario` by a normal draw (Box-Muller) around their value, runs `buildPureFlow`, collects VAN. Compute mean/percentiles/prob>0/histogram.

Test: with seed fixed, `probVanPositivo` is in [0,1], percentiles ordered `p5<=p50<=p95`, histogram counts sum to `iterations`, and running twice with same seed gives identical `vanMedia`. Run `npm test -- monteCarlo`. Commit.

- [ ] **Task 4.2 — MonteCarloChart + SensitivityPanel section**

Recharts `BarChart` of the histogram with a reference line at VAN=0 and a caption showing `P(VAN>0)` and P5/P50/P95. Wire a "Simulación Monte Carlo (2.000 iteraciones)" subsection into `SensitivityPanel` using current `inputs`. Smoke test render. Gate. Commit.

- [ ] **Task 4.3 — PDF export (TDD-lite)**

`exportPdf.ts`: `exportInformePdf(args): void` builds a multi-page PDF (portada con proyecto + fecha, KPIs VAN/TIR/payback, tabla de flujo anual via `jspdf-autotable`, sensibilidad, fuentes/footer). Reuse the same data the Word exporter consumes. Keep it a pure builder returning a `jsPDF` doc + a thin `download()` wrapper so the doc construction is testable without a DOM download. Test: building the doc with sample data does not throw and produces >0 pages. Add `jspdf`/`jspdf-autotable`, extend `vite.config.ts` `export` chunk. Wire a "PDF" button next to Excel/Word. Gate. Commit.

- [ ] **Task 4.4 — Lint, a11y, README, final gate**

Run `npm run lint`; fix all warnings (repo enforces `--max-warnings 0`). Add `aria-label`s to icon-only buttons added in this plan; ensure new interactive elements are keyboard-reachable. Update README (PDF, Monte Carlo, advisor, comparator, multi-rubro). Run the full gate: `npm test` + `npm run build` + `npm run lint`. Commit `docs:` + any `fix(a11y):`.

---

## Final Verification

- [ ] `npm test` — all tests green (existing 64 + new).
- [ ] `npm run build` — tsc + vite succeed, no type errors.
- [ ] `npm run lint` — 0 warnings.
- [ ] `npm run dev` — manual smoke: each new tab (comparar, asesor) renders; SectorSelector shows multiple rubros; advisor falls back to "Reglas" with no key; PDF downloads.
- [ ] Merge `feat/app-enhancement` → `main`.

---

## Self-Review (completed by author)

- **Spec coverage:** Multi-rubro (F1), Comparador (F2), Asesor IA híbrido (F3), Pulido — PDF + Monte Carlo + tests + lint + a11y + README (F4). All four approved scope items covered.
- **Type consistency:** `AdvisorContext`/`AdvisoryReport` defined once in `advisor/types.ts` and reused by `deterministic.ts`, `context.ts`, `useAdvisor.ts`, `api/asesor.ts`. `SavedLocation` defined in store and reused by comparison/UI. `CompareRow` defined in `comparison.ts`. `CategoriaRubro` defined in `sectores.ts`.
- **Deploy safety:** `/api` excluded from SPA rewrite (Task 3.5); key only in serverless env; `.env.example` documents it; no key committed.
- **No placeholders:** interface-locking code is concrete; UI tasks specify props/structure/behavior + the existing pattern to follow.
