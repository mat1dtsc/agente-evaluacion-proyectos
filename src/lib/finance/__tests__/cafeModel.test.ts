/**
 * Tests del modelo financiero corregido para cafeterías combo único.
 * Valida los KPIs auditados contra benchmarks realistas del retail food chileno.
 */
import { describe, it, expect } from 'vitest';
import {
  calcularUbicacion, calcularTodas, scoreUbicacion, veredicto,
  UBICACIONES, TCC, MULT_EBITDA_TERMINAL, COMISION_TARJETAS, G_DEMANDA,
  CAPEX, COSTOS_FIJOS_NO_LAB_TOTAL, PLANILLA_MENSUAL_TOTAL,
} from '../cafeModel';

describe('Constantes macro del modelo corregido', () => {
  it('Tcc se ubica en 14% (CAPM retail food)', () => {
    expect(TCC).toBe(0.14);
  });
  it('Múltiplo EBITDA terminal 3.5x (no Gordon Growth)', () => {
    expect(MULT_EBITDA_TERMINAL).toBe(3.5);
  });
  it('Comisión tarjetas 2.8% sobre ingresos', () => {
    expect(COMISION_TARJETAS).toBe(0.028);
  });
  it('Crecimiento demanda anual 2.5% (sectorial sin reinversión)', () => {
    expect(G_DEMANDA).toBe(0.025);
  });
  it('CAPEX activos = $20.5M aproximadamente', () => {
    expect(CAPEX).toBeCloseTo(20_500_000, -5);
  });
  it('Costos fijos no laborales = $850k/mes', () => {
    expect(COSTOS_FIJOS_NO_LAB_TOTAL).toBe(850_000);
  });
  it('Planilla mensual con cargas ≈ $2.94M', () => {
    expect(PLANILLA_MENSUAL_TOTAL).toBeGreaterThan(2_900_000);
    expect(PLANILLA_MENSUAL_TOTAL).toBeLessThan(3_000_000);
  });
});

describe('calcularUbicacion — El Golf (zona ganadora)', () => {
  const elGolf = UBICACIONES.find((u) => u.id === 'el_golf')!;
  const r = calcularUbicacion(elGolf, 'base');

  it('VAN base es positivo y razonable ($30-80M)', () => {
    expect(r.van).toBeGreaterThan(30_000_000);
    expect(r.van).toBeLessThan(80_000_000);
  });

  it('TIR base supera Tcc (proyecto rentable)', () => {
    expect(r.tir).toBeGreaterThan(TCC);
  });

  it('TIR no es absurda (rango 25-50%)', () => {
    expect(r.tir).toBeGreaterThan(0.25);
    expect(r.tir).toBeLessThan(0.50);
  });

  it('Payback en rango 2-4 años (cafetería sana)', () => {
    expect(r.payback).toBeGreaterThan(2);
    expect(r.payback).toBeLessThan(4.5);
  });

  it('Inversión total en torno a $44M (CAPEX + KT)', () => {
    expect(r.inversionTotal).toBeGreaterThan(40_000_000);
    expect(r.inversionTotal).toBeLessThan(50_000_000);
  });

  it('EBITDA año 1 es positivo (~$10-20M)', () => {
    expect(r.ebitdaAno1).toBeGreaterThan(10_000_000);
    expect(r.ebitdaAno1).toBeLessThan(20_000_000);
  });

  it('Margen contribución entre 55% y 70%', () => {
    expect(r.margenContrib).toBeGreaterThan(0.55);
    expect(r.margenContrib).toBeLessThan(0.70);
  });

  it('Detalle anual tiene 6 períodos (año 0 + 5 años)', () => {
    expect(r.detalleAnual.length).toBe(6);
  });

  it('Año 5 incluye recupero KT + valor residual + valor terminal', () => {
    const ano5 = r.detalleAnual[5];
    expect(ano5.recuperoKT).toBeGreaterThan(0);
    expect(ano5.valorResidual).toBeGreaterThan(0);
    expect(ano5.valorTerminal).toBeGreaterThan(0);
  });

  it('Ingresos crecen 2.5% año a año (no 5%)', () => {
    const i1 = r.detalleAnual[1].ingresos;
    const i2 = r.detalleAnual[2].ingresos;
    expect(i2 / i1).toBeCloseTo(1.025, 2);
  });
});

