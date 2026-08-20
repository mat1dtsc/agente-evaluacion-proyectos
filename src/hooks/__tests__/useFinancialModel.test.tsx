import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFinancialModel } from '../useFinancialModel';
import { useProjectStore } from '@/store/projectStore';
import { UBICACIONES } from '@/lib/finance/cafeModel';

describe('useFinancialModel', () => {
  beforeEach(() => {
    useProjectStore.setState({ selectedLocationId: null });
    useProjectStore.getState().resetInputs();
  });

  it('entrega ambos flujos y el break-even con los supuestos por defecto', () => {
    const { result } = renderHook(() => useFinancialModel());

    expect(result.current.flujoPuro.cashFlow.length).toBeGreaterThan(0);
    expect(result.current.flujoInversionista.cashFlow.length).toBeGreaterThan(0);
    expect(Number.isFinite(result.current.flujoPuro.van)).toBe(true);
    expect(result.current.breakeven).toBeGreaterThan(0);
    expect(result.current.usandoModeloCorregido).toBe(false);
  });

  it('ordena la sensibilidad por impacto absoluto en el VAN puro', () => {
    const { result } = renderHook(() => useFinancialModel());
    const impactos = result.current.sensitivity.map((s) => Math.abs(s.impactoVanPuro));

    expect(impactos.length).toBeGreaterThan(0);
    for (let i = 1; i < impactos.length; i++) {
      expect(impactos[i - 1]).toBeGreaterThanOrEqual(impactos[i]);
    }
  });

  it('usa el modelo corregido cuando hay una zona pre-evaluada seleccionada', () => {
    useProjectStore.setState({ selectedLocationId: UBICACIONES[0].id });
    const { result } = renderHook(() => useFinancialModel());

    expect(result.current.usandoModeloCorregido).toBe(true);
    expect(result.current.flujoPuro.cashFlow.length).toBeGreaterThan(0);
  });

  it('recalcula el VAN al cambiar el ticket promedio', () => {
    const { result, rerender } = renderHook(() => useFinancialModel());
    const vanBase = result.current.flujoPuro.van;

    const ticket = useProjectStore.getState().inputs.ticketPromedio;
    useProjectStore.getState().updateInputs({ ticketPromedio: ticket * 1.2 });
    rerender();

    expect(result.current.flujoPuro.van).toBeGreaterThan(vanBase);
  });
});
