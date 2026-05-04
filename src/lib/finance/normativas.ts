/**
 * Normativas y obligaciones aplicables a un retail food en Chile.
 *
 * Las cifras son referenciales 2025 — varían por comuna, tipo de actividad
 * y categoría de patente. Sirven de base para el plan de inversiones inicial
 * y el flujo de gastos legales recurrentes.
 *
 * Fuentes: Ley de Rentas Municipales (DL 3.063/79), DS 977/96 Reglamento
 * Sanitario de Alimentos, Código del Trabajo, SII, SEREMI de Salud RM.
 */

export interface NormativaChilena {
  codigo: string;
  nombre: string;
  organismo: string;
  descripcion: string;
  tipo: 'permiso_inicial' | 'recurrente_anual' | 'tributario' | 'laboral' | 'sanitario' | 'municipal' | 'otro';
  /** Costo CLP (puntual o anual según tipo) — null si no aplica costo directo */
  costoCLP: number | null;
  obligatorio: boolean;
  /** Norma legal de referencia */
  base_legal: string;
  /** Documentación requerida o pasos */
  tramite: string;
}

/** UTM (Unidad Tributaria Mensual) referencial 2025 */
export const UTM_2025 = 68_785;
/** UF (Unidad de Fomento) referencial 2025 (promedio) */
export const UF_2025 = 39_500;

