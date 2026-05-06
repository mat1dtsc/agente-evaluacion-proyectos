/**
 * Catálogo de sectores retail food en Chile con presets reales.
 *
 * Cada sector incluye:
 *  - Inversión típica (con desglose por equipamiento + costos referenciales 2024-2025)
 *  - Estructura de costos (variables, fijos no laborales)
 *  - Planilla de personal recomendada (cargos + sueldos brutos)
 *  - Demanda base y rango (pesimista/base/optimista)
 *  - Tasa costo capital sugerida (según riesgo del rubro)
 *  - Fuentes de cada cifra
 *
 * NOTA: los precios de equipamiento son referenciales 2024-2025 en CLP, sin IVA,
 * basados en proveedores HORECA (Princess, Distribuidor Cafetero, Hipermercado
 * de Cocina) y Mercado Libre Chile. Pueden iterarse con cotizaciones reales.
 */

import type { CargoPersonal } from './personal';
import type { ProjectInputs } from './types';

export interface EquipoSector {
  item: string;
  costoCLP: number;
  vidaUtilSII: number; // años según tabla SII
  notas?: string;
}

export interface SectorPreset {
  id: string;
  nombre: string;
  emoji: string;
  descripcion: string;
  ejemploReal: string;
  /** Riesgo del rubro 1=bajo, 5=muy alto. Calibra la Tcc sugerida. */
  riesgo: 1 | 2 | 3 | 4 | 5;
  inversion: {
    desglose: EquipoSector[];
    capitalTrabajoMeses: number; // meses de egresos a cubrir
    permisosIniciales: number;   // patente, sanitaria, manipulador, etc.
  };
  operacion: {
    ticketPromedio: number;
    costoVariableUnitario: number;
    costosFijosNoLaboralesMensuales: number;  // arriendo + servicios + insumos no var
    diasOperacionAno: number;
    crecimientoDemandaAnual: number;
    horizonteAnos: number;
  };
  personal: CargoPersonal[];
  demanda: {
    base: number;     // unidades/día base
    pesimista: number;
    optimista: number;
    unidad: string;   // 'combos/día', 'platos/día', etc.
  };
  financiamiento: {
    porcentajeDeudaSugerido: number;
    tasaBancoPYME: number;        // referencial banca PYME 2024-2025
    plazoDeudaAnos: number;
    tasaCostoCapital: number;     // Tcc sugerida según riesgo
  };
  fuentes: string[];
}

/**
 * Tasa de costo de capital sugerida según riesgo del rubro.
 * Base: 12% (default curso EVP). Ajuste por riesgo: ±1.5% por nivel.
 */
const TCC_POR_RIESGO: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 0.10,  // muy bajo (panadería tradicional)
  2: 0.115, // bajo
  3: 0.13,  // medio (default rubros food retail)
  4: 0.145, // alto (formato innovador, ticket bajo)
  5: 0.16,  // muy alto (food truck, dark kitchen sin marca)
};

