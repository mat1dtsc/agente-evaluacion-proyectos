# Datos de Movilidad — Roadmap y Fuentes Oficiales Chile

Este documento mapea **todas las fuentes oficiales chilenas de movilidad** que pueden alimentar el agente, su estado actual de integración y los pasos para incorporar las que aún no están.

---

## 🟢 Estado actual integrado

| Fuente | Archivo | Volumen | Cómo se usa |
|---|---|---|---|
| **Metro Santiago — afluencia anual** | `flujo_metro_estacion.json` | 128 estaciones | Pin con tamaño = afluencia (Memoria 2023) |
| **Metro Santiago — geometrías líneas** | `metro_lineas.json` | 7 líneas, 124 segmentos | PathLayer con colores oficiales L1-L6 + L4A |
| **RED Movilidad — rutas de bus** | `bus_red_movilidad.json` | 222 rutas, 26 operadores | PathLayer con color por línea (recorridos OSM `route=bus`) |
| **OSM — paraderos de bus en vivo** | runtime (Overpass) | ~5000 RM | HeatmapLayer + ScatterplotLayer al activar capa peatonal |
| **OSM — vías troncales** | runtime (Overpass) | dinámico | PathLayer motorway/trunk/primary |
| **SECTRA EOD 2012** | `perfil_horario_eod.json` | distribución horaria | Modula `getWeight` del HeatmapLayer según hora |

**Cobertura:** las geometrías reales del transporte público de Santiago están al 100% (Metro líneas + estaciones, RED rutas de bus, paraderos).

---

## 🟡 Pendientes de alta prioridad — URLs oficiales

### 1. DTPM RED — subidas/bajadas reales por paradero

