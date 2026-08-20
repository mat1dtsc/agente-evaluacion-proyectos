import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import { renderConQuery } from '@/test-utils';
import { DemandPanel } from '../DemandPanel';
import { useProjectStore } from '@/store/projectStore';

describe('DemandPanel', () => {
  beforeEach(() => {
    // Los datasets viven en /public/data; en jsdom no hay servidor que los sirva.
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
    useProjectStore.setState({ location: null });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('pide seleccionar un punto cuando no hay ubicación', () => {
    renderConQuery(<DemandPanel />);
    expect(screen.getByText(/selecciona un punto/i)).toBeInTheDocument();
  });

  it('sobrevive a que la ubicación se limpie después de estar seteada', async () => {
    // Regresion: useState estaba declarado despues del return condicional por
    // falta de ubicacion, asi que al limpiarla React veia menos hooks que en
    // el render anterior y el panel reventaba.
    useProjectStore.setState({ location: { lat: -33.4172, lng: -70.5852 } });
    renderConQuery(<DemandPanel />);
    expect(screen.getByText(/no sabes por dónde empezar/i)).toBeInTheDocument();

    act(() => useProjectStore.setState({ location: null }));
    expect(await screen.findByText(/selecciona un punto/i)).toBeInTheDocument();
  });
});
