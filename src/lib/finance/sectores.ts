/**
 * Catálogo de FORMATOS de cafetería en Chile con presets reales 2024-2025.
 *
 * Este agente está enfocado EXCLUSIVAMENTE en proyectos cafeteros.
 * No incluye otros rubros retail food (heladería, restaurant, sushi, etc.).
 *
 * Cada formato incluye:
 *  - Inversión típica (con desglose por equipamiento + costos referenciales)
 *  - Estructura de costos (variables, fijos no laborales)
 *  - Planilla de personal recomendada con leyes sociales chilenas
 *  - Demanda base y rango (pesimista/base/optimista)
 *  - Tasa costo capital sugerida (según riesgo del formato)
 *  - Fuentes de cada cifra
 *
 * Precios de equipamiento: proveedores HORECA Chile 2024-2025
 * (Princess Food Service, Distribuidor Cafetero, Mercado Libre Chile).
 */

import type { CargoPersonal } from './personal';
import type { ProjectInputs } from './types';

export interface EquipoSector {
  item: string;
  costoCLP: number;
  vidaUtilSII: number;
  notas?: string;
}

export interface SectorPreset {
  id: string;
  nombre: string;
  emoji: string;
  descripcion: string;
  ejemploReal: string;
  riesgo: 1 | 2 | 3 | 4 | 5;
  inversion: {
    desglose: EquipoSector[];
    capitalTrabajoMeses: number;
    permisosIniciales: number;
  };
  operacion: {
    ticketPromedio: number;
    costoVariableUnitario: number;
    costosFijosNoLaboralesMensuales: number;
    diasOperacionAno: number;
    crecimientoDemandaAnual: number;
    horizonteAnos: number;
  };
  personal: CargoPersonal[];
  demanda: {
    base: number;
    pesimista: number;
    optimista: number;
    unidad: string;
  };
  financiamiento: {
    porcentajeDeudaSugerido: number;
    tasaBancoPYME: number;
    plazoDeudaAnos: number;
    tasaCostoCapital: number;
  };
  fuentes: string[];
}

const TCC_POR_RIESGO: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 0.10, 2: 0.115, 3: 0.13, 4: 0.145, 5: 0.16,
};