- **Portal:** https://datos.gob.cl/dataset/red-de-transporte-publico-metropolitano-rtpm
- **Operador:** Directorio de Transporte Público Metropolitano (https://www.dtpm.cl/)
- **Formato:** CSV (~5 GB histórico desde 2014)
- **Granularidad:** subidas/bajadas por paradero × hora × día
- **Por qué importa:** reemplaza la estimación actual de "800 px/día por paradero" por datos reales. Permite calibrar `flujoPorParadero` específico para cada zona.
- **Cómo incorporar:**
  1. Descargar el CSV mensual del último período disponible
  2. Filtrar a la RM (todas las paradas) y agregar promedio diario por paradero
  3. Match espacial con paraderos OSM (KD-tree por proximidad < 30 m)
  4. Reemplazar valor en hook `useBusStopsRM` con campo `subidasDia`

### 2. GTFS oficial RED Movilidad

- **Acceso:** Solicitar a DTPM mediante formulario `gtfs@dtpm.cl` — el feed completo no está públicamente disponible.
- **Alternativas mientras tanto:**
  - Transitland (requiere API key gratis): https://transit.land/feeds/f-66j5-redmovilidad
  - OSM `route=bus network=Red` ← **ya integrado** (222 rutas)
- **Qué agrega vs OSM:** frecuencias, horarios, headways por línea, paraderos en orden, transbordos, calendario de excepciones
- **Implementación:**
  ```ts
  // Parsear GTFS zip → 4 tablas críticas
  // routes.txt + stops.txt + trips.txt + stop_times.txt
  // → derivar headway promedio por hora del día
  ```

### 3. Movilidad Abierta MTT

- **Portal:** https://www.movilidadabierta.cl/
- **Operador:** Subsecretaría de Transportes — MTT
- **Datasets relevantes:**
  - Encuestas Origen-Destino (EOD) por ciudad — base de datos MS Access
  - Velocidades comerciales por corredor RED
  - Tiempos de espera por paradero
  - Frecuencia de servicios
- **Formato:** depende del estudio (MDB, SHP, CSV)
- **Restricciones:** Ley 19.628 — datos anonimizados a nivel zona EOD (no individuales)

### 4. SECTRA — informes finales

- **Portal:** https://www.sectra.gob.cl
- **Biblioteca:** documentos PDF + bases de datos asociadas
- **Estudios disponibles públicamente:**
  - EOD San Carlos 2025 (en curso) — https://eodsancarlos.cl
  - EOD Casablanca — https://eodcasablanca.cl
  - Plan Maestro de Transporte Gran Concepción
  - Análisis de Servicios Estratégicos Locales (SEL) por comuna
- **Formato:** principalmente PDF + shapefiles ESRI + TransCAD (.rts/.net)

### 5. IDE-Chile — Infraestructura de Datos Geoespaciales

- **Portal:** https://www.ide.cl (Geoportal Nacional)
- **Datasets relevantes para movilidad:**
  - Trazado vial nacional (todas las rutas oficiales)
  - Red de ciclovías oficial (cuando existe en la región)
  - Estaciones de servicio
  - Equipamiento urbano público georreferenciado
- **Formato:** SHP, GeoJSON, WMS/WFS para servicios web
- **Cómo agregar:** ya hay capa `urban-equipment` con OSM. Para datos oficiales gubernamentales conviene usar WFS de IDE-Chile.

### 6. UOCT — Unidad Operativa de Control de Tránsito

- **Portal:** https://www.uoct.cl
- **Datos públicos:** estado del tránsito en tiempo real (no histórico abierto)
- **Datos restringidos:** flujo vehicular por intersección (acceso a investigadores con convenio MTT)
- **Mientras tanto:** se está usando OSM `highway=motorway|trunk|primary` para inferir jerarquía vial.

### 7. Mercado Público — datos de licitaciones

- **Portal:** https://www.mercadopublico.cl
- **Útil para:** especificaciones técnicas de licitaciones de transporte (rutas, tarifas, frecuencias contractuales)
- **Formato:** CSV, JSON, OCDS directamente desde la ficha de cada licitación
- **Caso de uso:** validar parámetros operacionales de las concesionarias.

---

## 🔴 Datasets propietarios / restringidos

Según Ley 19.628 y convenios MTT/SECTRA:

- **Datos crudos de las EOD** (registros individuales) — propiedad exclusiva de la Subsecretaría de Transportes
- **Mediciones SCAT/ITS UOCT** — uso institucional con convenio
- **Pedidos GTFS-RT en tiempo real** — requiere API key DTPM bajo convenio

Para acceder, contactar:
- DTPM — `contacto@dtpm.cl`
- SECTRA — `consultas@sectra.gob.cl`
- IDE-Chile — `contacto@ide.cl` (datos geoespaciales generalmente sin restricción)

---

## 📐 Formatos técnicos esperados

| Formato | Origen | Cómo procesarlo en el agente |
|---|---|---|
| **CSV** (datos.gob.cl, Mercado Público) | DTPM, MTT | Node.js fetch + parser stream → JSON |
| **MDB** (MS Access ≥2013) | EOD SECTRA | Convertir offline con `mdb-tools` → CSV → JSON |
| **SHP** (ESRI shapefile) | IDE-Chile, SECTRA | `shpjs` o conversión offline a GeoJSON |
| **TransCAD** (.rts, .net) | SECTRA modelado vial | Solo lectura con software TransCAD propietario; documentar y solicitar export GeoJSON al estudio |
| **GeoJSON / KML** | IDE-Chile WFS | Carga directa con `useQuery` + `loadDataset` |
| **GTFS zip** (text/csv comprimido) | DTPM oficial / Transitland | Parser dedicado en `lib/transit/gtfsParser.ts` |

---

## 🛠 Plan de incorporación priorizado

### Fase A — corto plazo (público, sin permisos)
1. ✅ **Rutas RED desde OSM** (222 líneas) — HECHO
2. ✅ **Geometrías Metro reales** (7 líneas) — HECHO
3. ⏳ **Capa de ciclovías OSM** (`highway=cycleway`) — fácil agregar como PathLayer adicional
4. ⏳ **Datos de Movilidad Abierta MTT** publicados (revisar mensualmente nuevos releases)

### Fase B — mediano plazo (requiere descarga manual)
1. **DTPM CSV subidas/bajadas** (5 GB históricos): script Node 22 stream-parser → matchear con paraderos OSM
2. **GTFS RED Movilidad**: solicitar formalmente a DTPM o vía Transitland API key
3. **Shapes IDE-Chile** trazado vial nacional: descargar SHP, convertir a GeoJSON

### Fase C — largo plazo (requiere convenios)
1. **EOD SECTRA en MDB**: convenio académico con Subsecretaría de Transportes
2. **Datos UOCT en tiempo real**: API key MTT
3. **Velocidades comerciales DTPM**: sólo a investigadores

---

## Variables del modelo de demanda — calibración

Actualmente el `DemandPanel` permite editar 3 factores:
- `factorResidentes` (default 50%): porcentaje de residentes que activa el área
- `flujoPorParadero` (default 800 px/día): subidas+bajadas estimadas por paradero
- `factorCapturaMetro` (default 5%): % de afluencia Metro que pasa cerca

**Cuando se incorpore DTPM real**, el `flujoPorParadero` se reemplazará por el dato específico de cada paradero (ya no será un slider; será un valor por nodo geocoreferenciado).

**Cuando se incorpore EOD**, podremos modelar:
- Matriz origen-destino real → demanda por hora del día
- Composición modal (% bus / Metro / auto / a pie) por zona
- Motivos del viaje (trabajo, estudio, ocio) → mejor estimación de share retail food

---

## Referencias bibliográficas relevantes

- DTPM (2023). Memoria Anual. https://www.metro.cl/corporativo/memoria-anual
- SECTRA (2014). Encuesta Origen Destino de Viajes 2012, Santiago. Documento técnico.
- Subsecretaría de Transportes. Plan Maestro de Transporte Urbano 2025.
- Ley 19.628 sobre Protección de la Vida Privada (1999). Aplicable a datos personales en EOD.
