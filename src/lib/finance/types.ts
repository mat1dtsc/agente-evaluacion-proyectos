/**
 * Tipos del modelo financiero del agente.
 * Convención: todos los montos en CLP (pesos chilenos), tasas en decimal (0.12 = 12%).
 */

import type { CargoPersonal } from './personal';

export interface ProjectInputs {
  /** Inversión inicial en activos depreciables (CLP) */
  inversionInicial: number;
  /** Capital de trabajo inicial (CLP) — recuperado al final del horizonte */
  capitalTrabajo: number;
  /** Horizonte de evaluación en años */
  vidaUtilAnos: number;
  /** Demanda base: combos/día */
  combosPorDiaBase: number;
  /** Días operativos por año */
  diasOperacionAno: number;
  /** Crecimiento anual de demanda (decimal) */
  crecimientoDemanda: number;
  /** Precio promedio por combo (CLP) */
  ticketPromedio: number;
  /** Costo variable unitario (insumos por combo, CLP) */
  costoVariableUnitario: number;
  /** Costos fijos mensuales (arriendo + sueldos + servicios + otros, CLP) */
  costosFijosMensuales: number;
  /** Tasa de impuesto a la renta (default 0.27 en Chile) */
  tasaImpuesto: number;
  /** Tasa de costo de capital del proyecto (Tcc, default 0.12) */
  tasaCostoCapital: number;
  /** Porcentaje de financiamiento bancario sobre inversión (0..1) */
  porcentajeDeuda: number;
  /** Tasa de interés anual del banco (decimal) */
  tasaBanco: number;
  /** Plazo del crédito en años */
  plazoDeudaAnos: number;
  /** Vida útil contable para depreciación lineal (años) */
  depreciacionAnos: number;
  /** Valor residual de los activos al final del horizonte (CLP) */
  valorResidual: number;
  /** Tasa de crecimiento a perpetuidad para valor terminal. Default 0 = sin crecimiento.
   *  Si > 0, se calcula VT = FCN_último_año × (1 + g) / (Tcc - g)
   *  y se suma al flujo del último año. Debe ser < Tcc. */
  crecimientoPerpetuidad: number;

  // --- Personal y normativas ---
  /** Planilla de cargos. Si presente, el costo de personal mensual se calcula
   *  con leyes sociales chilenas y reemplaza/complementa los costosFijos. */
  personal?: CargoPersonal[];
  /** Costos no-laborales mensuales (arriendo, servicios, insumos no variables, etc.) */
  costosFijosNoLaboralesMensuales?: number;
  /** Costo único de permisos iniciales (patente, sanitaria, manipulador, etc.) */
  costosNormativosIniciales?: number;
  /** Costos normativos anuales recurrentes (renovación patente, basura, etc.) */
  costosNormativosAnuales?: number;

  // --- Tributario adicional ---
  /** true si se acoge a Régimen Pro PYME 14 D N° 3 */
  proPyme?: boolean;
  /** Tasa IVA — Chile 19%, default 0.19 */
  tasaIVA?: number;

  // --- Granularidad ---
  /** Granularidad del flujo: 'anual' (default) o 'mensual' (60 períodos) */
  granularidad?: 'anual' | 'mensual';
}

export interface CashFlowYear {
  ano: number;
  ingresos: number;
  costosVariables: number;
  costosFijos: number;
  depreciacion: number;
  intereses: number;
  utilidadAntesImpuesto: number;
  impuesto: number;
  utilidadNeta: number;
  flujoOperacional: number;
  inversion: number;
  capitalTrabajo: number;
  recuperoCT: number;
  valorResidual: number;
  prestamoRecibido: number;
  amortizacionDeuda: number;
  flujoCajaNeto: number;
}

export interface FinancialResult {
  cashFlow: CashFlowYear[];
  van: number;
  tir: number;
  payback: number;
  breakeven: number;
}

export interface FinancialOutputs {
  flujoPuro: FinancialResult;
  flujoInversionista: FinancialResult;
}

export type SensitivityVariable =
  | 'precio'
  | 'demanda'
  | 'costoInsumo'
  | 'arriendo'
  | 'sueldo'
  | 'tasaBanco'
  | 'tasaDescuento';

export interface SensitivityResult {
  variable: SensitivityVariable;
  delta: number;
  vanPuro: number;
  vanInversionista: number;
  impactoVanPuro: number;
  impactoVanInv: number;
}

export interface AmortizationRow {
  periodo: number;
  cuota: number;
  intereses: number;
  amortizacion: number;
  saldo: number;
}
