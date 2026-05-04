import { describe, it, expect } from 'vitest';
import {
  NORMATIVAS_RETAIL_FOOD, costoInicialNormativo, costoAnualNormativo,
  regimenTributarioSugerido, UF_2025,
} from '../normativas';

describe('NORMATIVAS_RETAIL_FOOD', () => {
  it('Cubre los 4 organismos clave (SII, SEREMI, Municipalidad, Mutual/DT)', () => {
    const orgs = new Set(NORMATIVAS_RETAIL_FOOD.map((n) => n.organismo));
    const cubiertos = ['Servicio de Impuestos Internos', 'SEREMI de Salud RM', 'Municipalidad respectiva', 'Dirección del Trabajo'];
    cubiertos.forEach((o) => expect(orgs.has(o)).toBe(true));
  });

  it('Todas las normativas tienen base legal documentada', () => {
    NORMATIVAS_RETAIL_FOOD.forEach((n) => {
      expect(n.base_legal).toBeTruthy();
      expect(n.tramite).toBeTruthy();
    });
  });

  it('Costo inicial normativo > 0 (debe haber al menos un permiso pagado)', () => {
    expect(costoInicialNormativo()).toBeGreaterThan(0);
  });

  it('Costo anual recurrente > 0 (debe haber renovación municipal)', () => {
    expect(costoAnualNormativo()).toBeGreaterThan(0);
  });
});

describe('regimenTributarioSugerido', () => {
  it('Ventas < 75k UF → Pro PYME al 25%', () => {
    const ventasCLP = 50_000 * UF_2025; // 50k UF
    const r = regimenTributarioSugerido(ventasCLP);
    expect(r.tasa).toBe(0.25);
    expect(r.regimen).toContain('Pro PYME');
  });

  it('Ventas > 75k UF → Régimen General al 27%', () => {
    const ventasCLP = 100_000 * UF_2025;
    const r = regimenTributarioSugerido(ventasCLP);
    expect(r.tasa).toBe(0.27);
    expect(r.regimen).toContain('General');
  });

  it('Pro PYME entrega beneficios documentados', () => {
    const r = regimenTributarioSugerido(20_000 * UF_2025);
    expect(r.beneficios.length).toBeGreaterThan(0);
    expect(r.beneficios.some((b) => b.toLowerCase().includes('depreciación'))).toBe(true);
  });
});
