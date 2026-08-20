import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderConQuery } from '@/test-utils';
import { useProjectStore } from '@/store/projectStore';
import { ZonasPanel } from '../ZonasPanel';
import { ComparadorPanel } from '../ComparadorPanel';
import { FinancialPanel } from '../FinancialPanel';
import { SensitivityPanel } from '../SensitivityPanel';
import { CompetitionPanel } from '../CompetitionPanel';
import { DemographicsPanel } from '../DemographicsPanel';
import { FlowPanel } from '../FlowPanel';

const UBICACION = { lat: -33.4172, lng: -70.5852, label: 'El Golf' };

beforeEach(() => {
  // Los datasets viven en /public/data; en jsdom no hay servidor que los sirva.
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
  useProjectStore.setState({ location: null, selectedLocationId: null });
  useProjectStore.getState().resetInputs();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('paneles que no dependen de la ubicación', () => {
  it('ZonasPanel lista las zonas evaluadas y deja elegir una', async () => {
    const user = userEvent.setup();
    renderConQuery(<ZonasPanel />);

    expect(screen.getByText(/ubicación recomendada/i)).toBeInTheDocument();
    const zonas = screen.getAllByText(/las condes|providencia/i);
    expect(zonas.length).toBeGreaterThan(0);

    await user.click(zonas[0]);
    expect(useProjectStore.getState().selectedLocationId).toBeTruthy();
  });

  it('ComparadorPanel lista las zonas y abre una en Financiero', async () => {
    const user = userEvent.setup();
    renderConQuery(<ComparadorPanel />);

    const filas = screen.getAllByRole('button', { name: /abrir .* en panel financiero/i });
    expect(filas).toHaveLength(7);

    await user.click(filas[0]);
    expect(useProjectStore.getState().activeTab).toBe('financiero');
    expect(useProjectStore.getState().selectedLocationId).toBeTruthy();
  });

  it('FinancialPanel muestra los KPIs del modelo y los botones de export', () => {
    renderConQuery(<FinancialPanel />);
    expect(screen.getByRole('button', { name: /exportar excel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /exportar word/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /exportar pdf/i })).toBeInTheDocument();
  });

  it('SensitivityPanel renderiza el análisis de sensibilidad', () => {
    renderConQuery(<SensitivityPanel />);
    expect(screen.getByText(/sensibilidad/i)).toBeInTheDocument();
  });
});

describe('paneles que exigen ubicación', () => {
  const casos = [
    ['CompetitionPanel', CompetitionPanel],
    ['DemographicsPanel', DemographicsPanel],
    ['FlowPanel', FlowPanel],
  ] as const;

  it.each(casos)('%s pide una ubicación cuando no hay ninguna', (_nombre, Panel) => {
    renderConQuery(<Panel />);
    expect(screen.getByText(/selecciona un punto/i)).toBeInTheDocument();
  });

  it.each(casos)('%s deja de pedir ubicación cuando hay uno seleccionado', (_nombre, Panel) => {
    useProjectStore.setState({ location: UBICACION });
    renderConQuery(<Panel />);
    expect(
      screen.queryByText(/selecciona un punto para/i),
    ).not.toBeInTheDocument();
  });
});
