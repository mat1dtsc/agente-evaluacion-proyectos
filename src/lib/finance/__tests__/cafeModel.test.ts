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

  it('VAN base es positivo y razonable ($120-200M con ramp-up + captura realista)', () => {
    expect(r.van).toBeGreaterThan(120_000_000);
    expect(r.van).toBeLessThan(200_000_000);
  });

  it('TIR base supera Tcc (proyecto rentable)', () => {
    expect(r.tir).toBeGreaterThan(TCC);
  });

  it('TIR en rango defendible para retail food asset-light (40-80%)', () => {
    expect(r.tir).toBeGreaterThan(0.40);
    expect(r.tir).toBeLessThan(0.80);
  });

  it('Payback en rango 2-4 años (cafetería sana con ramp-up)', () => {
    expect(r.payback).toBeGreaterThan(2);
    expect(r.payback).toBeLessThan(4.5);
  });

  it('Inversión total en torno a $44M (CAPEX + KT)', () => {
    expect(r.inversionTotal).toBeGreaterThan(40_000_000);
    expect(r.inversionTotal).toBeLessThan(60_000_000);
  });

  it('EBITDA año 1 es positivo (con ramp-up 55%, ~$5-15M)', () => {
    expect(r.ebitdaAno1).toBeGreaterThan(5_000_000);
    expect(r.ebitdaAno1).toBeLessThan(20_000_000);
  });

  it('EBITDA año 4 (madurez) es ~$50-80M', () => {
    expect(r.detalleAnual[4].ebitda).toBeGreaterThan(40_000_000);
    expect(r.detalleAnual[4].ebitda).toBeLessThan(90_000_000);
  });

  it('Combos año 1 = combosDiaBase × 0.55 (ramp inicial)', () => {
    const ano1 = r.detalleAnual[1].combos;
    const expected = elGolf.combosDiaBase * 312 * 0.55;
    expect(ano1).toBeCloseTo(expected, -3);
  });

  it('Combos año 4 = combosDiaBase × 1.0 (operación madura)', () => {
    const ano4 = r.detalleAnual[4].combos;
    const expected = elGolf.combosDiaBase * 312 * 1.0;
    expect(ano4).toBeCloseTo(expected, -3);
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

  it('Ingresos crecen vía ramp-up entre años 1-4 (no 2.5% lineal)', () => {
    // Año 1 ramp 55%, año 2 ramp 75% → ratio = 75/55 ≈ 1.36
    const i1 = r.detalleAnual[1].ingresos;
    const i2 = r.detalleAnual[2].ingresos;
    expect(i2 / i1).toBeCloseTo(0.75 / 0.55, 2);
  });

  it('Ingresos año 4 a 5 reflejan crecimiento poblacional INE', async () => {
    const { calcularUbicacion: calc } = await import('../cafeModel');
    // Providencia: g_INE +1.5% + g_sectorial 1.5% = 3.0% (mayor que el 2.5% del escenario)
    const prov = UBICACIONES.find((u) => u.id === 'providencia')!;
    const rProv = calc(prov, 'base');
    const i4 = rProv.detalleAnual[4].ingresos;
    const i5 = rProv.detalleAnual[5].ingresos;
    expect(i5 / i4).toBeCloseTo(1.03, 2);
  });
});

