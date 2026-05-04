# SOURCES.md — fuentes de datos del Agente

Cada JSON en `/public/data/` lleva header `_source`, `_retrieved`, `_url`, `_license`, `_isDemo`.
La UI muestra atribución en cada panel y la página `/settings` lista el estado de cada fuente.

## Estado por fuente — todas REAL

| Fuente | Archivo | Estado | Modo |
|---|---|---|---|
| BCN — comunas Chile (geojson) | `comunas_chile.geojson` | **REAL** | 34 polígonos reales de comunas RM (OSM, simplificados para rendimiento) |
| INE Censo 2017 + Proyección 2024 | `densidad_ine_2024.json` | **REAL** | Población, densidad, edad mediana, pirámide etaria por comuna |
| MDS — CASEN 2022 | `casen_2022_comuna.json` | **REAL** | Ingreso medio/mediano, quintil dominante, hogares, pobreza por comuna |
| Metro Santiago — Memoria 2023 | `flujo_metro_estacion.json` | **REAL** | 62 estaciones reales con afluencia anual de la Memoria |
| SECTRA — EOD 2012 | `perfil_horario_eod.json` | **REAL** | Distribución horaria de viajes (PT y vehicular) publicada por SECTRA |
| Procafé / ANCC | `procafe_consumo.json` | **REAL** | Consumo per cápita Chile + benchmarks regionales y ticket promedio |
| **OpenStreetMap (Overpass live)** | runtime, no JSON | **REAL** | Cafeterías, paraderos de bus (`highway=bus_stop`), vías principales (`highway~motorway\|trunk\|primary\|secondary`) consultadas en vivo al fijar el punto |
| **Nominatim** | runtime | **REAL** | Geocodificación pública con `countrycodes=cl` |

## Cómo refrescar

```bash
npm run etl              # corre todos los ETL idempotentes
```

Los datasets reales (INE, CASEN, Metro, SECTRA, Procafé) viven en JSON pre-poblados con cifras
publicadas. Los scripts ETL preservan el JSON existente si la fuente real está caída o cambia URL.

Los datos de OSM (cafés, paraderos, vías) se traen **en vivo desde el navegador** vía
[Overpass API](https://overpass-api.de) cada vez que se fija un punto. No se cachean en JSON.

## Notas sobre cobertura

- **Geometrías**: cada comuna del Gran Santiago se representa con su polígono real (no bounding box),
  obtenido desde OpenStreetMap con entre 145 y 1,990 vértices según la comuna. La simplificación
  preserva la forma reconocible manteniendo buen rendimiento en deck.gl.

- **DTPM RED**: en lugar de descargar el CSV histórico de subidas/bajadas (~5GB en datos.gob.cl),
  el agente usa los paraderos OSM live como proxy. Los paraderos OSM en la RM están bien mantenidos
  por la comunidad y reflejan la red operacional. El conteo y la posición son reales; las
  subidas/bajadas históricas (que SÍ requieren el CSV DTPM) no se muestran en el agente — en su
  lugar se usa el perfil horario tipo de la EOD 2012 SECTRA, que es la fuente oficial publicada
  para distribución temporal de viajes.

- **UOCT**: en lugar de la API histórica de flujo vehicular (que requiere acceso restringido),
  el agente identifica las **vías principales OSM** dentro del radio (motorway, trunk, primary,
  secondary). El número y tipo de vías es un proxy directo de la jerarquía vial real, y combinado
  con el perfil horario EOD 2012 da una estimación honesta del tránsito.

- **SECTRA EOD por zona**: el shapefile de zonas EOD 2012 está disponible públicamente pero
  requiere procesamiento offline con turf/geopandas. El agente NO usa zonas EOD; usa la
  distribución horaria publicada que sí está consolidada y publicada como gráfico.

## Plan post-V1

- Promover los paraderos OSM con datos de subidas/bajadas reales descargando el CSV DTPM y
  cruzándolos por proximidad espacial con los nodos OSM.
- Agregar shapefile EOD para asignar viajes específicos a polígonos en lugar del perfil horario
  agregado.
