import { describe, it, expect, afterEach, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useAdvisor } from '../useAdvisor';
import type { AdvisorContext } from '@/lib/advisor/types';

const CTX: AdvisorContext = {
  proyecto: 'Café El Golf',
  ubicacion: { label: 'El Golf', comuna: 'Las Condes', lat: -33.4172, lng: -70.5852 },
  scoreGeo: null,
  finanzas: {
    vanPuro: 107_000_000,
    tirPuro: 0.49,
    paybackPuro: 3.2,
    vanInv: 120_000_000,
    tirInv: 0.61,
    breakevenCombosDia: 90,
    tcc: 0.14,
  },
  competencia: { totalCafes: 65 },
  demanda: { combosDiaBase: 135, ticket: 4500 },
  sensibilidadTop: [{ variable: 'demanda', impactoVan: -42_000_000 }],
  escenario: 'intermedio',
};

afterEach(() => vi.unstubAllGlobals());

describe('useAdvisor', () => {
  it('usa el informe de la función serverless cuando responde bien', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      veredicto: 'Recomendado',
      resumen: 'VAN holgado y payback bajo el horizonte.',
      fortalezas: ['VAN positivo'],
      riesgos: ['Competencia alta'],
      drivers: ['demanda'],
      siguientePaso: 'Negociar el arriendo',
    }), { status: 200 })));

    const { result } = renderHook(() => useAdvisor());
    await act(() => result.current.run(CTX));

    await waitFor(() => expect(result.current.report).not.toBeNull());
    expect(result.current.report?.fuente).toBe('ia');
    expect(result.current.report?.veredicto).toBe('Recomendado');
  });

  it('cae al motor determinístico si el endpoint falla (sin API key)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('sin api key', { status: 503 })));

    const { result } = renderHook(() => useAdvisor());
    await act(() => result.current.run(CTX));

    await waitFor(() => expect(result.current.report).not.toBeNull());
    expect(result.current.report?.fuente).toBe('reglas');
    expect(result.current.report?.veredicto).toBeTruthy();
  });

  it('cae al determinístico si la respuesta no tiene la forma esperada', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ cualquierCosa: true }), { status: 200 })));

    const { result } = renderHook(() => useAdvisor());
    await act(() => result.current.run(CTX));

    await waitFor(() => expect(result.current.report).not.toBeNull());
    expect(result.current.report?.fuente).toBe('reglas');
  });

  it('deja de estar loading al terminar', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('sin red'); }));

    const { result } = renderHook(() => useAdvisor());
    expect(result.current.loading).toBe(false);
    await act(() => result.current.run(CTX));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.report?.fuente).toBe('reglas');
  });
});