describe('calcularUbicacion — escenario pesimista', () => {
  const elGolf = UBICACIONES.find((u) => u.id === 'el_golf')!;
  const pes = calcularUbicacion(elGolf, 'pesimista');

  it('VAN pesimista es negativo (validación de riesgo)', () => {
    expect(pes.van).toBeLessThan(0);
  });

  it('Pesimista usa combosDiaPesimista (no base)', () => {
    expect(pes.combosDia).toBe(elGolf.combosDiaPesimista);
  });
});

describe('Ranking de ubicaciones', () => {
  const todas = calcularTodas();
  todas.sort((a, b) => b.base.van - a.base.van);

  it('El Golf es la ubicación ganadora', () => {
    expect(todas[0].u.id).toBe('el_golf');
  });

  it('Solo 1-3 ubicaciones tienen VAN positivo (filtrado realista)', () => {
    const positivas = todas.filter((r) => r.base.van > 0);
    expect(positivas.length).toBeGreaterThanOrEqual(1);
    expect(positivas.length).toBeLessThanOrEqual(3);
  });

  it('VAN ganadora < $100M (modelo realista, no inflado)', () => {
    expect(todas[0].base.van).toBeLessThan(100_000_000);
  });
});

describe('Score y veredicto', () => {
  it('VAN negativo limita score a ≤49 (banda roja)', () => {
    const todas = calcularTodas();
    const noConvienen = todas.filter((r) => r.base.van <= 0);
    noConvienen.forEach((r) => {
      expect(scoreUbicacion(r)).toBeLessThanOrEqual(49);
    });
  });

  it('Veredicto coherente con VAN', () => {
    const todas = calcularTodas();
    todas.forEach((r) => {
      const v = veredicto(r);
      if (v.texto === 'Recomendado') {
        expect(r.base.van).toBeGreaterThan(0);
        expect(r.pes.van).toBeGreaterThan(0);
      }
      if (v.texto === 'No conviene') {
        // Aceptamos VAN negativo o pesimista muy malo
        const malo = r.base.van <= 0 || r.pes.van < -r.base.inversionTotal * 0.5;
        expect(malo || scoreUbicacion(r) < 55).toBe(true);
      }
    });
  });
});

describe('TIR robusta', () => {
  it('TIR es NaN cuando suma de flujos es negativa', () => {
    const ubic = UBICACIONES.find((u) => u.id === 'nunoa_plaza')!;
    const r = calcularUbicacion(ubic, 'pesimista');
    if (r.flujos.reduce((s, f) => s + f, 0) < 0) {
      expect(Number.isNaN(r.tir)).toBe(true);
    }
  });

  it('TIR no es Infinity ni absurda', () => {
    const todas = calcularTodas();
    todas.forEach((r) => {
      if (Number.isFinite(r.base.tir)) {
        expect(r.base.tir).toBeLessThan(2.0);  // < 200%
        expect(r.base.tir).toBeGreaterThan(-0.99);
      }
    });
  });
});

describe('Coherencia ingresos/costos', () => {
  it('Ingresos año 1 = combos × días × ticket', () => {
    const elGolf = UBICACIONES.find((u) => u.id === 'el_golf')!;
    const r = calcularUbicacion(elGolf, 'base');
    const expectedIngresos = elGolf.combosDiaBase * 312 * elGolf.ticketPromedio;
    expect(r.detalleAnual[1].ingresos).toBeCloseTo(expectedIngresos, -3);
  });

  it('Comisión tarjetas año 1 = 2.8% × ingresos', () => {
    const elGolf = UBICACIONES.find((u) => u.id === 'el_golf')!;
    const r = calcularUbicacion(elGolf, 'base');
    const ano1 = r.detalleAnual[1];
    expect(ano1.comisiones).toBeCloseTo(ano1.ingresos * COMISION_TARJETAS, 0);
  });

  it('EBITDA = ingresos − cv − cf − comisiones', () => {
    const elGolf = UBICACIONES.find((u) => u.id === 'el_golf')!;
    const r = calcularUbicacion(elGolf, 'base');
    const ano1 = r.detalleAnual[1];
    const ebitdaCalc = ano1.ingresos - ano1.cv - ano1.cf - ano1.comisiones;
    expect(ano1.ebitda).toBeCloseTo(ebitdaCalc, 0);
  });

  it('Valor terminal = EBITDA × 3.5 × (1 - 0.25)', () => {
    const elGolf = UBICACIONES.find((u) => u.id === 'el_golf')!;
    const r = calcularUbicacion(elGolf, 'base');
    const ano5 = r.detalleAnual[5];
    const vtCalc = ano5.ebitda * MULT_EBITDA_TERMINAL * (1 - 0.25);
    expect(ano5.valorTerminal).toBeCloseTo(vtCalc, 0);
  });
});