export const SECTORES_RETAIL_FOOD: SectorPreset[] = [
  // ========== 1. CAFÉ EXPRESS — COMBO ÚNICO ENVASADO (BASE DEL PROYECTO) ==========
  {
    id: 'cafe_express',
    nombre: 'Café Express · Combo Envasado',
    emoji: '☕',
    descripcion: 'Modelo simple: espresso preparado al momento + producto envasado del proveedor (croissant, sandwich o snack en pack individual sellado). SIN cocina, SIN preparación de alimentos. Solo bebida caliente + retail. 1-2 baristas, ticket medio-alto, alta rotación. Ideal zonas oficina con flujo peatonal en horario punta.',
    ejemploReal: 'Stand-up coffee bar tipo barra alta · Cafés en lobby corporativo · Modelo "Drip Café compact"',
    riesgo: 2,
    inversion: {
      desglose: [
        { item: 'Máquina espresso 2-grupos semiautomática', costoCLP: 6_500_000, vidaUtilSII: 7, notas: 'Modelo simple sin tecnología avanzada' },
        { item: 'Molino cónico semiautomático', costoCLP: 1_100_000, vidaUtilSII: 5 },
        { item: 'Vitrina refrigerada compacta para alimentos envasados', costoCLP: 1_200_000, vidaUtilSII: 7, notas: 'Solo display + cadena de frío, no exhibidora gourmet' },
        { item: 'Mobiliario y barra (carpintería simple a medida)', costoCLP: 3_500_000, vidaUtilSII: 10 },
        { item: 'POS + lector tarjetas + impresora boletas', costoCLP: 650_000, vidaUtilSII: 5 },
        { item: 'Habilitación eléctrica + sanitaria básica', costoCLP: 2_200_000, vidaUtilSII: 20, notas: 'Sin extracción industrial, sin lavavajillas grado HORECA' },
        { item: 'Letrero + diseño marca + branding', costoCLP: 950_000, vidaUtilSII: 5 },
        { item: 'Filtro descalcificador agua', costoCLP: 550_000, vidaUtilSII: 10 },
        { item: 'Vasos take-away iniciales + tapas + sleeves + accesorios', costoCLP: 450_000, vidaUtilSII: 3 },
        { item: '4 mesas altas + 8 piso (zona consumo rápido)', costoCLP: 1_500_000, vidaUtilSII: 7 },
        { item: 'Permisos + curso manipuladores + resolución sanitaria SEREMI', costoCLP: 700_000, vidaUtilSII: 3, notas: 'Categoría "manipulación mínima" + 2 cert manipuladores' },
        { item: 'Otros equipos menores + reservas + contingencia 5%', costoCLP: 1_200_000, vidaUtilSII: 5 },
      ],
      capitalTrabajoMeses: 4,
      permisosIniciales: 700_000,
    },
    operacion: {
      ticketPromedio: 3_500,
      costoVariableUnitario: 1_100, // alimento envasado tiene mayor margen pagado al proveedor
      costosFijosNoLaboralesMensuales: 1_500_000, // arriendo modular menor + servicios + insumos no var
      diasOperacionAno: 312,
      crecimientoDemandaAnual: 0.05,
      horizonteAnos: 5,
    },
    personal: [
      { cargo: 'Barista jefe (manipulador certificado)', cantidad: 1, sueldoBrutoMensual: 850_000, jornada: 'completa' },
      { cargo: 'Barista turno tarde (manipulador certificado)', cantidad: 1, sueldoBrutoMensual: 650_000, jornada: 'completa' },
      { cargo: 'Reemplazo días libres / aseo', cantidad: 1, sueldoBrutoMensual: 510_636, jornada: 'parcial' },
    ],
    demanda: { base: 80, pesimista: 50, optimista: 130, unidad: 'combos/día' },
    financiamiento: {
      porcentajeDeudaSugerido: 0.40,
      tasaBancoPYME: 0.095,
      plazoDeudaAnos: 5,
      tasaCostoCapital: TCC_POR_RIESGO[2], // riesgo bajo: modelo simple, baja exposición sanitaria
    },
    fuentes: [
      'Procafé/ANCC: ticket promedio cafetería Chile ≈ $3.200',
      'Princess Food Service: catálogo equipamiento HORECA 2025',
      'DS 977/96 categoría manipulación mínima: SEREMI Salud RM',
      'Convenio Procafé-INACAP: cursos manipuladores certificados',
    ],
  },

  // ========== 2. CAFÉ DE ESPECIALIDAD (THIRD WAVE) ==========
  {
    id: 'cafe_especialidad',
    nombre: 'Café de Especialidad (third wave)',
    emoji: '🫖',
    descripcion: 'Café de origen, métodos de filtrado (V60, Chemex, Aeropress), repostería propia, leche vegetal. Ticket alto, requiere barista certificado SCA. Cliente fiel y educado en café.',
    ejemploReal: 'Sustainable Coffee · Wonder Coffee · Café Triciclo · Vinílico',
    riesgo: 4,
    inversion: {
      desglose: [
        { item: 'Máquina espresso 3-grupos top (La Marzocco/Slayer)', costoCLP: 14_000_000, vidaUtilSII: 7 },
        { item: 'Molino cónico premium (EK43/Mahlkönig)', costoCLP: 3_500_000, vidaUtilSII: 5 },
        { item: 'Equipos métodos: V60 + Chemex + Aeropress + Cold Brew', costoCLP: 950_000, vidaUtilSII: 5 },
        { item: 'Báscula barista digital + termómetros', costoCLP: 350_000, vidaUtilSII: 5 },
        { item: 'Vitrina refrigerada repostería profesional', costoCLP: 3_200_000, vidaUtilSII: 7 },
        { item: 'Cocina compacta para repostería propia + horno', costoCLP: 4_800_000, vidaUtilSII: 10 },
        { item: 'Mobiliario y diseño interior (madera + cobre)', costoCLP: 12_000_000, vidaUtilSII: 10 },
        { item: 'Habilitación eléctrica + sanitaria + ventilación', costoCLP: 5_500_000, vidaUtilSII: 20 },
        { item: 'Letrero, diseño marca, identidad visual', costoCLP: 2_200_000, vidaUtilSII: 5 },
        { item: 'POS multi-terminal + integraciones', costoCLP: 1_400_000, vidaUtilSII: 5 },
        { item: 'Cristalería barista + tazas profesionales', costoCLP: 2_500_000, vidaUtilSII: 3 },
        { item: 'Mesas y sillas (30 puestos comodidad alta)', costoCLP: 5_500_000, vidaUtilSII: 7 },
      ],
      capitalTrabajoMeses: 5,
      permisosIniciales: 950_000,
    },
    operacion: {
      ticketPromedio: 7_500,
      costoVariableUnitario: 2_100,
      costosFijosNoLaboralesMensuales: 4_200_000,
      diasOperacionAno: 312,
      crecimientoDemandaAnual: 0.07,
      horizonteAnos: 5,
    },
    personal: [
      { cargo: 'Barista jefe certificado SCA', cantidad: 1, sueldoBrutoMensual: 1_200_000, jornada: 'completa' },
      { cargo: 'Barista', cantidad: 2, sueldoBrutoMensual: 750_000, jornada: 'completa' },
      { cargo: 'Pastelero/Cocinero', cantidad: 1, sueldoBrutoMensual: 950_000, jornada: 'completa' },
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

  // ========== 3. CAFÉ TRADICIONAL CON CARTA AMPLIA ==========
  {
    id: 'cafe_tradicional',
    nombre: 'Café Tradicional con Carta',
    emoji: '🥐',
    descripcion: 'Café clásico con carta amplia: brunch, sándwiches, jugos, postres, té. Servicio en mesa. Cliente recurrente que viene a almorzar, leer prensa, reuniones de trabajo informal.',
    ejemploReal: 'Café Tavelli · Café Haití (premium) · La Maestranza · Plaza España',
    riesgo: 3,
    inversion: {
      desglose: [
        { item: 'Máquina espresso 2-grupos profesional', costoCLP: 7_500_000, vidaUtilSII: 7 },
        { item: 'Molino cónico', costoCLP: 1_100_000, vidaUtilSII: 5 },
        { item: 'Plancha + sandwichera profesional', costoCLP: 2_800_000, vidaUtilSII: 7 },
        { item: 'Cocina industrial 4 quemadores + horno', costoCLP: 5_500_000, vidaUtilSII: 15 },
        { item: 'Cámara refrigeración 2 cuerpos', costoCLP: 5_500_000, vidaUtilSII: 10 },
        { item: 'Vitrina refrigerada exhibidora postres y sándwiches', costoCLP: 3_500_000, vidaUtilSII: 7 },
        { item: 'Lavavajillas industrial', costoCLP: 3_200_000, vidaUtilSII: 10 },
        { item: 'Habilitación eléctrica + sanitaria + extracción cocina', costoCLP: 6_500_000, vidaUtilSII: 20 },
        { item: 'Mobiliario público (40 puestos en mesa)', costoCLP: 7_500_000, vidaUtilSII: 7 },
        { item: 'Vajilla, cristalería, mantelería', costoCLP: 2_200_000, vidaUtilSII: 3 },
        { item: 'POS + KDS cocina + reservas', costoCLP: 1_800_000, vidaUtilSII: 5 },
        { item: 'Letrero + decoración interior + branding', costoCLP: 4_500_000, vidaUtilSII: 7 },
      ],
      capitalTrabajoMeses: 5,
      permisosIniciales: 1_100_000,
    },
    operacion: {
      ticketPromedio: 9_500,
      costoVariableUnitario: 3_200,
      costosFijosNoLaboralesMensuales: 4_800_000,
      diasOperacionAno: 360,
      crecimientoDemandaAnual: 0.04,
      horizonteAnos: 6,
    },
    personal: [
      { cargo: 'Chef/Cocinero jefe', cantidad: 1, sueldoBrutoMensual: 1_400_000, jornada: 'completa' },
      { cargo: 'Cocinero línea', cantidad: 2, sueldoBrutoMensual: 850_000, jornada: 'completa' },
      { cargo: 'Ayudante cocina', cantidad: 1, sueldoBrutoMensual: 620_000, jornada: 'completa' },
      { cargo: 'Barista jefe', cantidad: 1, sueldoBrutoMensual: 950_000, jornada: 'completa' },
      { cargo: 'Barista', cantidad: 1, sueldoBrutoMensual: 700_000, jornada: 'completa' },
      { cargo: 'Garzón/Mesero', cantidad: 3, sueldoBrutoMensual: 600_000, jornada: 'completa' },
      { cargo: 'Cajero/Host', cantidad: 1, sueldoBrutoMensual: 700_000, jornada: 'completa' },
      { cargo: 'Aseo/Lavaloza', cantidad: 1, sueldoBrutoMensual: 510_636, jornada: 'completa' },
    ],
    demanda: { base: 110, pesimista: 70, optimista: 180, unidad: 'cubiertos/día' },
    financiamiento: {
      porcentajeDeudaSugerido: 0.45,
      tasaBancoPYME: 0.105,
      plazoDeudaAnos: 6,
      tasaCostoCapital: TCC_POR_RIESGO[3],
    },
    fuentes: [
      'Achiga: rentabilidad sector cafetería tradicional 2024',
      'Procafé: consumo de café Chile, share por canal',
    ],
  },

  // ========== 4. CAFÉ FRANQUICIA / CADENA INTERNACIONAL ==========
  {
    id: 'cafe_franquicia',
    nombre: 'Café Franquicia',
    emoji: '🏪',
    descripcion: 'Operar bajo marca consolidada (franquicia o cadena con know-how). Mayor capex (canon + royalty + decoración estándar) pero curva de aprendizaje corta y demanda esperada por marca.',
    ejemploReal: 'Starbucks · Juan Valdez · Dunkin (formato Chile) · Café Capital',
    riesgo: 3,
    inversion: {
      desglose: [
        { item: 'Canon de entrada / fee inicial franquicia', costoCLP: 15_000_000, vidaUtilSII: 5, notas: 'Amortización 5 años aprox' },
        { item: 'Máquina espresso especificación marca', costoCLP: 12_000_000, vidaUtilSII: 7 },
        { item: 'Molinos automáticos doble', costoCLP: 2_500_000, vidaUtilSII: 5 },
        { item: 'Vitrinas refrigeradas múltiples (línea fría)', costoCLP: 5_500_000, vidaUtilSII: 7 },
        { item: 'Mobiliario y decoración estándar de marca', costoCLP: 18_000_000, vidaUtilSII: 7 },
        { item: 'Habilitación + obra menor', costoCLP: 8_500_000, vidaUtilSII: 20 },
        { item: 'POS + integraciones marca + contabilidad', costoCLP: 2_200_000, vidaUtilSII: 5 },
        { item: 'Letrero certificado de marca', costoCLP: 3_500_000, vidaUtilSII: 5 },
        { item: 'Inventario inicial vajilla y consumibles brand', costoCLP: 2_500_000, vidaUtilSII: 3 },
        { item: 'Mesas y sillas estándar marca', costoCLP: 4_500_000, vidaUtilSII: 7 },
        { item: 'Capacitación personal en metodología marca', costoCLP: 1_500_000, vidaUtilSII: 3 },
        { item: 'Marketing apertura + reservas', costoCLP: 2_500_000, vidaUtilSII: 3 },
      ],
      capitalTrabajoMeses: 4,
      permisosIniciales: 1_400_000,
    },
    operacion: {
      ticketPromedio: 5_500,
      costoVariableUnitario: 1_500, // mayor margen por compra centralizada
      costosFijosNoLaboralesMensuales: 4_200_000, // arriendo + servicios + royalty 6-8% ventas
      diasOperacionAno: 360,
      crecimientoDemandaAnual: 0.06,
      horizonteAnos: 7,
    },
    personal: [
      { cargo: 'Store manager', cantidad: 1, sueldoBrutoMensual: 1_400_000, jornada: 'completa' },
      { cargo: 'Subgerente / Shift supervisor', cantidad: 1, sueldoBrutoMensual: 950_000, jornada: 'completa' },
      { cargo: 'Barista certificado marca', cantidad: 3, sueldoBrutoMensual: 720_000, jornada: 'completa' },
      { cargo: 'Cajero', cantidad: 2, sueldoBrutoMensual: 600_000, jornada: 'completa' },
      { cargo: 'Aseo', cantidad: 1, sueldoBrutoMensual: 510_636, jornada: 'completa' },
    ],
    demanda: { base: 200, pesimista: 130, optimista: 320, unidad: 'tickets/día' },
    financiamiento: {
      porcentajeDeudaSugerido: 0.50,
      tasaBancoPYME: 0.10, // mejor tasa por respaldo marca
      plazoDeudaAnos: 7,
      tasaCostoCapital: TCC_POR_RIESGO[3],
    },
    fuentes: [
      'Asociación Chilena de Franquicias',
      'Reporte Starbucks Chile (Inmobiliaria EuroAmerica)',
      'Estudio Achiga: franchising vs independiente RM',
    ],
  },

  // ========== 5. CAFÉ TO-GO / KIOSCO DE PASO ==========
  {
    id: 'cafe_kiosco',
    nombre: 'Café Kiosco / To-Go',
    emoji: '🪟',
    descripcion: 'Formato chico (4-12 m²) ventana al exterior, sin asientos. Bajo capex, alto volumen de ventas en horario punta. Ideal Metro, esquinas oficina, accesos universitarios.',
    ejemploReal: 'Cafés en estaciones Metro · Bonafide carrito · Café Spot interior',
    riesgo: 2,
    inversion: {
      desglose: [
        { item: 'Máquina espresso 1-grupo automática (Mavam/Sanremo)', costoCLP: 4_500_000, vidaUtilSII: 7 },
        { item: 'Molino cónico compacto', costoCLP: 950_000, vidaUtilSII: 5 },
        { item: 'Vitrina refrigerada chica', costoCLP: 1_200_000, vidaUtilSII: 7 },
        { item: 'Bajo mesón refrigerado leches', costoCLP: 1_800_000, vidaUtilSII: 10 },
        { item: 'Mesón trabajo acero inoxidable compacto', costoCLP: 1_200_000, vidaUtilSII: 15 },
        { item: 'Habilitación obra menor + sanitaria', costoCLP: 2_200_000, vidaUtilSII: 20 },
        { item: 'POS portable + lector', costoCLP: 550_000, vidaUtilSII: 5 },
        { item: 'Letrero + branding chico', costoCLP: 850_000, vidaUtilSII: 5 },
        { item: 'Vasos take-away iniciales + tapas + sleeves', costoCLP: 650_000, vidaUtilSII: 3 },
        { item: 'Otros menores (cuchara, servilleteros, etc)', costoCLP: 750_000, vidaUtilSII: 5 },
      ],
      capitalTrabajoMeses: 3,
      permisosIniciales: 600_000,
    },
    operacion: {
      ticketPromedio: 2_800,
      costoVariableUnitario: 700,
      costosFijosNoLaboralesMensuales: 950_000, // arriendo bajo + servicios
      diasOperacionAno: 312,
      crecimientoDemandaAnual: 0.06,
      horizonteAnos: 5,
    },
    personal: [
      { cargo: 'Barista jefe', cantidad: 1, sueldoBrutoMensual: 750_000, jornada: 'completa' },
      { cargo: 'Barista turno tarde', cantidad: 1, sueldoBrutoMensual: 600_000, jornada: 'completa' },
      { cargo: 'Reemplazo días libres', cantidad: 1, sueldoBrutoMensual: 510_636, jornada: 'parcial' },
    ],
    demanda: { base: 130, pesimista: 80, optimista: 220, unidad: 'tickets/día' },
    financiamiento: {
      porcentajeDeudaSugerido: 0.35,
      tasaBancoPYME: 0.10,
      plazoDeudaAnos: 4,
      tasaCostoCapital: TCC_POR_RIESGO[2],
    },
    fuentes: [
      'Procafé: formato café-kiosco rentabilidad',
      'Mercado Libre HORECA: precios equipamiento compact',
    ],
  },

  // ========== 6. CAFÉ COWORKING ==========
  {
    id: 'cafe_coworking',
    nombre: 'Café + Coworking',
    emoji: '💻',
    descripcion: 'Café con espacios de trabajo (mesas amplias, enchufes, wifi premium, salas reuniones). Modelo dual: ticket de barra + suscripciones mensuales/diarias del coworking.',
    ejemploReal: 'Wonder Coffee · The Office Coffee · Berlin Coworking',
    riesgo: 4,
    inversion: {
      desglose: [
        { item: 'Máquina espresso 2-grupos pro', costoCLP: 7_500_000, vidaUtilSII: 7 },
        { item: 'Molino cónico', costoCLP: 1_200_000, vidaUtilSII: 5 },
        { item: 'Vitrina + bajo mesón refrigerado', costoCLP: 3_500_000, vidaUtilSII: 7 },
        { item: 'Cocina compacta para almuerzos saludables', costoCLP: 3_200_000, vidaUtilSII: 10 },
        { item: 'Mobiliario coworking (40 puestos + sala reuniones x2)', costoCLP: 18_000_000, vidaUtilSII: 7 },
        { item: 'Sistema eléctrico múltiple + cableado red', costoCLP: 4_500_000, vidaUtilSII: 20 },
        { item: 'Habilitación + sanitaria + acústica', costoCLP: 5_500_000, vidaUtilSII: 20 },
        { item: 'Wifi pro + redes internas + servidor reservas', costoCLP: 2_200_000, vidaUtilSII: 5 },
        { item: 'Letrero + branding + decoración', costoCLP: 3_500_000, vidaUtilSII: 7 },
        { item: 'POS + sistema reservas salas + suscripciones', costoCLP: 2_500_000, vidaUtilSII: 5 },
        { item: 'Vajilla + ergonomía sillas + lockers', costoCLP: 4_500_000, vidaUtilSII: 7 },
        { item: 'Pantallas + proyectores salas reuniones', costoCLP: 2_500_000, vidaUtilSII: 5 },
      ],
      capitalTrabajoMeses: 6,
      permisosIniciales: 1_200_000,
    },
    operacion: {
      ticketPromedio: 8_500, // mix barra + day pass
      costoVariableUnitario: 2_300,
      costosFijosNoLaboralesMensuales: 6_500_000, // arriendo alto (mayor m²) + internet pro + servicios
      diasOperacionAno: 312,
      crecimientoDemandaAnual: 0.08,
      horizonteAnos: 6,
    },
    personal: [
      { cargo: 'Barista jefe + community manager', cantidad: 1, sueldoBrutoMensual: 1_100_000, jornada: 'completa' },
      { cargo: 'Barista', cantidad: 2, sueldoBrutoMensual: 720_000, jornada: 'completa' },
      { cargo: 'Cocinero almuerzos', cantidad: 1, sueldoBrutoMensual: 850_000, jornada: 'completa' },
      { cargo: 'Recepción / coworking host', cantidad: 1, sueldoBrutoMensual: 750_000, jornada: 'completa' },
      { cargo: 'Cajero/atención', cantidad: 1, sueldoBrutoMensual: 600_000, jornada: 'completa' },
      { cargo: 'Aseo', cantidad: 1, sueldoBrutoMensual: 510_636, jornada: 'completa' },
    ],
    demanda: { base: 80, pesimista: 50, optimista: 140, unidad: 'pases+barra/día' },
    financiamiento: {
      porcentajeDeudaSugerido: 0.40,
      tasaBancoPYME: 0.105,
      plazoDeudaAnos: 6,
      tasaCostoCapital: TCC_POR_RIESGO[4],
    },
    fuentes: [
      'Estudio CL Coworking: ARPU coworking RM 2024',
      'Procafé: tendencia café-trabajo en Chile post-COVID',
    ],
  },

  // ========== 7. CAFÉ TOSTADOR (ROASTERY) ==========
  {
    id: 'cafe_tostador',
    nombre: 'Café Tostador (Roastery)',
    emoji: '🔥',
    descripcion: 'Tueste in-house del café + barra de degustación + venta retail (bolsas) + venta mayorista a otros cafés. Modelo B2C+B2B con margen alto en grano tostado.',
    ejemploReal: 'Vinílico Roasters · Café Triciclo · Sustainable Coffee · Anthora',
    riesgo: 4,
    inversion: {
      desglose: [
        { item: 'Tostadora 5kg profesional (Probat/Giesen)', costoCLP: 22_000_000, vidaUtilSII: 15 },
        { item: 'Sistema extracción + filtros tueste', costoCLP: 4_500_000, vidaUtilSII: 15 },
        { item: 'Catador + cupping table + balanzas precisión', costoCLP: 1_800_000, vidaUtilSII: 5 },
        { item: 'Empacadora con válvula degas', costoCLP: 3_500_000, vidaUtilSII: 10 },
        { item: 'Máquina espresso 3-grupos top', costoCLP: 14_000_000, vidaUtilSII: 7 },
        { item: 'Molinos múltiples (espresso + filtro + bolsa)', costoCLP: 4_500_000, vidaUtilSII: 5 },
        { item: 'Vitrina retail (bolsas, accesorios)', costoCLP: 2_500_000, vidaUtilSII: 7 },
        { item: 'Bodega verde + climatizada', costoCLP: 4_500_000, vidaUtilSII: 15 },
        { item: 'Habilitación industrial liviana + sanitaria', costoCLP: 7_500_000, vidaUtilSII: 20 },
        { item: 'Mobiliario barra + área cupping pública', costoCLP: 6_500_000, vidaUtilSII: 10 },
        { item: 'Branding + diseño retail bolsas + e-commerce', costoCLP: 4_500_000, vidaUtilSII: 5 },
        { item: 'POS + integración facturación electrónica B2B', costoCLP: 1_800_000, vidaUtilSII: 5 },
      ],
      capitalTrabajoMeses: 6,
      permisosIniciales: 1_300_000,
    },
    operacion: {
      ticketPromedio: 12_000, // mix barra + bolsa retail (rentables)
      costoVariableUnitario: 3_500,
      costosFijosNoLaboralesMensuales: 4_500_000,
      diasOperacionAno: 312,
      crecimientoDemandaAnual: 0.10,
      horizonteAnos: 7,
    },
    personal: [
      { cargo: 'Maestro tostador (Q-grader)', cantidad: 1, sueldoBrutoMensual: 1_800_000, jornada: 'completa' },
      { cargo: 'Asistente tueste', cantidad: 1, sueldoBrutoMensual: 850_000, jornada: 'completa' },
      { cargo: 'Barista jefe', cantidad: 1, sueldoBrutoMensual: 1_100_000, jornada: 'completa' },
      { cargo: 'Barista', cantidad: 2, sueldoBrutoMensual: 720_000, jornada: 'completa' },
      { cargo: 'Vendedor retail + ecommerce', cantidad: 1, sueldoBrutoMensual: 800_000, jornada: 'completa' },
      { cargo: 'Despacho B2B + logística', cantidad: 1, sueldoBrutoMensual: 700_000, jornada: 'completa' },
    ],
    demanda: { base: 70, pesimista: 40, optimista: 130, unidad: 'tickets+bolsas/día' },
    financiamiento: {
      porcentajeDeudaSugerido: 0.45,
      tasaBancoPYME: 0.105,
      plazoDeudaAnos: 7,
      tasaCostoCapital: TCC_POR_RIESGO[4],
    },
    fuentes: [
      'SCA Chile: análisis sector tostadores especialidad',
      'Procafé: importaciones café verde Chile 2024',
      'Estudio mercado retail café gourmet (ProChile)',
    ],
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
    tasaImpuesto: 0.25,
    tasaCostoCapital: sector.financiamiento.tasaCostoCapital,
    porcentajeDeuda: sector.financiamiento.porcentajeDeudaSugerido,
    tasaBanco: sector.financiamiento.tasaBancoPYME,
    plazoDeudaAnos: sector.financiamiento.plazoDeudaAnos,
    depreciacionAnos: Math.round(vidaPromedio),
    valorResidual: Math.round(invTotal * 0.10),
    crecimientoPerpetuidad: 0.02,
    personal: sector.personal,
    proPyme: true,
  };
}
