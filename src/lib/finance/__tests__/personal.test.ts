import { describe, it, expect } from 'vitest';
import {
  computeCostoLaboral, planillaAnual, IMM_2025,
  TASAS_EMPLEADOR, TOPE_GRATIFICACION_MENSUAL, PLANILLA_CAFE_DEFAULT,
} from '../personal';
import type { CargoPersonal } from '../personal';

describe('computeCostoLaboral', () => {
  it('Sueldo bajo el tope: gratificación = 25% bruto', () => {
    const cargo: CargoPersonal = {
      cargo: 'Junior', cantidad: 1, sueldoBrutoMensual: 600_000, jornada: 'completa',
    };
    const b = computeCostoLaboral(cargo);
    // 25% × 600k = 150k, bajo el tope mensual ~$202k → debe ser 150k
    expect(b.gratificacionMensual).toBeCloseTo(150_000, 0);
  });

  it('Sueldo alto: gratificación se topa en 4.75 IMM/12', () => {
    const cargo: CargoPersonal = {
      cargo: 'Senior', cantidad: 1, sueldoBrutoMensual: 3_000_000, jornada: 'completa',
    };
    const b = computeCostoLaboral(cargo);
    // 25% × 3M = 750k, pero tope mensual ≈ $202k → debe topar
    expect(b.gratificacionMensual).toBeCloseTo(TOPE_GRATIFICACION_MENSUAL, 0);
    expect(b.gratificacionMensual).toBeLessThan(750_000);
  });

  it('Factor empresa entre 1.40 y 1.50 para sueldos medios (gratificación 25% sin tope)', () => {
    const cargo: CargoPersonal = {
      cargo: 'Medio', cantidad: 1, sueldoBrutoMensual: 700_000, jornada: 'completa',
    };
    const b = computeCostoLaboral(cargo);
    // Bruto + 5.2% cargas patronales + 25% gratif + 8.33% vacaciones + 8.33% indemnización ≈ 1.47x
    expect(b.factor).toBeGreaterThan(1.40);
    expect(b.factor).toBeLessThan(1.50);
  });

  it('Factor baja al topar gratificación (sueldo alto)', () => {
    const cargo: CargoPersonal = {
      cargo: 'Senior', cantidad: 1, sueldoBrutoMensual: 3_000_000, jornada: 'completa',
    };
    const b = computeCostoLaboral(cargo);
    // Sueldos altos: la gratificación pesa proporcionalmente menos al toparse
    expect(b.factor).toBeGreaterThan(1.20);
    expect(b.factor).toBeLessThan(1.35);
  });

  it('Costo total mensual = bruto + AFC + SIS + Mutual + Gratif + Provisiones', () => {
    const cargo: CargoPersonal = {
      cargo: 'X', cantidad: 1, sueldoBrutoMensual: 500_000, jornada: 'completa',
    };
    const b = computeCostoLaboral(cargo);
    const expected = 500_000
      + 500_000 * TASAS_EMPLEADOR.afcIndefinido
      + 500_000 * TASAS_EMPLEADOR.sis
      + 500_000 * TASAS_EMPLEADOR.mutualBase
      + 500_000 * 0.25
      + 500_000 * TASAS_EMPLEADOR.provVacaciones
      + 500_000 * TASAS_EMPLEADOR.provIndemnizacion;
    expect(b.costoMensualPorPersona).toBeCloseTo(expected, 0);
  });

  it('Cantidad multiplica el costo total', () => {
    const cargo: CargoPersonal = {
      cargo: 'X', cantidad: 3, sueldoBrutoMensual: 500_000, jornada: 'completa',
    };
    const b = computeCostoLaboral(cargo);
    expect(b.costoMensualTotal).toBeCloseTo(b.costoMensualPorPersona * 3, 0);
  });

  it('IMM 2025 tiene el valor esperado', () => {
    expect(IMM_2025).toBe(510_636);
  });
});

describe('planillaAnual', () => {
  it('Planilla café default tiene costo anual coherente con benchmark retail', () => {
    const total = planillaAnual(PLANILLA_CAFE_DEFAULT);
    // 4 personas con sueldos entre IMM y 850k → costo anual ≈ 38-44 millones
    expect(total).toBeGreaterThan(35_000_000);
    expect(total).toBeLessThan(50_000_000);
  });
});