export const NORMATIVAS_RETAIL_FOOD: NormativaChilena[] = [
  // ============== Permisos iniciales ==============
  {
    codigo: 'INICIO_ACTIV',
    nombre: 'Inicio de Actividades SII',
    organismo: 'Servicio de Impuestos Internos',
    descripcion: 'Trámite obligatorio para iniciar el giro comercial. Permite emitir facturas/boletas y obtener clave tributaria.',
    tipo: 'permiso_inicial',
    costoCLP: 0,
    obligatorio: true,
    base_legal: 'Art. 68 Código Tributario',
    tramite: 'Online en sii.cl, Form 4415. Código actividad sugerido: 561010 (cafés y restaurantes).',
  },
  {
    codigo: 'PATENTE_COMERCIAL',
    nombre: 'Patente Comercial Municipal',
    organismo: 'Municipalidad respectiva',
    descripcion: 'Autorización para operar en el territorio comunal. Tasa entre 0.25% y 0.5% del capital propio inicial declarado, con tope de 8.000 UTM (~$550M).',
    tipo: 'recurrente_anual',
    costoCLP: 350_000,  // estimado para café con capital inicial ~30M
    obligatorio: true,
    base_legal: 'DL 3.063/79 (Ley Rentas Municipales) Art. 24',
    tramite: 'Solicitud en Dirección de Rentas o Patentes de la Municipalidad. Requiere informe de zonificación, certificado SII, contrato/título de dominio.',
  },
  {
    codigo: 'INFORME_SANITARIO',
    nombre: 'Informe Sanitario SEREMI',
    organismo: 'SEREMI de Salud RM',
    descripcion: 'Resolución sanitaria favorable para elaboración y venta de alimentos. Requiere visita inspectiva.',
    tipo: 'sanitario',
    costoCLP: 280_000, // estimado: arancel SEREMI + adecuaciones
    obligatorio: true,
    base_legal: 'DS 977/96 Reglamento Sanitario de los Alimentos',
    tramite: 'Solicitud en SEREMI Salud RM, croquis de instalaciones, manual de procedimientos higiénico-sanitarios, certificado de manipuladores.',
  },
  {
    codigo: 'CURSO_MANIPULADORES',
    nombre: 'Curso Manipulador de Alimentos',
    organismo: 'OTEC autorizada / SEREMI Salud',
    descripcion: 'Certificación obligatoria para todo personal que manipule alimentos.',
    tipo: 'sanitario',
    costoCLP: 35_000, // por persona
    obligatorio: true,
    base_legal: 'Art. 60 DS 977/96',
    tramite: 'Curso de 10 horas en OTEC autorizada por SEREMI. Vigencia 3 años.',
  },
  {
    codigo: 'PERMISO_EDIFICACION',
    nombre: 'Permiso de Obra Menor / Recepción Final',
    organismo: 'Dirección de Obras Municipales',
    descripcion: 'Si hay remodelación del local, se requiere permiso de obra menor + recepción final.',
    tipo: 'permiso_inicial',
    costoCLP: 180_000, // estimado para obra menor
    obligatorio: false,
    base_legal: 'Ley General de Urbanismo y Construcciones, OGUC',
    tramite: 'Proyecto firmado por arquitecto, certificado de informaciones previas (CIP), boleta de garantía.',
  },

  // ============== Tributario ==============
  {
    codigo: 'IVA',
    nombre: 'IVA débito y crédito',
    organismo: 'SII',
    descripcion: 'Tasa 19%. El IVA débito (sobre ventas) se compensa con el IVA crédito (sobre compras). En el flujo se trabaja en valores netos; el IVA va en plantilla aparte.',
    tipo: 'tributario',
    costoCLP: null,
    obligatorio: true,
    base_legal: 'DL 825/74 Ley sobre Impuesto a las Ventas y Servicios',
    tramite: 'Declaración mensual Form 29 (todos los meses), pago hasta el 12 del mes siguiente.',
  },
  {
    codigo: 'IRPC_PYME',
    nombre: 'Impuesto de Primera Categoría — Régimen Pro PYME',
    organismo: 'SII',
    descripcion: 'Régimen Pro PYME (Art. 14 D N° 3): tasa 25% sobre utilidad. Beneficios: depreciación instantánea, gasto contado, exención de PPM si ventas < 50.000 UF.',
    tipo: 'tributario',
    costoCLP: null,
    obligatorio: true,
    base_legal: 'Art. 14 D N° 3 LIR (Ley 21.210)',
    tramite: 'Acogerse al régimen al iniciar actividades (Form 4415) o por declaración Form 22 anual.',
  },
  {
    codigo: 'PPM',
    nombre: 'Pagos Provisionales Mensuales (PPM)',
    organismo: 'SII',
    descripcion: 'Anticipo mensual del impuesto a la renta sobre ingresos brutos. Tasa Pro PYME desde 0% al inicio, escalando.',
    tipo: 'tributario',
    costoCLP: null,
    obligatorio: true,
    base_legal: 'Art. 84 LIR',
    tramite: 'Declaración mensual Form 29 junto al IVA.',
  },

  // ============== Laboral ==============
  {
    codigo: 'CONTRATO_TRABAJO',
    nombre: 'Contratos de Trabajo y Reglamento Interno',
    organismo: 'Dirección del Trabajo',
    descripcion: 'Todo trabajador requiere contrato escrito firmado dentro de 15 días. Si hay 10+ trabajadores, reglamento interno aprobado por DT y SEREMI Salud.',
    tipo: 'laboral',
    costoCLP: 0,
    obligatorio: true,
    base_legal: 'Código del Trabajo Art. 9 y 153',
    tramite: 'Registro Electrónico Laboral (REL) en dirtrab.cl. Plazo 15 días desde inicio de la relación laboral.',
  },
  {
    codigo: 'AFC',
    nombre: 'Seguro de Cesantía AFC',
    organismo: 'AFC Chile',
    descripcion: 'Cotización obligatoria — empleador 2.4% (indefinido) o 3% (plazo fijo) + trabajador 0.6% (solo indefinido).',
    tipo: 'laboral',
    costoCLP: null,
    obligatorio: true,
    base_legal: 'Ley 19.728',
    tramite: 'Pago mensual junto con remuneraciones (Previred).',
  },
  {
    codigo: 'MUTUAL',
    nombre: 'Adhesión Mutual de Seguridad',
    organismo: 'ACHS / Mutual de Seguridad / IST',
    descripcion: 'Cotización adicional 0.95% (base) — Ley 16.744. Cubre accidentes del trabajo y enfermedades profesionales.',
    tipo: 'laboral',
    costoCLP: null,
    obligatorio: true,
    base_legal: 'Ley 16.744',
    tramite: 'Adhesión a ACHS/Mutual al iniciar actividades. Cotización mensual con remuneraciones.',
  },
  {
    codigo: 'GRATIFICACION',
    nombre: 'Gratificación Legal (Art. 50 CT)',
    organismo: 'Dirección del Trabajo',
    descripcion: 'Pago anual obligatorio = 25% remuneraciones, con tope de 4.75 IMM al año (~$2.4M anuales en 2025) por trabajador.',
    tipo: 'laboral',
    costoCLP: null,
    obligatorio: true,
    base_legal: 'Art. 50 Código del Trabajo',
    tramite: 'Pago anual o mensual prorrateado. Constancia en liquidaciones.',
  },
  {
    codigo: 'IAS',
    nombre: 'Provisión Indemnización por Años de Servicio',
    organismo: 'Dirección del Trabajo',
    descripcion: 'Trabajadores con contrato indefinido tienen derecho a 1 mes de remuneración por año de servicio, con tope de 11 meses (Art. 163 CT).',
    tipo: 'laboral',
    costoCLP: null,
    obligatorio: true,
    base_legal: 'Art. 163 Código del Trabajo',
    tramite: 'Provisión contable mensual. Pago al término del contrato si la causal lo amerita.',
  },

  // ============== Otros ==============
  {
    codigo: 'PUBLICIDAD_VIA',
    nombre: 'Permiso publicidad vía pública',
    organismo: 'Municipalidad',
    descripcion: 'Si hay letrero, gigantografía o publicidad exterior visible.',
    tipo: 'municipal',
    costoCLP: 95_000, // estimado anual
    obligatorio: false,
    base_legal: 'Ordenanza Municipal (varía por comuna)',
    tramite: 'Solicitud en Dirección de Obras / Aseo y Ornato.',
  },
  {
    codigo: 'BASURA',
    nombre: 'Derecho de aseo (basura comercial)',
    organismo: 'Municipalidad',
    descripcion: 'Tarifa por retiro de residuos comerciales. Fija o variable según volumen.',
    tipo: 'municipal',
    costoCLP: 240_000, // estimado anual
    obligatorio: true,
    base_legal: 'Ley Rentas Municipales',
    tramite: 'Pago anual o trimestral en municipalidad respectiva.',
  },
  {
    codigo: 'ALARMA_INCENDIO',
    nombre: 'Sistema de extinción de incendios',
    organismo: 'Bomberos / SEC',
    descripcion: 'Extintores certificados, señalética de evacuación, salida de emergencia.',
    tipo: 'sanitario',
    costoCLP: 220_000, // inicial + recargas anuales
    obligatorio: true,
    base_legal: 'DS 369/96 MINECON, NCh 1430',
    tramite: 'Adquisición + certificación inicial + recarga anual obligatoria.',
  },
];

