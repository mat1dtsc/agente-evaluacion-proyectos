import { describe, it, expect } from 'vitest';
import {
  SECTORES_RETAIL_FOOD,
  applySectorToInputs,
  inversionTotal,
  CATEGORIA_META,
  type CategoriaRubro,
} from '../sectores';

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

  it('toda categoría usada tiene metadatos de presentación', () => {
    for (const s of SECTORES_RETAIL_FOOD) {
      expect(CATEGORIA_META[s.categoria as CategoriaRubro]).toBeDefined();
      expect(CATEGORIA_META[s.categoria].label.length).toBeGreaterThan(0);
    }
  });

  it.each(SECTORES_RETAIL_FOOD.map((s) => [s.id, s] as const))(
    'preset %s es coherente',
    (_id, s) => {
      // Inversión positiva y consistente con el desglose
      expect(inversionTotal(s)).toBeGreaterThan(0);
      // Margen unitario positivo (ticket cubre el costo variable)
      expect(s.operacion.ticketPromedio).toBeGreaterThan(s.operacion.costoVariableUnitario);
      // Rango de demanda ordenado
      expect(s.demanda.pesimista).toBeLessThanOrEqual(s.demanda.base);
      expect(s.demanda.base).toBeLessThanOrEqual(s.demanda.optimista);
      // Tiene planilla
      expect(s.personal.length).toBeGreaterThan(0);
      // El mapeo a ProjectInputs preserva las cifras núcleo
      const inputs = applySectorToInputs(s);
      expect(inputs.inversionInicial).toBe(inversionTotal(s));
      expect(inputs.ticketPromedio).toBe(s.operacion.ticketPromedio);
      expect(inputs.costoVariableUnitario).toBe(s.operacion.costoVariableUnitario);
      expect(inputs.tasaCostoCapital).toBe(s.financiamiento.tasaCostoCapital);
    },
  );

  it('incluye al menos 13 formatos (7 café + 6 otros rubros)', () => {
    expect(SECTORES_RETAIL_FOOD.length).toBeGreaterThanOrEqual(13);
  });
});