export const SECTORES_RETAIL_FOOD: SectorPreset[] = [
  // ========== 1. CAFÉ EXPRESS ==========
  {
    id: 'cafe_express',
    nombre: 'Café Express (combo único)',
    emoji: '☕',
    descripcion: 'Barra de café con combo único (espresso + croissant). 1 barista, ticket alto, sin servicio en mesa. Ideal zonas oficina/universitarias.',
    ejemploReal: 'Drip Café, R3 Coffee, Café del Mundo barra',
    riesgo: 3,
    inversion: {
      desglose: [
        { item: 'Máquina espresso 2-grupos profesional (Astoria/La Cimbali)', costoCLP: 8_500_000, vidaUtilSII: 7 },
        { item: 'Molino cónico semiautomático', costoCLP: 1_200_000, vidaUtilSII: 5 },
        { item: 'Vitrina refrigerada croissants', costoCLP: 1_800_000, vidaUtilSII: 7 },
        { item: 'Mobiliario y barra (carpintería a medida)', costoCLP: 5_500_000, vidaUtilSII: 10 },
        { item: 'Caja registradora + POS + lector tarjetas', costoCLP: 650_000, vidaUtilSII: 5 },
        { item: 'Habilitación eléctrica trifásica + sanitaria', costoCLP: 3_200_000, vidaUtilSII: 20 },
        { item: 'Letrero, diseño marca, branding', costoCLP: 1_150_000, vidaUtilSII: 5 },
        { item: 'Filtro descalcificador + suavizador agua', costoCLP: 850_000, vidaUtilSII: 10 },
        { item: 'Tazas, vasos, utensilios iniciales', costoCLP: 600_000, vidaUtilSII: 3 },
        { item: 'Sistema sonido ambiental', costoCLP: 350_000, vidaUtilSII: 5 },
        { item: 'Mesas y sillas (zona consumo)', costoCLP: 2_800_000, vidaUtilSII: 7 },
        { item: 'Otros equipos menores y reservas', costoCLP: 3_400_000, vidaUtilSII: 5 },
      ],
      capitalTrabajoMeses: 4,
      permisosIniciales: 700_000,
    },
    operacion: {
      ticketPromedio: 3_500,
      costoVariableUnitario: 900,
      costosFijosNoLaboralesMensuales: 1_900_000, // arriendo 1.2M + servicios 300k + insumos 400k
      diasOperacionAno: 312,
      crecimientoDemandaAnual: 0.05,
      horizonteAnos: 5,
    },
    personal: [
      { cargo: 'Barista jefe', cantidad: 1, sueldoBrutoMensual: 850_000, jornada: 'completa' },
      { cargo: 'Barista', cantidad: 1, sueldoBrutoMensual: 650_000, jornada: 'completa' },
      { cargo: 'Cajero/Asistente tarde', cantidad: 1, sueldoBrutoMensual: 580_000, jornada: 'completa' },
      { cargo: 'Reemplazo/Aseo (½ jornada)', cantidad: 1, sueldoBrutoMensual: 510_636, jornada: 'parcial' },
    ],
    demanda: { base: 80, pesimista: 50, optimista: 130, unidad: 'combos/día' },
    financiamiento: {
      porcentajeDeudaSugerido: 0.40,
      tasaBancoPYME: 0.10,
      plazoDeudaAnos: 5,
      tasaCostoCapital: TCC_POR_RIESGO[3],
    },
    fuentes: [
      'Procafé/ANCC: ticket promedio cafetería Chile ≈ $3.200',
      'Princess Food Service: catálogo equipamiento HORECA 2025',
      'INE Encuesta CASEN: sueldos sector hostelería',
    ],
  },

  // ========== 2. CAFÉ DE ESPECIALIDAD CON CARTA ==========
  {
    id: 'cafe_especialidad',
    nombre: 'Café de Especialidad',
    emoji: '🫖',
    descripcion: 'Tercera ola: café de origen, brunch, repostería propia, leche vegetal. Ticket más alto, requiere barista certificado.',
    ejemploReal: 'Sustainable Coffee, Wonder Coffee, Café Triciclo',
    riesgo: 4,
    inversion: {
      desglose: [
        { item: 'Máquina espresso 3-grupos top (La Marzocco/Slayer)', costoCLP: 14_000_000, vidaUtilSII: 7 },
        { item: 'Molino cónico premium (EK43/Mahlkönig)', costoCLP: 3_500_000, vidaUtilSII: 5 },
        { item: 'Tostador 1kg (para tostar in-house)', costoCLP: 6_500_000, vidaUtilSII: 10, notas: 'opcional, eleva margen' },
        { item: 'Equipos cold brew + V60 + Chemex', costoCLP: 850_000, vidaUtilSII: 5 },
        { item: 'Vitrina refrigerada repostería profesional', costoCLP: 3_200_000, vidaUtilSII: 7 },
        { item: 'Cocina compacta + plancha + horno combinado', costoCLP: 4_800_000, vidaUtilSII: 10 },
        { item: 'Mobiliario y diseño interior', costoCLP: 12_000_000, vidaUtilSII: 10 },
        { item: 'Habilitación eléctrica + sanitaria + ventilación', costoCLP: 5_500_000, vidaUtilSII: 20 },
        { item: 'Letrero, diseño marca, identidad visual', costoCLP: 2_200_000, vidaUtilSII: 5 },
        { item: 'POS multi-terminal', costoCLP: 1_400_000, vidaUtilSII: 5 },
        { item: 'Cristalería, vajilla, utensilios', costoCLP: 2_500_000, vidaUtilSII: 3 },
        { item: 'Mesas y sillas 30 puestos', costoCLP: 5_500_000, vidaUtilSII: 7 },
      ],
      capitalTrabajoMeses: 5,
      permisosIniciales: 950_000,
    },
    operacion: {
      ticketPromedio: 7_500,
      costoVariableUnitario: 2_100,
      costosFijosNoLaboralesMensuales: 4_200_000, // arriendo 2.5M + servicios 600k + insumos 1.1M
      diasOperacionAno: 312,
      crecimientoDemandaAnual: 0.07,
      horizonteAnos: 5,
    },
    personal: [
      { cargo: 'Barista jefe certificado SCA', cantidad: 1, sueldoBrutoMensual: 1_200_000, jornada: 'completa' },
      { cargo: 'Barista', cantidad: 2, sueldoBrutoMensual: 750_000, jornada: 'completa' },
      { cargo: 'Cocinero/Pastelero', cantidad: 1, sueldoBrutoMensual: 950_000, jornada: 'completa' },
      { cargo: 'Garzón/Mesero', cantidad: 2, sueldoBrutoMensual: 600_000, jornada: 'completa' },
      { cargo: 'Aseo', cantidad: 1, sueldoBrutoMensual: 510_636, jornada: 'completa' },
    ],
    demanda: { base: 90, pesimista: 60, optimista: 140, unidad: 'pedidos/día' },
    financiamiento: {
      porcentajeDeudaSugerido: 0.35,
      tasaBancoPYME: 0.105,
      plazoDeudaAnos: 6,
      tasaCostoCapital: TCC_POR_RIESGO[4],
    },
    fuentes: [
      'Specialty Coffee Association of Chile (estimaciones sector)',
      'Estudio Prochile: oportunidades café especialidad 2024',
    ],
  },

  // ========== 3. SANDWICHERÍA / COLACIONES ==========
  {
    id: 'sandwicheria',
    nombre: 'Sandwichería / Colaciones',
    emoji: '🥪',
    descripcion: 'Sándwiches gourmet, ensaladas, jugos. Almuerzo express para zona oficina. Alto volumen entre 12-15h.',
    ejemploReal: 'Tip y Tap, Sandwich Qbano, Colmado',
    riesgo: 3,
    inversion: {
      desglose: [
        { item: 'Plancha de mesa + parrilla profesional', costoCLP: 3_200_000, vidaUtilSII: 10 },
        { item: 'Vitrina refrigerada exhibidora frente público', costoCLP: 4_500_000, vidaUtilSII: 7 },
        { item: 'Cámara refrigeración back of house', costoCLP: 3_800_000, vidaUtilSII: 10 },
        { item: 'Tostadora industrial / sandwichera', costoCLP: 1_200_000, vidaUtilSII: 7 },
        { item: 'Licuadora + extractor jugos profesional', costoCLP: 950_000, vidaUtilSII: 5 },
        { item: 'Mesón trabajo acero inoxidable', costoCLP: 1_800_000, vidaUtilSII: 15 },
        { item: 'Habilitación eléctrica + sanitaria + extracción', costoCLP: 3_500_000, vidaUtilSII: 20 },
        { item: 'Mobiliario público (15 puestos)', costoCLP: 3_200_000, vidaUtilSII: 7 },
        { item: 'POS + lector tarjetas + delivery integration', costoCLP: 1_100_000, vidaUtilSII: 5 },
        { item: 'Letrero, diseño marca', costoCLP: 1_400_000, vidaUtilSII: 5 },
        { item: 'Vajilla, utensilios, packaging', costoCLP: 1_350_000, vidaUtilSII: 3 },
        { item: 'Otros (POS impresora cocina, etc)', costoCLP: 1_500_000, vidaUtilSII: 5 },
      ],
      capitalTrabajoMeses: 4,
      permisosIniciales: 850_000,
    },
    operacion: {
      ticketPromedio: 5_500,
      costoVariableUnitario: 1_800,
      costosFijosNoLaboralesMensuales: 2_800_000,
      diasOperacionAno: 252, // solo lun-vie típico oficina
      crecimientoDemandaAnual: 0.04,
      horizonteAnos: 5,
    },
    personal: [
      { cargo: 'Cocinero jefe', cantidad: 1, sueldoBrutoMensual: 950_000, jornada: 'completa' },
      { cargo: 'Ayudante cocina', cantidad: 1, sueldoBrutoMensual: 620_000, jornada: 'completa' },
      { cargo: 'Cajero/Atención mostrador', cantidad: 2, sueldoBrutoMensual: 580_000, jornada: 'completa' },
      { cargo: 'Repartidor', cantidad: 1, sueldoBrutoMensual: 550_000, jornada: 'parcial' },
    ],
    demanda: { base: 120, pesimista: 80, optimista: 200, unidad: 'pedidos/día' },
    financiamiento: {
      porcentajeDeudaSugerido: 0.45,
      tasaBancoPYME: 0.105,
      plazoDeudaAnos: 5,
      tasaCostoCapital: TCC_POR_RIESGO[3],
    },
    fuentes: ['Encuesta Achiga 2024 sandwicherías', 'Distribuidor HORECA Chile'],
  },

  // ========== 4. COMIDA RÁPIDA / HAMBURGUESERÍA ==========
  {
    id: 'hamburgueseria',
    nombre: 'Hamburguesería / Smash',
    emoji: '🍔',
    descripcion: 'Hamburguesas premium smash + papas. Take away + delivery. Ticket medio-alto, alto turnover.',
    ejemploReal: 'Streat Burger, La Burguesía, Bestia Burger',
    riesgo: 4,
    inversion: {
      desglose: [
        { item: 'Plancha smash burger industrial 2 zonas', costoCLP: 5_500_000, vidaUtilSII: 10 },
        { item: 'Freidora doble cuba 20L + filtro aceite', costoCLP: 3_200_000, vidaUtilSII: 7 },
        { item: 'Cámara refrigeración + congelador', costoCLP: 5_800_000, vidaUtilSII: 10 },
        { item: 'Vitrina refrigerada armadora', costoCLP: 2_200_000, vidaUtilSII: 7 },
        { item: 'Mesón trabajo acero inoxidable + extractor', costoCLP: 4_500_000, vidaUtilSII: 15 },
        { item: 'Habilitación eléctrica + ducto extracción', costoCLP: 6_500_000, vidaUtilSII: 20 },
        { item: 'Mobiliario público (25 puestos)', costoCLP: 4_500_000, vidaUtilSII: 7 },
        { item: 'POS multi-terminal + KDS cocina', costoCLP: 1_800_000, vidaUtilSII: 5 },
        { item: 'Letrero, diseño marca, identidad', costoCLP: 2_500_000, vidaUtilSII: 5 },
        { item: 'Otros equipos menores', costoCLP: 2_500_000, vidaUtilSII: 5 },
      ],
      capitalTrabajoMeses: 4,
      permisosIniciales: 950_000,
    },
    operacion: {
      ticketPromedio: 9_500,
      costoVariableUnitario: 3_400,
      costosFijosNoLaboralesMensuales: 3_500_000,
      diasOperacionAno: 360,
      crecimientoDemandaAnual: 0.06,
      horizonteAnos: 5,
    },
    personal: [
      { cargo: 'Chef ejecutivo', cantidad: 1, sueldoBrutoMensual: 1_350_000, jornada: 'completa' },
      { cargo: 'Cocinero', cantidad: 2, sueldoBrutoMensual: 850_000, jornada: 'completa' },
      { cargo: 'Ayudante cocina', cantidad: 2, sueldoBrutoMensual: 580_000, jornada: 'completa' },
      { cargo: 'Cajero/Mesero', cantidad: 2, sueldoBrutoMensual: 600_000, jornada: 'completa' },
    ],
    demanda: { base: 100, pesimista: 60, optimista: 180, unidad: 'pedidos/día' },
    financiamiento: {
      porcentajeDeudaSugerido: 0.40,
      tasaBancoPYME: 0.11,
      plazoDeudaAnos: 5,
      tasaCostoCapital: TCC_POR_RIESGO[4],
    },
    fuentes: ['Achiga: estudio segmento hamburgueserías 2024'],
  },

  // ========== 5. HELADERÍA ARTESANAL ==========
  {
    id: 'heladeria',
    nombre: 'Heladería Artesanal',
    emoji: '🍦',
    descripcion: 'Helado artesanal de elaboración propia. Estacional fuerte (oct-marzo). Ticket bajo, alto volumen.',
    ejemploReal: 'Emporio La Rosa, Café Mosqueto, Iceberg',
    riesgo: 4,
    inversion: {
      desglose: [
        { item: 'Mantecadora horizontal 12L profesional', costoCLP: 7_500_000, vidaUtilSII: 10 },
        { item: 'Pasteurizador-tina 30L', costoCLP: 5_200_000, vidaUtilSII: 10 },
        { item: 'Vitrina exhibidora 18 sabores', costoCLP: 4_800_000, vidaUtilSII: 7 },
        { item: 'Congelador de almacenamiento back', costoCLP: 2_500_000, vidaUtilSII: 10 },
        { item: 'Cubas porta sabores + utensilios', costoCLP: 850_000, vidaUtilSII: 5 },
        { item: 'Mesón trabajo + lavado triple', costoCLP: 1_800_000, vidaUtilSII: 15 },
        { item: 'Habilitación eléctrica + sanitaria', costoCLP: 3_500_000, vidaUtilSII: 20 },
        { item: 'Mobiliario público (20 puestos)', costoCLP: 3_500_000, vidaUtilSII: 7 },
        { item: 'POS + lector tarjetas', costoCLP: 750_000, vidaUtilSII: 5 },
        { item: 'Letrero + diseño marca', costoCLP: 1_400_000, vidaUtilSII: 5 },
        { item: 'Otros menores', costoCLP: 1_200_000, vidaUtilSII: 5 },
      ],
      capitalTrabajoMeses: 6, // alta estacionalidad
      permisosIniciales: 850_000,
    },
    operacion: {
      ticketPromedio: 4_200,
      costoVariableUnitario: 1_400,
      costosFijosNoLaboralesMensuales: 2_400_000,
      diasOperacionAno: 270,
      crecimientoDemandaAnual: 0.04,
      horizonteAnos: 5,
    },
    personal: [
      { cargo: 'Heladero/Maestro', cantidad: 1, sueldoBrutoMensual: 1_100_000, jornada: 'completa' },
      { cargo: 'Ayudante producción', cantidad: 1, sueldoBrutoMensual: 620_000, jornada: 'completa' },
      { cargo: 'Atención público', cantidad: 2, sueldoBrutoMensual: 580_000, jornada: 'completa' },
      { cargo: 'Refuerzo verano', cantidad: 1, sueldoBrutoMensual: 510_636, jornada: 'parcial' },
    ],
    demanda: { base: 110, pesimista: 60, optimista: 220, unidad: 'porciones/día' },
    financiamiento: {
      porcentajeDeudaSugerido: 0.35,
      tasaBancoPYME: 0.105,
      plazoDeudaAnos: 5,
      tasaCostoCapital: TCC_POR_RIESGO[4],
    },
    fuentes: ['ANCC reporte heladería Chile', 'Estudio estacionalidad comercio Achiga'],
  },

  // ========== 6. PANADERÍA BOUTIQUE ==========
  {
    id: 'panaderia',
    nombre: 'Panadería Boutique',
    emoji: '🥖',
    descripcion: 'Pan de masa madre, viennoiserie, sándwiches al paso. Cliente fiel diario. Margen estable.',
    ejemploReal: 'Pan Pa\' Yá, La Fete, Boulangerie Hojas',
    riesgo: 2,
    inversion: {
      desglose: [
        { item: 'Horno de piso 8 bandejas profesional', costoCLP: 9_500_000, vidaUtilSII: 15 },
        { item: 'Amasadora espiral 25kg', costoCLP: 4_200_000, vidaUtilSII: 10 },
        { item: 'Cámara fermentación controlada', costoCLP: 4_800_000, vidaUtilSII: 10 },
        { item: 'Mesa trabajo + divisora pan', costoCLP: 3_200_000, vidaUtilSII: 15 },
        { item: 'Vitrina exhibidora climatizada', costoCLP: 3_500_000, vidaUtilSII: 7 },
        { item: 'Refrigeración back of house', costoCLP: 2_800_000, vidaUtilSII: 10 },
        { item: 'Habilitación eléctrica trifásica + sanitaria', costoCLP: 4_500_000, vidaUtilSII: 20 },
        { item: 'Mobiliario público + barra', costoCLP: 3_500_000, vidaUtilSII: 7 },
        { item: 'POS + balanza con etiquetas', costoCLP: 950_000, vidaUtilSII: 5 },
        { item: 'Letrero + diseño marca', costoCLP: 1_400_000, vidaUtilSII: 5 },
        { item: 'Otros menores', costoCLP: 1_650_000, vidaUtilSII: 5 },
      ],
      capitalTrabajoMeses: 3,
      permisosIniciales: 850_000,
    },
    operacion: {
      ticketPromedio: 6_800,
      costoVariableUnitario: 2_200,
      costosFijosNoLaboralesMensuales: 2_900_000,
      diasOperacionAno: 360,
      crecimientoDemandaAnual: 0.04,
      horizonteAnos: 6,
    },
    personal: [
      { cargo: 'Maestro panadero', cantidad: 1, sueldoBrutoMensual: 1_300_000, jornada: 'completa' },
      { cargo: 'Ayudante panadero (turno noche)', cantidad: 1, sueldoBrutoMensual: 720_000, jornada: 'completa' },
      { cargo: 'Pastelero', cantidad: 1, sueldoBrutoMensual: 950_000, jornada: 'completa' },
      { cargo: 'Atención público', cantidad: 2, sueldoBrutoMensual: 580_000, jornada: 'completa' },
    ],
    demanda: { base: 140, pesimista: 90, optimista: 220, unidad: 'tickets/día' },
    financiamiento: {
      porcentajeDeudaSugerido: 0.45,
      tasaBancoPYME: 0.095,
      plazoDeudaAnos: 7,
      tasaCostoCapital: TCC_POR_RIESGO[2],
    },
    fuentes: ['Indupan: estudio panadería Chile 2024', 'CORFO: programa Capital Abeja'],
  },

  // ========== 7. JUGUERÍA / SMOOTHIE BOWLS ==========
  {
    id: 'jugueria',
    nombre: 'Juguería / Smoothie Bowls',
    emoji: '🥤',
    descripcion: 'Jugos verdes, smoothie bowls, opción saludable. Ticket medio. Cliente recurrente fitness/oficina.',
    ejemploReal: 'Quintral, Berlin Coffee, BeFresh',
    riesgo: 4,
    inversion: {
      desglose: [
        { item: 'Extractor jugos cold-press industrial', costoCLP: 4_500_000, vidaUtilSII: 7 },
        { item: 'Licuadora alta potencia (Vitamix x2)', costoCLP: 1_800_000, vidaUtilSII: 5 },
        { item: 'Cámara refrigeración fruta', costoCLP: 3_500_000, vidaUtilSII: 10 },
        { item: 'Vitrina exhibidora bebidas envasadas', costoCLP: 1_800_000, vidaUtilSII: 7 },
        { item: 'Mesón trabajo + área preparación', costoCLP: 2_200_000, vidaUtilSII: 15 },
        { item: 'Habilitación eléctrica + sanitaria', costoCLP: 2_500_000, vidaUtilSII: 20 },
        { item: 'Mobiliario público (12 puestos)', costoCLP: 2_400_000, vidaUtilSII: 7 },
        { item: 'POS + integraciones delivery', costoCLP: 950_000, vidaUtilSII: 5 },
        { item: 'Letrero + branding', costoCLP: 1_350_000, vidaUtilSII: 5 },
        { item: 'Packaging eco-friendly inicial', costoCLP: 800_000, vidaUtilSII: 3 },
        { item: 'Otros menores', costoCLP: 1_200_000, vidaUtilSII: 5 },
      ],
      capitalTrabajoMeses: 4,
      permisosIniciales: 850_000,
    },
    operacion: {
      ticketPromedio: 5_200,
      costoVariableUnitario: 2_000,
      costosFijosNoLaboralesMensuales: 2_400_000,
      diasOperacionAno: 312,
      crecimientoDemandaAnual: 0.06,
      horizonteAnos: 5,
    },
    personal: [
      { cargo: 'Operador jugos jefe', cantidad: 1, sueldoBrutoMensual: 850_000, jornada: 'completa' },
      { cargo: 'Operador jugos', cantidad: 1, sueldoBrutoMensual: 620_000, jornada: 'completa' },
      { cargo: 'Cajero/Atención', cantidad: 2, sueldoBrutoMensual: 580_000, jornada: 'completa' },
    ],
    demanda: { base: 90, pesimista: 60, optimista: 150, unidad: 'pedidos/día' },
    financiamiento: {
      porcentajeDeudaSugerido: 0.40,
      tasaBancoPYME: 0.10,
      plazoDeudaAnos: 5,
      tasaCostoCapital: TCC_POR_RIESGO[4],
    },
    fuentes: ['Estudio sector wellness food Achiga 2024'],
  },

  // ========== 8. SUSHI TO-GO ==========
  {
    id: 'sushi_togo',
    nombre: 'Sushi To-Go',
    emoji: '🍣',
    descripcion: 'Pickup + delivery. Sin servicio mesa. Margen alto, requiere chef sushiman + cuchillería.',
    ejemploReal: 'Sushi Roll, Misushi, Niu Sushi',
    riesgo: 3,
    inversion: {
      desglose: [
        { item: 'Cámara refrigeración pescados', costoCLP: 5_500_000, vidaUtilSII: 10 },
        { item: 'Mesa sushi neta + tabla profesional', costoCLP: 2_800_000, vidaUtilSII: 15 },
        { item: 'Cocedor arroz industrial 12kg', costoCLP: 1_200_000, vidaUtilSII: 7 },
        { item: 'Cuchillería profesional (set yanagi/deba)', costoCLP: 1_500_000, vidaUtilSII: 5 },
        { item: 'Freidora 1 cuba (rolls fritos)', costoCLP: 1_800_000, vidaUtilSII: 7 },
        { item: 'Vitrina display productos', costoCLP: 2_200_000, vidaUtilSII: 7 },
        { item: 'Habilitación + extracción + sanitaria', costoCLP: 4_200_000, vidaUtilSII: 20 },
        { item: 'POS + integraciones (Rappi/Uber/PedidosYa)', costoCLP: 1_400_000, vidaUtilSII: 5 },
        { item: 'Mobiliario delivery pickup', costoCLP: 1_500_000, vidaUtilSII: 7 },
        { item: 'Letrero + branding', costoCLP: 1_500_000, vidaUtilSII: 5 },
        { item: 'Packaging delivery profesional', costoCLP: 1_100_000, vidaUtilSII: 3 },
        { item: 'Otros menores', costoCLP: 1_300_000, vidaUtilSII: 5 },
      ],
      capitalTrabajoMeses: 4,
      permisosIniciales: 1_100_000,
    },
    operacion: {
      ticketPromedio: 14_500,
      costoVariableUnitario: 5_500,
      costosFijosNoLaboralesMensuales: 3_200_000,
      diasOperacionAno: 360,
      crecimientoDemandaAnual: 0.05,
      horizonteAnos: 5,
    },
    personal: [
      { cargo: 'Chef sushiman jefe', cantidad: 1, sueldoBrutoMensual: 1_500_000, jornada: 'completa' },
      { cargo: 'Sushiman', cantidad: 2, sueldoBrutoMensual: 950_000, jornada: 'completa' },
      { cargo: 'Ayudante cocina/empaque', cantidad: 1, sueldoBrutoMensual: 620_000, jornada: 'completa' },
      { cargo: 'Atención pickup/cajero', cantidad: 1, sueldoBrutoMensual: 580_000, jornada: 'completa' },
    ],
    demanda: { base: 70, pesimista: 40, optimista: 130, unidad: 'pedidos/día' },
    financiamiento: {
      porcentajeDeudaSugerido: 0.40,
      tasaBancoPYME: 0.105,
      plazoDeudaAnos: 5,
      tasaCostoCapital: TCC_POR_RIESGO[3],
    },
    fuentes: ['Achiga estudio comida japonesa Chile 2024'],
  },

  // ========== 9. RESTAURANT CASUAL FAMILIAR ==========
  {
    id: 'restaurant_casual',
    nombre: 'Restaurant Casual',
    emoji: '🍽️',
    descripcion: 'Restaurant tradicional con servicio mesa. Almuerzo + cena. Carta amplia. Mayor inversión y planilla.',
    ejemploReal: 'Liguria, La Mar, El Hoyo',
    riesgo: 4,
    inversion: {
      desglose: [
        { item: 'Cocina industrial completa (6 quemadores + plancha + horno)', costoCLP: 12_000_000, vidaUtilSII: 15 },
        { item: 'Cámara refrigeración 2 cuerpos', costoCLP: 7_500_000, vidaUtilSII: 10 },
        { item: 'Freidora doble + salamandra', costoCLP: 3_500_000, vidaUtilSII: 7 },
        { item: 'Mesones trabajo + extractor industrial', costoCLP: 5_500_000, vidaUtilSII: 15 },
        { item: 'Lavavajillas industrial', costoCLP: 4_200_000, vidaUtilSII: 10 },
        { item: 'Bar + cafetera + máquina cerveza', costoCLP: 4_800_000, vidaUtilSII: 7 },
        { item: 'Mobiliario público (40 puestos)', costoCLP: 8_500_000, vidaUtilSII: 7 },
        { item: 'Vajilla, cristalería, mantelería', costoCLP: 3_500_000, vidaUtilSII: 3 },
        { item: 'Habilitación eléctrica + sanitaria + extracción', costoCLP: 9_500_000, vidaUtilSII: 20 },
        { item: 'POS multi-terminal + KDS + reservas', costoCLP: 2_500_000, vidaUtilSII: 5 },
        { item: 'Decoración + diseño interior', costoCLP: 7_500_000, vidaUtilSII: 10 },
        { item: 'Letrero + branding', costoCLP: 2_000_000, vidaUtilSII: 5 },
      ],
      capitalTrabajoMeses: 5,
      permisosIniciales: 1_400_000,
    },
    operacion: {
      ticketPromedio: 18_000,
      costoVariableUnitario: 6_500,
      costosFijosNoLaboralesMensuales: 6_500_000,
      diasOperacionAno: 312,
      crecimientoDemandaAnual: 0.04,
      horizonteAnos: 6,
    },
    personal: [
      { cargo: 'Chef ejecutivo', cantidad: 1, sueldoBrutoMensual: 2_200_000, jornada: 'completa' },
      { cargo: 'Sous chef', cantidad: 1, sueldoBrutoMensual: 1_400_000, jornada: 'completa' },
      { cargo: 'Cocinero línea', cantidad: 3, sueldoBrutoMensual: 850_000, jornada: 'completa' },
      { cargo: 'Ayudante cocina', cantidad: 2, sueldoBrutoMensual: 620_000, jornada: 'completa' },
      { cargo: 'Lavaloza', cantidad: 1, sueldoBrutoMensual: 510_636, jornada: 'completa' },
      { cargo: 'Garzón', cantidad: 4, sueldoBrutoMensual: 600_000, jornada: 'completa' },
      { cargo: 'Cajero/host', cantidad: 1, sueldoBrutoMensual: 700_000, jornada: 'completa' },
      { cargo: 'Bartender', cantidad: 1, sueldoBrutoMensual: 850_000, jornada: 'completa' },
    ],
    demanda: { base: 70, pesimista: 40, optimista: 120, unidad: 'cubiertos/día' },
    financiamiento: {
      porcentajeDeudaSugerido: 0.45,
      tasaBancoPYME: 0.11,
      plazoDeudaAnos: 7,
      tasaCostoCapital: TCC_POR_RIESGO[4],
    },
    fuentes: ['Achiga: rentabilidad sector restaurant Chile 2024'],
  },

  // ========== 10. DARK KITCHEN / SOLO DELIVERY ==========
  {
    id: 'dark_kitchen',
    nombre: 'Dark Kitchen / Cocina Fantasma',
    emoji: '👻',
    descripcion: 'Solo delivery (Rappi/Uber/PedidosYa). Sin atención público. Ubicación industrial barata. Bajo capex.',
    ejemploReal: 'Lupita Pizza, Foodology, KitchenLab',
    riesgo: 5,
    inversion: {
      desglose: [
        { item: 'Cocina industrial 4 quemadores + plancha', costoCLP: 4_500_000, vidaUtilSII: 15 },
        { item: 'Horno combinado o pizza', costoCLP: 5_500_000, vidaUtilSII: 10 },
        { item: 'Cámara refrigeración', costoCLP: 4_500_000, vidaUtilSII: 10 },
        { item: 'Freidora + salamandra', costoCLP: 2_500_000, vidaUtilSII: 7 },
        { item: 'Mesones trabajo + extractor', costoCLP: 3_500_000, vidaUtilSII: 15 },
        { item: 'Habilitación eléctrica + sanitaria', costoCLP: 4_500_000, vidaUtilSII: 20 },
        { item: 'Tablet POS + integraciones aggregators', costoCLP: 850_000, vidaUtilSII: 5 },
        { item: 'Equipo packaging delivery', costoCLP: 1_500_000, vidaUtilSII: 5 },
        { item: 'Branding digital + fotografía producto', costoCLP: 2_500_000, vidaUtilSII: 3 },
        { item: 'Otros menores', costoCLP: 2_000_000, vidaUtilSII: 5 },
      ],
      capitalTrabajoMeses: 4,
      permisosIniciales: 750_000,
    },
    operacion: {
      ticketPromedio: 11_000,
      costoVariableUnitario: 4_400, // incluye comisión delivery aggregators ≈ 25%
      costosFijosNoLaboralesMensuales: 1_800_000, // arriendo industrial barato
      diasOperacionAno: 360,
      crecimientoDemandaAnual: 0.08,
      horizonteAnos: 4,
    },
    personal: [
      { cargo: 'Chef jefe', cantidad: 1, sueldoBrutoMensual: 1_200_000, jornada: 'completa' },
      { cargo: 'Cocinero', cantidad: 2, sueldoBrutoMensual: 750_000, jornada: 'completa' },
      { cargo: 'Empacador/Despacho', cantidad: 1, sueldoBrutoMensual: 580_000, jornada: 'completa' },
    ],
    demanda: { base: 60, pesimista: 30, optimista: 130, unidad: 'pedidos/día' },
    financiamiento: {
      porcentajeDeudaSugerido: 0.30,
      tasaBancoPYME: 0.115,
      plazoDeudaAnos: 4,
      tasaCostoCapital: TCC_POR_RIESGO[5],
    },
    fuentes: ['Achiga: estudio dark kitchens RM 2024', 'Reporte Rappi Chile cocinas virtuales'],
  },
];