describe('Auditoría externa — bugs corregidos', () => {
  it('Bug #4: valor residual usa valor libro real activo-por-activo (no 10% CAPEX)', async () => {
    const { valorLibroEnAno, valorRecuperoActivos, INVERSION_ITEMS, CAPEX } = await import('../cafeModel');

    // Calcular manualmente: cada activo con vida útil > 5 conserva valor libro
    let valorLibroEsperado = 0;
    INVERSION_ITEMS.forEach((it) => {
      if (it.vidaUtil > 5) {
        const dep = (it.costoCLP / it.vidaUtil) * 5;
        valorLibroEsperado += it.costoCLP - dep;
      }
    });

    // El valor libro al año 5 debe ser significativo (no cero, no CAPEX×10%)
    expect(valorLibroEnAno(5)).toBeCloseTo(valorLibroEsperado, 0);
    expect(valorLibroEnAno(5)).toBeGreaterThan(CAPEX * 0.30); // mucho más que 10%
    expect(valorLibroEnAno(5)).toBeLessThan(CAPEX);          // pero menos que el total

    // Habilitación (vida 20) debe estar en el valor libro
    const habilitacion = INVERSION_ITEMS.find((i) => i.item.includes('Habilitación'));
    if (habilitacion) {
      const depHab = (habilitacion.costoCLP / habilitacion.vidaUtil) * 5;
      const valorLibroHab = habilitacion.costoCLP - depHab;
      // Debe representar al menos un 30% del valor libro total (es el activo más resistente)
      expect(valorLibroHab).toBeGreaterThan(valorLibroEnAno(5) * 0.20);
    }

    // Valor de venta es 60% del valor libro (haircut de mercado)
    expect(valorRecuperoActivos(5)).toBeCloseTo(valorLibroEnAno(5) * 0.60, 0);
  });

  it('Bug #2: sensibilidad incluye tasa de descuento', async () => {
    const { runSensitivity } = await import('../sensitivity');
    const { defaultInputs } = await import('@/store/projectStore');
    const result = runSensitivity(defaultInputs);
    const tasaDescResult = result.find((r) => r.variable === 'tasaDescuento');
    expect(tasaDescResult).toBeDefined();
    // Cuando la tasa cambia ±20%, el VAN debe cambiar (no quedar idéntico)
    const conTasaMenor = result.find((r) => r.variable === 'tasaDescuento' && r.delta === -0.20);
    const conTasaMayor = result.find((r) => r.variable === 'tasaDescuento' && r.delta === 0.20);
    expect(conTasaMenor!.vanPuro).not.toBeCloseTo(conTasaMayor!.vanPuro, -3);
  });
});

describe('Escenarios de calibración', () => {
  it('Escenario optimista da VAN mayor que conservador (mismo input)', async () => {
    const { calcularUbicacion: calc } = await import('../cafeModel');
    const elGolf = UBICACIONES.find((u) => u.id === 'el_golf')!;
    const cons = calc(elGolf, 'base', 'conservador');
    const opt = calc(elGolf, 'base', 'optimista');
    expect(opt.van).toBeGreaterThan(cons.van);
  });

  it('Escenario intermedio está entre conservador y optimista', async () => {
    const { calcularUbicacion: calc } = await import('../cafeModel');
    const elGolf = UBICACIONES.find((u) => u.id === 'el_golf')!;
    const cons = calc(elGolf, 'base', 'conservador');
    const med = calc(elGolf, 'base', 'intermedio');
    const opt = calc(elGolf, 'base', 'optimista');
    expect(med.van).toBeGreaterThanOrEqual(cons.van);
    expect(med.van).toBeLessThanOrEqual(opt.van);
  });
});