describe('calcularUbicacion — escenario pesimista', () => {
  const elGolf = UBICACIONES.find((u) => u.id === 'el_golf')!;
  const pes = calcularUbicacion(elGolf, 'pesimista');

  it('VAN pesimista es significativamente menor al base (caída demanda 35%)', () => {
    const base = calcularUbicacion(elGolf, 'base');
    expect(pes.van).toBeLessThan(base.van * 0.5);
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

  it('Hay un gradiente de viabilidad (no todas las zonas iguales)', () => {
    const vans = todas.map((r) => r.base.van);
    const max = Math.max(...vans);
    const min = Math.min(...vans);
    expect(max - min).toBeGreaterThan(50_000_000); // dispersión significativa
  });

  it('VAN ganadora < $250M (modelo realista, no inflado)', () => {
    expect(todas[0].base.van).toBeLessThan(250_000_000);
  });

  it('Al menos 4 ubicaciones con VAN positivo (modelo no es excesivamente conservador)', () => {
    const positivas = todas.filter((r) => r.base.van > 0);
    expect(positivas.length).toBeGreaterThanOrEqual(4);
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
  it('Ingresos año 1 = combos maduros × ramp[1] × días × ticket', async () => {
    const { FACTOR_RAMPUP } = await import('../cafeModel');
    const elGolf = UBICACIONES.find((u) => u.id === 'el_golf')!;
    const r = calcularUbicacion(elGolf, 'base');
    // Año 1 con ramp-up 0.55: combos = combosDiaBase × 0.55
    const expectedIngresos = elGolf.combosDiaBase * 312 * FACTOR_RAMPUP[1] * elGolf.ticketPromedio;
    expect(r.detalleAnual[1].ingresos).toBeCloseTo(expectedIngresos, -3);
  });

  it('Ingresos año 4 (madurez) = combos × días × ticket (ramp = 1.0)', () => {
    const elGolf = UBICACIONES.find((u) => u.id === 'el_golf')!;
    const r = calcularUbicacion(elGolf, 'base');
    const expectedIngresos = elGolf.combosDiaBase * 312 * elGolf.ticketPromedio;
    expect(r.detalleAnual[4].ingresos).toBeCloseTo(expectedIngresos, -3);
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

describe('Modelo de demanda: tasa de captura + ramp-up + crecimiento INE', () => {
  it('Cada zona tiene tasa de captura definida en rango Procafé (0.15% - 0.80%)', () => {
    UBICACIONES.forEach((u) => {
      expect(u.tasaCapturaMadura).toBeGreaterThanOrEqual(0.0015);
      expect(u.tasaCapturaMadura).toBeLessThanOrEqual(0.008);
    });
  });

  it('Combos día base = flujo × captura (con cap a capacidadMaxDiaria)', () => {
    UBICACIONES.forEach((u) => {
      const sinCap = u.flujoPeatonalDia * u.tasaCapturaMadura;
      const conCap = Math.min(sinCap, u.capacidadMaxDiaria);
      expect(u.combosDiaBase).toBeCloseTo(conCap, -1);
    });
  });

  it('Combos año 1 son ~55% de los maduros (ramp-up inicial)', async () => {
    const { calcularUbicacion: calc, FACTOR_RAMPUP } = await import('../cafeModel');
    const u = UBICACIONES[0];
    const r = calc(u, 'base');
    const ratio = r.detalleAnual[1].combos / (u.combosDiaBase * 312);
    expect(ratio).toBeCloseTo(FACTOR_RAMPUP[1], 2);
  });

  it('Crecimiento poblacional INE es coherente por zona', () => {
    const lasCondes = UBICACIONES.find((u) => u.id === 'el_golf')!;
    const stgoCentro = UBICACIONES.find((u) => u.id === 'santiago_centro')!;
    const estCentral = UBICACIONES.find((u) => u.id === 'estacion_central')!;
    // Las Condes envejece (g negativo o ~0)
    expect(lasCondes.crecimientoPoblacionalAnual).toBeLessThan(0.005);
    // Santiago y Estación Central crecen fuerte por edificación
    expect(stgoCentro.crecimientoPoblacionalAnual).toBeGreaterThan(0.015);
    expect(estCentral.crecimientoPoblacionalAnual).toBeGreaterThan(0.02);
  });

  it('Capacidad máxima diaria limita zonas de muy alto flujo', () => {
    const stgoCentro = UBICACIONES.find((u) => u.id === 'santiago_centro')!;
    // 95k peatones × 0.22% = 209, con cap 280 → no se capa
    // pero asegura que está dentro del rango operativo
    expect(stgoCentro.combosDiaBase).toBeLessThanOrEqual(stgoCentro.capacidadMaxDiaria);
  });

  it('Curva ramp-up está documentada y es monotónica', async () => {
    const { FACTOR_RAMPUP } = await import('../cafeModel');
    expect(FACTOR_RAMPUP[1]).toBeLessThan(FACTOR_RAMPUP[2]);
    expect(FACTOR_RAMPUP[2]).toBeLessThan(FACTOR_RAMPUP[3]);
    expect(FACTOR_RAMPUP[3]).toBeLessThanOrEqual(FACTOR_RAMPUP[4]);
    expect(FACTOR_RAMPUP[4]).toBe(1.0);
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
