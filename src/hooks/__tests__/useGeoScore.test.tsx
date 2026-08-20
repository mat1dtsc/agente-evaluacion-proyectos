import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useGeoScore } from '../useGeoScore';
import { useProjectStore } from '@/store/projectStore';

// Un punto dentro de Las Condes y los datasets minimos que lo cubren.
const PUNTO = { lat: -33.4172, lng: -70.5852 };
const CODIGO = '13114';

const COMUNAS = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    properties: { codigo: CODIGO, nombre: 'Las Condes', region: 'RM', areaKm2: 99.4 },
    geometry: {
      type: 'Polygon',
      coordinates: [[[-70.65, -33.45], [-70.50, -33.45], [-70.50, -33.35], [-70.65, -33.35], [-70.65, -33.45]]],
    },
  }],
};
const DENSIDAD = { data: [{ codigo: CODIGO, densidad: 3200 }] };
const CASEN = { data: [{ codigo: CODIGO, ingresoMedio: 1_800_000 }] };
const METRO = { data: [{ nombre: 'El Golf', lat: -33.4180, lng: -70.5860, afluenciaAnualM: 4.2 }] };

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const cuerpo =
      url.includes('comunas') ? COMUNAS
      : url.includes('densidad') ? DENSIDAD
      : url.includes('casen') ? CASEN
      : url.includes('metro') ? METRO
      : {};
    return new Response(JSON.stringify(cuerpo), { status: 200 });
  }));
  useProjectStore.setState({ location: null, radiusMeters: 500 });
});

afterEach(() => vi.unstubAllGlobals());

describe('useGeoScore', () => {
  it('no calcula score sin ubicación', () => {
    const { result } = renderHook(() => useGeoScore(), { wrapper });
    expect(result.current.score).toBeNull();
    expect(result.current.comuna).toBeNull();
  });

  it('resuelve la comuna y puntúa el punto cuando llegan los datasets', async () => {
    useProjectStore.setState({ location: PUNTO });
    const { result } = renderHook(() => useGeoScore(), { wrapper });

    await waitFor(() => expect(result.current.comuna).toBe('Las Condes'));
    await waitFor(() => expect(result.current.score).not.toBeNull());

    const score = result.current.score!;
    expect(score.total).toBeGreaterThanOrEqual(0);
    expect(score.total).toBeLessThanOrEqual(100);
  });
});