/** Calcula la inversión total agregando el desglose */
export function inversionTotal(sector: SectorPreset): number {
  return sector.inversion.desglose.reduce((s, e) => s + e.costoCLP, 0);
}

/** Construye ProjectInputs default a partir de un sector elegido */
export function applySectorToInputs(sector: SectorPreset): Partial<ProjectInputs> {
  const invTotal = inversionTotal(sector);
  // Vida útil para depreciación: promedio ponderado por costo
  const vidaPromedio = sector.inversion.desglose.reduce(
    (s, e) => s + e.vidaUtilSII * e.costoCLP, 0,
  ) / Math.max(1, invTotal);

  // Capital trabajo = N meses × egresos mensuales (cobertura operacional)
  const planillaMensual = sector.personal.reduce(
    (s, p) => s + p.cantidad * p.sueldoBrutoMensual * 1.47, 0, // factor 1.47 cargas
  );
  const egresosMensualTotal = sector.operacion.costosFijosNoLaboralesMensuales
    + planillaMensual
    + sector.operacion.costoVariableUnitario * sector.demanda.base * (sector.operacion.diasOperacionAno / 12);
  const capitalTrabajo = Math.round(egresosMensualTotal * sector.inversion.capitalTrabajoMeses);

  return {
    inversionInicial: invTotal,
    capitalTrabajo,
    vidaUtilAnos: sector.operacion.horizonteAnos,
    combosPorDiaBase: sector.demanda.base,
    diasOperacionAno: sector.operacion.diasOperacionAno,
    crecimientoDemanda: sector.operacion.crecimientoDemandaAnual,
    ticketPromedio: sector.operacion.ticketPromedio,
    costoVariableUnitario: sector.operacion.costoVariableUnitario,
    costosFijosMensuales: sector.operacion.costosFijosNoLaboralesMensuales + planillaMensual,
    costosFijosNoLaboralesMensuales: sector.operacion.costosFijosNoLaboralesMensuales,
    tasaImpuesto: 0.25, // Pro PYME default
    tasaCostoCapital: sector.financiamiento.tasaCostoCapital,
    porcentajeDeuda: sector.financiamiento.porcentajeDeudaSugerido,
    tasaBanco: sector.financiamiento.tasaBancoPYME,
    plazoDeudaAnos: sector.financiamiento.plazoDeudaAnos,
    depreciacionAnos: Math.round(vidaPromedio),
    valorResidual: Math.round(invTotal * 0.10), // 10% del capex como valor residual
    crecimientoPerpetuidad: 0.02,
    personal: sector.personal,
    proPyme: true,
  };
}
