import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderConQuery } from '@/test-utils';
import { AsesorPanel } from '../AsesorPanel';
import { useProjectStore } from '@/store/projectStore';

describe('AsesorPanel', () => {
  beforeEach(() => {
    useProjectStore.setState({ location: { lat: -33.4172, lng: -70.5852, label: 'El Golf' } });
    useProjectStore.getState().resetInputs();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('entrega una recomendación aunque no haya API key detrás del endpoint', async () => {
    // Sin ANTHROPIC_API_KEY la funcion serverless responde 503 y el panel
    // debe caer al motor de reglas, no quedarse en blanco.
    vi.stubGlobal('fetch', vi.fn(async () => new Response('sin api key', { status: 503 })));
    const user = userEvent.setup();
    renderConQuery(<AsesorPanel />);

    await user.click(screen.getByRole('button', { name: /analizar|recomendaci/i }));

    // El veredicto es uno de los tres posibles del motor de reglas.
    expect(
      await screen.findByText(/recomendado|aceptable con riesgo|no conviene/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/reglas/i).length).toBeGreaterThan(0);
  });
});
