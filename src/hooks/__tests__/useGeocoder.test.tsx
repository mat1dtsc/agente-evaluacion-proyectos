import { describe, it, expect, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useGeocoder } from '../useGeocoder';

afterEach(() => vi.unstubAllGlobals());

describe('useGeocoder', () => {
  it('convierte la respuesta de Nominatim en coordenadas numéricas', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify([
      { lat: '-33.4172', lon: '-70.5852', display_name: 'El Golf, Las Condes' },
    ]), { status: 200 })));

    const { result } = renderHook(() => useGeocoder());
    await act(() => result.current.search('el golf'));

    expect(result.current.results).toEqual([
      { lat: -33.4172, lng: -70.5852, label: 'El Golf, Las Condes' },
    ]);
    expect(result.current.error).toBeNull();
  });

  it('no llama al servicio con una consulta vacía', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const { result } = renderHook(() => useGeocoder());
    await act(() => result.current.search('   '));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.current.results).toEqual([]);
  });

  it('expone el error y limpia resultados si Nominatim falla', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('rate limited', { status: 429 })));

    const { result } = renderHook(() => useGeocoder());
    await act(() => result.current.search('providencia'));

    expect(result.current.error).toMatch(/429/);
    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
  });
});
