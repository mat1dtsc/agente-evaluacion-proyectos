/**
 * Tipos compartidos del Asesor IA.
 *
 * `AdvisorContext` es el snapshot serializable que se envía a la función
 * serverless (o al motor determinístico local). `AdvisoryReport` es la
 * recomendación estructurada que consume el panel — idéntica venga de la IA
 * o de las reglas, salvo el campo `fuente`.
 */

export interface AdvisorContext {
  proyecto: string;
  ubicacion: { label: string; comuna?: string; lat: number; lng: number } | null;
  /** Score geográfico 0-100 por dimensión (de `computeScore`). Null si no hay ubicación con datos. */
  scoreGeo: {
    total: number;
    densidad: number;
    ingreso: number;
    transporte: number;
    competencia: number;
    equipamiento: number;
  } | null;
  finanzas: {
    vanPuro: number;
    tirPuro: number;
    paybackPuro: number;
    vanInv: number;
    tirInv: number;
    breakevenCombosDia: number;
    tcc: number;
  };
  competencia: { totalCafes: number } | null;
  demanda: { combosDiaBase: number; ticket: number } | null;
  /** Variables de sensibilidad con su impacto en VAN (CLP), para identificar drivers. */
  sensibilidadTop: Array<{ variable: string; impactoVan: number }>;
  escenario: string;
}

export interface AdvisoryReport {
  veredicto: 'Recomendado' | 'Aceptable con riesgo' | 'No conviene';
  resumen: string;
  fortalezas: string[];
  riesgos: string[];
  drivers: string[];
  siguientePaso: string;
  /** 'ia' si vino del modelo en la función serverless; 'reglas' si fue el fallback determinístico. */
  fuente: 'ia' | 'reglas';
}
