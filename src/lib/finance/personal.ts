/**
 * Costos laborales en Chile — modelo realista.
 *
 * Convención: el "sueldo bruto" es el imponible mensual antes de descuentos.
 * El "costo empresa" agrega obligaciones del empleador y provisiones legales:
 *
 *   Costo empresa = Bruto + Cotizaciones empleador + Gratificación legal
 *                       + Provisión vacaciones + Seguro accidentes
 *                       + Provisión indemnización
 *
 * Cargas patronales referenciales (2025):
 *   - AFC empleador (seguro cesantía):       2.4% del bruto (contrato indefinido)
 *   - SIS (seguro invalidez/sobrevivencia):  ≈1.85% (financia AFP, lo paga el empleador desde 2009)
 *   - Mutual (Ley 16.744 accidentes):        ≈0.95% (cotización adicional)
 *   - Provisión indemnización:                ≈8.33% (1 mes/año cuando supera 1 año)
 *   - Provisión vacaciones:                   ≈8.33% (15 días hábiles ≈ 1 mes/año)
 *
 * Gratificación legal (Art. 50 CT): equivale a 25% de remuneraciones con tope
 * de 4.75 IMM al año. En la práctica las empresas pagan el tope (más barato).
 * Tope 2025: 4.75 × $510.636 ≈ $2.425.521 anual ≈ $202.127 mensual.
 *
 * Cotizaciones del trabajador (deducidas del bruto, NO impactan al empleador
 * pero sí al líquido):
 *   - AFP: 10% + comisión administradora (~0.58% a 1.45%)
 *   - Salud (Fonasa o Isapre): 7%
 *   - AFC trabajador (indefinido): 0.6%
 */

export interface CargoPersonal {
  /** Nombre del cargo (ej. "Barista jefe", "Cajero", "Limpieza") */
  cargo: string;
  /** Cantidad de personas en este cargo */
  cantidad: number;
  /** Sueldo bruto mensual imponible CLP */
  sueldoBrutoMensual: number;
  /** Tipo de jornada — afecta cálculo de gratificación tope */
  jornada: 'completa' | 'parcial';
  /** Mes de incorporación (0 = mes 1 del proyecto, 12 = mes 13...) */
  mesIngreso?: number;
}

export interface CostoLaboralBreakdown {
  /** Sueldo bruto mensual del cargo individual */
  brutoMensual: number;
  /** Cotización empleador AFC (2.4% indefinido) */
  afcEmpleador: number;
  /** Seguro invalidez y sobrevivencia (paga empleador) */
  sis: number;
  /** Mutual de seguridad (Ley 16.744, accidentes del trabajo) */
  mutual: number;
  /** Gratificación legal mensual (Art. 50 CT, tope 4.75 IMM/12) */
  gratificacionMensual: number;
  /** Provisión vacaciones (15 días hábiles ≈ 1 mes/año) */
  provVacaciones: number;
  /** Provisión indemnización por años de servicio (1 mes/año) */
  provIndemnizacion: number;
  /** Costo total mensual por persona (todo incluido) */
  costoMensualPorPersona: number;
  /** Costo mensual total del cargo (× cantidad) */
  costoMensualTotal: number;
  /** Costo anualizado del cargo */
  costoAnualTotal: number;
  /** Multiplicador efectivo: costo empresa / sueldo bruto */
  factor: number;
}

/** Ingreso Mínimo Mensual 2025 — se usa para tope de gratificación */
export const IMM_2025 = 510_636;
/** Tope gratificación legal: 4.75 IMM al año */
export const TOPE_GRATIFICACION_ANUAL = IMM_2025 * 4.75;
export const TOPE_GRATIFICACION_MENSUAL = TOPE_GRATIFICACION_ANUAL / 12;

/** Tasas legales referenciales 2025 */
export const TASAS_EMPLEADOR = {
  afcIndefinido: 0.024,    // 2.4% AFC empleador con contrato indefinido
  sis: 0.0185,             // ≈1.85% Seguro invalidez/sobrevivencia (lo paga el empleador desde 2009)
  mutualBase: 0.0095,      // 0.95% mutual base — sectores de mayor riesgo pagan más
  provIndemnizacion: 0.0833, // 1/12 (1 mes por año desde año 1 trabajado)
  provVacaciones: 0.0833,    // 15 días hábiles ≈ 1 mes
} as const;

export function computeCostoLaboral(cargo: CargoPersonal): CostoLaboralBreakdown {
  const bruto = cargo.sueldoBrutoMensual;
  const afcEmpleador = bruto * TASAS_EMPLEADOR.afcIndefinido;
  const sis = bruto * TASAS_EMPLEADOR.sis;
  const mutual = bruto * TASAS_EMPLEADOR.mutualBase;

  // Gratificación: 25% del bruto, con tope mensual del 4.75 IMM/12
  const gratifBruta = bruto * 0.25;
  const gratificacionMensual = Math.min(gratifBruta, TOPE_GRATIFICACION_MENSUAL);

  // Provisiones (constantes de la legislación)
  const provVacaciones = bruto * TASAS_EMPLEADOR.provVacaciones;
  const provIndemnizacion = bruto * TASAS_EMPLEADOR.provIndemnizacion;

  const costoMensualPorPersona = bruto
    + afcEmpleador + sis + mutual
    + gratificacionMensual
    + provVacaciones + provIndemnizacion;

  const costoMensualTotal = costoMensualPorPersona * cargo.cantidad;
  const costoAnualTotal = costoMensualTotal * 12;
  const factor = costoMensualPorPersona / bruto;

  return {
    brutoMensual: bruto,
    afcEmpleador, sis, mutual,
    gratificacionMensual, provVacaciones, provIndemnizacion,
    costoMensualPorPersona, costoMensualTotal, costoAnualTotal, factor,
  };
}

/** Suma costo mensual de planilla activa en un mes específico (1..N) */
export function planillaMensualEnMes(personal: CargoPersonal[], mes: number): number {
  return personal
    .filter((p) => (p.mesIngreso ?? 0) < mes)
    .map(computeCostoLaboral)
    .reduce((s, c) => s + c.costoMensualTotal, 0);
}

/** Suma anual de costos de personal */
export function planillaAnual(personal: CargoPersonal[]): number {
  return personal.map(computeCostoLaboral).reduce((s, c) => s + c.costoAnualTotal, 0);
}

/**
 * Estructura típica para un café express con combo único en Chile.
 * 2 baristas tiempo completo + 1 cajero/asistente de tarde + 1 reemplazo part-time.
 */
export const PLANILLA_CAFE_DEFAULT: CargoPersonal[] = [
  { cargo: 'Barista jefe',      cantidad: 1, sueldoBrutoMensual: 850_000, jornada: 'completa' },
  { cargo: 'Barista',           cantidad: 1, sueldoBrutoMensual: 650_000, jornada: 'completa' },
  { cargo: 'Cajero / Asistente',cantidad: 1, sueldoBrutoMensual: 580_000, jornada: 'completa' },
  { cargo: 'Reemplazo / Aseo',  cantidad: 1, sueldoBrutoMensual: 510_636, jornada: 'parcial'  },
];