/** Suma de costos iniciales (permisos + obras + capacitaciones) */
export function costoInicialNormativo(): number {
  return NORMATIVAS_RETAIL_FOOD
    .filter((n) => n.tipo === 'permiso_inicial' || n.tipo === 'sanitario')
    .reduce((s, n) => s + (n.costoCLP ?? 0), 0);
}

/** Suma de costos anuales recurrentes (patente, basura, publicidad, etc.) */
export function costoAnualNormativo(): number {
  return NORMATIVAS_RETAIL_FOOD
    .filter((n) => n.tipo === 'recurrente_anual' || n.tipo === 'municipal')
    .reduce((s, n) => s + (n.costoCLP ?? 0), 0);
}

/** Régimen tributario sugerido según ventas anuales (UF) */
export function regimenTributarioSugerido(ventasAnualesCLP: number): {
  regimen: string;
  tasa: number;
  ventasUF: number;
  beneficios: string[];
  base_legal: string;
} {
  const ventasUF = ventasAnualesCLP / UF_2025;
  if (ventasUF <= 75_000) {
    return {
      regimen: 'Pro PYME General (14 D N° 3)',
      tasa: 0.25,
      ventasUF,
      beneficios: [
        'Tasa de impuesto reducida: 25% (vs. 27% general)',
        'Depreciación instantánea de activos físicos',
        'Reconocimiento de gasto al pago (caja), no al devengo',
        'Exención PPM si ventas < 50.000 UF',
        'Acceso a CORFO y otros instrumentos de fomento',
      ],
      base_legal: 'Art. 14 D N° 3 LIR · Ley 21.210',
    };
  }
  return {
    regimen: 'Régimen General Semi-Integrado (14 A)',
    tasa: 0.27,
    ventasUF,
    beneficios: [],
    base_legal: 'Art. 14 A LIR',
  };
}
