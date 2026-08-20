import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useComunasGeoJSON, useDensidad } from '../useDatasets';

const DENSIDAD = {
  _source: 'INE',
  _isDemo: false,
  data: [{ codigo: '13114', densidad: 3200 }],
};

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.includes('densidad')) return new Response(JSON.stringify(DENSIDAD), { status: 200 });
    if (url.includes('comunas')) return new Response(JSON.stringify({ type: 'FeatureCollection', features: [] }), { status: 200 });
    return new Response('no encontrado', { status: 404 });
  }));
});

afterEach(() => vi.unstubAllGlobals());

describe('useDatasets', () => {
  it('carga la densidad con su header de atribución', async () => {
    const { result } = renderHook(() => useDensidad(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(result.current.data?._source).toBe('INE');
    expect(result.current.data?.data[0].codigo).toBe('13114');
  });

  it('carga el GeoJSON de comunas', async () => {
    const { result } = renderHook(() => useComunasGeoJSON(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(result.current.data?.type).toBe('FeatureCollection');
  });
});
