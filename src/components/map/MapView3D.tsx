import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import DeckGL from '@deck.gl/react';
import { MapView } from '@deck.gl/core';
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer, GeoJsonLayer, ScatterplotLayer, IconLayer, PolygonLayer, PathLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { METRO_COLORS } from '@/lib/geo/metroLines';
import { useProjectStore } from '@/store/projectStore';
import { useBusRoutes, useCasen, useComunasGeoJSON, useDensidad, useMetro, useMetroLineas } from '@/hooks/useDatasets';
import { useBusStopsNearby, useBusStopsRM, useCafesNearby, useTrafficStreetsNearby, useTrafficStreetsRM, useUrbanEquipmentRM } from '@/hooks/useOSMOverpass';
import { calcularTodas, scoreUbicacion, veredicto } from '@/lib/finance/cafeModel';
import { useSettingsStore } from '@/store/settingsStore';
import { usePerfilHorario } from '@/hooks/useDatasets';
import { GeocoderSearch } from './GeocoderSearch';
import { LayerControls } from './LayerControls';
import { RadiusSelector } from './RadiusSelector';
import { TimeFilter } from './TimeFilter';
import { Compass, Maximize2, Sun, Moon, Home } from 'lucide-react';

const TILE_LIGHT = [
  'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
  'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
  'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
  'https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
];
const TILE_DARK = [
  'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
];

const INITIAL_VIEW_STATE = {
  longitude: -70.6493,
  latitude: -33.4489,
  zoom: 10.4,
  pitch: 0,
  bearing: 0,
  minPitch: 0,
  maxPitch: 80,
};

const VIEW_3D = { pitch: 50, bearing: -15 };
const VIEW_2D = { pitch: 0, bearing: 0 };

type ViewState = typeof INITIAL_VIEW_STATE & { transitionDuration?: number };

// Sequential teal scale para densidad (#0f3a3f → #5cc4d4)
const TEAL_STOPS: Array<[number, number, number]> = [
  [218, 240, 242], [156, 213, 221], [92, 196, 212], [62, 167, 184],
  [37, 124, 138], [15, 58, 63],
];
// Sequential violet scale para ingreso (#2b1e44 → #d3a3eb)
const VIOLET_STOPS: Array<[number, number, number]> = [
  [243, 230, 250], [211, 163, 235], [171, 119, 215], [126, 85, 178],
  [78, 53, 130], [43, 30, 68],
];

const interpolateScale = (stops: Array<[number, number, number]>, t: number, alpha = 200): [number, number, number, number] => {
  const c = Math.min(1, Math.max(0, t)) * (stops.length - 1);
  const i = Math.floor(c);
  const f = c - i;
  const a = stops[i];
  const b = stops[Math.min(i + 1, stops.length - 1)];
  return [
    Math.round(a[0] + (b[0] - a[0]) * f),
    Math.round(a[1] + (b[1] - a[1]) * f),
    Math.round(a[2] + (b[2] - a[2]) * f),
    alpha,
  ];
};

const densityToRGB = (v: number, max: number): [number, number, number, number] =>
  interpolateScale(TEAL_STOPS, v / max, 195);

const incomeToRGB = (v: number, max: number): [number, number, number, number] =>
  interpolateScale(VIOLET_STOPS, v / max, 200);

interface Props {
  containerClassName?: string;
}

export function MapView3D({ containerClassName }: Props) {
  const location = useProjectStore((s) => s.location);
  const setLocation = useProjectStore((s) => s.setLocation);
  const radius = useProjectStore((s) => s.radiusMeters);
  const layers = useProjectStore((s) => s.activeLayers);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE);

  const { data: comunasGeo } = useComunasGeoJSON();
  const { data: densidad } = useDensidad();
  const { data: casen } = useCasen();
  const { data: metro } = useMetro();
  const { data: metroLineas } = useMetroLineas();
  const { data: busRoutes, isLoading: loadingBusRoutes } = useBusRoutes(layers.busRoutes);
  const { data: cafes } = useCafesNearby(location, radius);
  const { data: busStops } = useBusStopsNearby(location, radius);
  const { data: roads } = useTrafficStreetsNearby(location, radius);
  const { data: roadsRM, isLoading: loadingRoads } = useTrafficStreetsRM(layers.vehicular && !location);
  const { data: busStopsRM, isLoading: loadingPeatonal } = useBusStopsRM(layers.peatonal);
  const { data: urbanPois, isLoading: loadingEquipment } = useUrbanEquipmentRM(layers.equipamiento);
  const { data: perfil } = usePerfilHorario();
  const dayType = useProjectStore((s) => s.dayType);
  const hour = useProjectStore((s) => s.hour);

  // Intensity multiplier según hora seleccionada (0..1, peak en hora punta)
  const hourlyIntensity = useMemo(() => {
    const series = perfil?.perfilTransportePublico[dayType];
    if (!series) return 1;
    const max = Math.max(...series, 1);
    return Math.max(0.15, (series[hour] ?? max * 0.5) / max);
  }, [perfil, dayType, hour]);

  // Indexed maps for fast lookup
  const dataIndex = useMemo(() => {
    const dens = new Map<string, { dens: number; pob: number; areaKm2: number }>();
    densidad?.data.forEach((d) => dens.set(d.codigo, { dens: d.densidad, pob: d.poblacion2024, areaKm2: d.areaKm2 }));
    const ing = new Map<string, number>();
    casen?.data.forEach((d) => ing.set(d.codigo, d.ingresoMedio));
    return { dens, ing };
  }, [densidad, casen]);

  const setActiveTab = useProjectStore((s) => s.setActiveTab);
  const setHighlightedComuna = useProjectStore((s) => s.setHighlightedComuna);
  const highlightedComuna = useProjectStore((s) => s.highlightedComuna);
  const selectedLocationId = useProjectStore((s) => s.selectedLocationId);
  const setSelectedLocationId = useProjectStore((s) => s.setSelectedLocationId);

  // Calcular puntuaciones del modelo para los pins de las 7 zonas pre-evaluadas
  const zonasPreEvaluadas = useMemo(() => {
    const r = calcularTodas();
    return r.map((res) => ({
      ...res.u,
      van: res.base.van,
      tir: res.base.tir,
      payback: res.base.payback,
      score: scoreUbicacion(res),
      veredicto: veredicto(res).tono, // 'positivo' | 'neutral' | 'negativo'
    }));
  }, []);

  // Auto-fly cuando location cambia (solo entonces — no en cada render)
  // De este modo el usuario puede hacer pan/zoom libremente sin que la cámara
  // vuelva forzada a la location seleccionada.
  const lastFlownLocationRef = useRef<string | null>(null);
  useEffect(() => {
    if (!location) return;
    const key = `${location.lat.toFixed(5)},${location.lng.toFixed(5)}`;
    if (lastFlownLocationRef.current === key) return;
    lastFlownLocationRef.current = key;
    setViewState((v) => ({
      ...v,
      longitude: location.lng,
      latitude: location.lat,
      zoom: Math.max(Math.min(v.zoom, 13), 12.5),
      transitionDuration: 800,
    }));
  }, [location]);

  const handleClick = useCallback((info: any) => {
    if (!info?.coordinate) return;
    const [lng, lat] = info.coordinate;
    setLocation({ lat, lng });
    // Si clickeó sobre un polígono de comuna, lo destaca y abre Demografía
    if (info.layer?.id === 'densidad' && info.object?.properties?.codigo) {
      setHighlightedComuna(info.object.properties.codigo);
      setActiveTab('demografia');
    } else {
      setHighlightedComuna(null);
    }
  }, [setLocation, setActiveTab, setHighlightedComuna]);

  // ============= Layers =============
  const deckLayers: any[] = [];

  // Tile basemap (id por tema para evitar cache cruzada)
  deckLayers.push(
    new TileLayer({
      id: `tile-base-${theme}`,
      data: theme === 'dark' ? TILE_DARK : TILE_LIGHT,
      minZoom: 0,
      maxZoom: 19,
      tileSize: 256,
      renderSubLayers: (props: any) => {
        const { bbox } = props.tile;
        return new BitmapLayer({
          ...props,
          data: undefined,
          image: props.data,
          bounds: [bbox.west, bbox.south, bbox.east, bbox.north],
        });
      },
    }),
  );

  // ---- Densidad: choropleth plano cuando pitch=0, extrusión 3D cuando se inclina
  const is3D = viewState.pitch > 10;
  if (layers.densidad && comunasGeo) {
    deckLayers.push(
      new GeoJsonLayer({
        id: 'densidad',
        data: comunasGeo as any,
        extruded: is3D,
        wireframe: false,
        filled: true,
        stroked: true,
        opacity: is3D ? 0.85 : 1,
        getFillColor: (f: any) => {
          const d = dataIndex.dens.get(f.properties.codigo)?.dens ?? 0;
          return densityToRGB(d, 22000);
        },
        getLineColor: (f: any) => {
          if (f.properties.codigo === highlightedComuna) return [234, 88, 12, 255];
          return theme === 'dark' ? [255, 255, 255, 120] : [40, 40, 50, 180];
        },
        getLineWidth: (f: any) => f.properties.codigo === highlightedComuna ? 3 : 1,
        lineWidthMinPixels: 1,
        lineWidthUnits: 'pixels',
        getElevation: (f: any) => {
          const d = dataIndex.dens.get(f.properties.codigo)?.dens ?? 0;
          return is3D ? d * 0.04 : 0;
        },
        elevationScale: 1,
        material: { ambient: 0.6, diffuse: 0.7, shininess: 32 },
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 200, 100, 220],
        updateTriggers: {
          getElevation: [is3D],
          getLineColor: [theme, highlightedComuna],
          getLineWidth: [highlightedComuna],
        },
      }),
    );
  }

  // ---- Ingreso: GeoJsonLayer plano coloreado
  if (layers.ingreso && comunasGeo) {
    deckLayers.push(
      new GeoJsonLayer({
        id: 'ingreso',
        data: comunasGeo as any,
        extruded: false,
        filled: true,
        stroked: true,
        getFillColor: (f: any) => {
          const v = dataIndex.ing.get(f.properties.codigo) ?? 0;
          return incomeToRGB(v, 4500000);
        },
        getLineColor: [255, 255, 255, 100],
        lineWidthMinPixels: 1,
        pickable: true,
        autoHighlight: true,
        highlightColor: [120, 180, 255, 200],
      }),
    );
  }

  // ---- Heatmap peatonal: paraderos OSM RM, intensidad modulada por hora del día
  if (layers.peatonal && busStopsRM && busStopsRM.length > 0) {
    deckLayers.push(
      new HeatmapLayer({
        id: 'peatonal-heat',
        data: busStopsRM,
        getPosition: (d: any) => [d.lng, d.lat],
        getWeight: hourlyIntensity,
        radiusPixels: 50,
        intensity: 1.0 + hourlyIntensity * 1.4,
        threshold: 0.03,
        colorRange: [
          [44, 93, 143, 0],
          [80, 145, 180, 100],
          [246, 193, 119, 160],
          [240, 152, 95, 200],
          [239, 90, 90, 230],
          [200, 50, 50, 255],
        ],
        updateTriggers: {
          getWeight: [hourlyIntensity],
        },
      }),
    );
  }

  // ---- Equipamiento urbano: hospitales/universidades/colegios/malls
  if (layers.equipamiento && urbanPois) {
    const colorByCategory = (cat: string): [number, number, number, number] => {
      if (cat === 'hospital') return [239, 68, 68, 230];
      if (cat === 'university') return [139, 92, 246, 230];
      if (cat === 'school') return [37, 99, 235, 200];
      return [34, 197, 94, 230]; // mall
    };
    const radiusByCategory = (cat: string): number => {
      if (cat === 'hospital') return 120;
      if (cat === 'university') return 110;
      if (cat === 'mall') return 100;
      return 50;
    };
    deckLayers.push(
      new ScatterplotLayer({
        id: 'urban-equipment',
        data: urbanPois,
        getPosition: (d: any) => [d.lng, d.lat],
        getRadius: (d: any) => radiusByCategory(d.category),
        radiusUnits: 'meters',
        getFillColor: (d: any) => colorByCategory(d.category),
        getLineColor: [255, 255, 255, 220],
        lineWidthMinPixels: 1,
        stroked: true,
        filled: true,
        pickable: true,
      }),
    );
  }

  // ---- Vías principales: PathLayer con grosor por jerarquía (motorway/trunk/primary/secondary)
  // Si hay location, muestra solo radio; si no, muestra toda la RM
  const roadData = location ? roads : roadsRM;
  if (layers.vehicular && roadData) {
    const widthByHighway = (h: string) => {
      if (h === 'motorway' || h === 'trunk') return 6;
      if (h === 'primary') return 4;
      if (h === 'secondary') return 2.5;
      return 1.5;
    };
    const colorByHighway = (h: string): [number, number, number, number] => {
      if (h === 'motorway' || h === 'trunk') return [239, 90, 90, 220];
      if (h === 'primary') return [246, 193, 119, 200];
      return [86, 201, 122, 180];
    };
    deckLayers.push(
      new PathLayer({
        id: 'roads-paths',
        data: roadData,
        getPath: (d: any) => d.path,
        getColor: (d: any) => colorByHighway(d.highway),
        getWidth: (d: any) => widthByHighway(d.highway),
        widthUnits: 'pixels',
        widthMinPixels: 1,
        capRounded: true,
        jointRounded: true,
        pickable: true,
      }),
    );
  }

  // ---- Metro: PathLayer con geometrías reales OSM (railway=subway) + Scatter estaciones
  if (layers.metro) {
    // Líneas reales: cada segmento con su color oficial
    if (metroLineas) {
      // Aplanamos: un item por segmento, con color de la línea
      const segmentData: Array<{ linea: string; color: [number, number, number]; path: [number, number][] }> = [];
      for (const line of metroLineas.lines) {
        for (const seg of line.segments) {
          segmentData.push({ linea: line.linea, color: line.color, path: seg });
        }
      }
      deckLayers.push(
        new PathLayer({
          id: 'metro-lines',
          data: segmentData,
          getPath: (d: any) => d.path,
          getColor: (d: any) => [...d.color, 240] as [number, number, number, number],
          getWidth: 4,
          widthUnits: 'pixels',
          widthMinPixels: 2.5,
          widthMaxPixels: 8,
          capRounded: true,
          jointRounded: true,
          pickable: true,
        }),
      );
    }

    // Estaciones: pins blancos con borde de color por línea
    if (metro) {
      const stationColor = (linea: string): [number, number, number] => {
        const first = linea.split('/')[0];
        return METRO_COLORS[first] ?? [220, 38, 38];
      };
      deckLayers.push(
        new ScatterplotLayer({
          id: 'metro-pins',
          data: metro.data,
          getPosition: (d: any) => [d.lng, d.lat],
          getRadius: (d: any) => 60 + d.afluenciaAnualM * 4,
          radiusUnits: 'meters',
          radiusMinPixels: 4,
          radiusMaxPixels: 12,
          getFillColor: [255, 255, 255, 250],
          getLineColor: (d: any) => [...stationColor(d.linea), 255] as [number, number, number, number],
          lineWidthUnits: 'pixels',
          getLineWidth: 2,
          stroked: true,
          filled: true,
          pickable: true,
          autoHighlight: true,
        }),
      );
    }
  }

  // ---- Rutas RED Movilidad (222 líneas reales OSM, paths optimizados)
  if (layers.busRoutes && busRoutes?.routes) {
    deckLayers.push(
      new PathLayer({
        id: 'red-bus-routes',
        data: busRoutes.routes,
        getPath: (d: any) => d.path,
        getColor: (d: any) => [...d.color, 180] as [number, number, number, number],
        getWidth: 2,
        widthUnits: 'pixels',
        widthMinPixels: 1.5,
        widthMaxPixels: 4,
        capRounded: true,
        jointRounded: true,
        pickable: true,
      }),
    );
  }

  // ---- Paraderos: scatter pequeño cyan
  if (layers.paraderos && busStops) {
    deckLayers.push(
      new ScatterplotLayer({
        id: 'paraderos',
        data: busStops,
        getPosition: (d: any) => [d.lng, d.lat],
        getRadius: 15,
        radiusUnits: 'meters',
        getFillColor: [14, 165, 233, 230],
        getLineColor: [255, 255, 255, 220],
        lineWidthMinPixels: 1,
        stroked: true,
        pickable: true,
      }),
    );
  }

  // ---- Cafés competencia: scatter amber
  if (layers.competencia && cafes) {
    deckLayers.push(
      new ScatterplotLayer({
        id: 'cafes',
        data: cafes,
        getPosition: (d: any) => [d.lng, d.lat],
        getRadius: 22,
        radiusUnits: 'meters',
        getFillColor: [251, 191, 36, 240],
        getLineColor: [255, 255, 255, 240],
        lineWidthMinPixels: 1.5,
        stroked: true,
        pickable: true,
      }),
    );
  }

  // ---- Mi local: pin grande con halo
  if (location) {
    deckLayers.push(
      new ScatterplotLayer({
        id: 'mi-local-halo',
        data: [location],
        getPosition: (d: any) => [d.lng, d.lat],
        getRadius: radius,
        radiusUnits: 'meters',
        getFillColor: [234, 88, 12, 30],
        getLineColor: [234, 88, 12, 200],
        lineWidthMinPixels: 2,
        stroked: true,
        filled: true,
      }),
    );
    deckLayers.push(
      new ScatterplotLayer({
        id: 'mi-local-core',
        data: [location],
        getPosition: (d: any) => [d.lng, d.lat],
        getRadius: 60,
        radiusUnits: 'meters',
        getFillColor: [234, 88, 12, 255],
        getLineColor: [255, 255, 255, 255],
        lineWidthMinPixels: 3,
        stroked: true,
        filled: true,
      }),
    );

  }

  // ---- Pins de las 7 zonas pre-evaluadas (siempre visibles)
  // Color según veredicto: verde recomendado, ámbar aceptable, rojo no conviene
  const colorPorVeredicto: Record<string, [number, number, number, number]> = {
    positivo: [16, 185, 129, 235],   // emerald-500
    neutral:  [245, 158, 11, 235],    // amber-500
    negativo: [244, 63, 94, 220],     // rose-500
  };
  // Halo (anillo exterior)
  deckLayers.push(
    new ScatterplotLayer({
      id: 'zonas-halo',
      data: zonasPreEvaluadas,
      getPosition: (d: any) => [d.lng, d.lat],
      // El radio crece con score (mejor zona = halo más grande)
      getRadius: (d: any) => 280 + (d.score / 100) * 320,
      radiusUnits: 'meters',
      getFillColor: (d: any) => {
        const c = colorPorVeredicto[d.veredicto] ?? [156, 163, 175, 100];
        return [c[0], c[1], c[2], 60];
      },
      getLineColor: (d: any) => {
        const c = colorPorVeredicto[d.veredicto] ?? [156, 163, 175, 200];
        return [c[0], c[1], c[2], 200];
      },
      lineWidthMinPixels: 1.5,
      stroked: true,
      filled: true,
      pickable: true,
      onClick: (info: any) => {
        if (info.object?.id) {
          setSelectedLocationId(info.object.id);
          setLocation({ lat: info.object.lat, lng: info.object.lng, label: info.object.nombre });
          setActiveTab('zonas');
        }
      },
    }),
  );
  // Núcleo
  deckLayers.push(
    new ScatterplotLayer({
      id: 'zonas-core',
      data: zonasPreEvaluadas,
      getPosition: (d: any) => [d.lng, d.lat],
      getRadius: (d: any) => (selectedLocationId === d.id ? 130 : 90),
      radiusUnits: 'meters',
      getFillColor: (d: any) => colorPorVeredicto[d.veredicto] ?? [156, 163, 175, 220],
      getLineColor: () => [255, 255, 255, 255],
      lineWidthMinPixels: 2.5,
      stroked: true,
      filled: true,
      pickable: true,
      updateTriggers: { getRadius: [selectedLocationId] },
      onClick: (info: any) => {
        if (info.object?.id) {
          setSelectedLocationId(info.object.id);
          setLocation({ lat: info.object.lat, lng: info.object.lng, label: info.object.nombre });
          setActiveTab('zonas');
        }
      },
    }),
  );

  // Tooltip
  const getTooltip = ({ object, layer }: any) => {
    if (!object) return null;
    // Tooltips de zonas pre-evaluadas
    if (layer?.id === 'zonas-core' || layer?.id === 'zonas-halo') {
      const tirStr = Number.isFinite(object.tir) ? `${(object.tir * 100).toFixed(1)}%` : '—';
      const pbStr = Number.isFinite(object.payback) && object.payback > 0 && object.payback <= 5
        ? `${object.payback.toFixed(1)}y` : '> 5y';
      const veredictoStr = object.veredicto === 'positivo' ? '✅ Recomendada'
        : object.veredicto === 'neutral' ? '⚠️ Aceptable con riesgo' : '❌ No conviene';
      return {
        html: `<div style="padding:10px;font-family:Inter,sans-serif;min-width:220px">
          <div style="font-size:13px;font-weight:700;margin-bottom:4px">${object.nombre}</div>
          <div style="opacity:0.7;font-size:11px;margin-bottom:8px">${object.comuna} · ${object.m2} m² · ${object.arriendoUFm2.toFixed(2)} UF/m²</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px">
            <div><span style="opacity:0.6">VAN:</span> <b>$${object.van.toLocaleString('es-CL')}</b></div>
            <div><span style="opacity:0.6">TIR:</span> <b>${tirStr}</b></div>
            <div><span style="opacity:0.6">Payback:</span> <b>${pbStr}</b></div>
            <div><span style="opacity:0.6">Score:</span> <b>${object.score}/100</b></div>
          </div>
          <div style="margin-top:6px;font-size:11px;font-weight:600">${veredictoStr}</div>
        </div>`,
        style: { background: 'rgba(20,20,30,0.96)', color: '#fff', borderRadius: '10px', boxShadow: '0 12px 32px rgba(0,0,0,0.5)' },
      };
    }
    if (layer?.id === 'densidad') {
      const props = object.properties;
      const data = dataIndex.dens.get(props.codigo);
      return {
        html: `<div style="padding:8px;font-family:Inter,sans-serif">
          <strong style="font-size:13px">${props.nombre}</strong><br/>
          <span style="opacity:0.7">Densidad:</span> <b>${data?.dens.toLocaleString('es-CL') ?? '—'}</b> hab/km²<br/>
          <span style="opacity:0.7">Población:</span> <b>${data?.pob.toLocaleString('es-CL') ?? '—'}</b>
        </div>`,
        style: { background: 'rgba(20,20,30,0.95)', color: '#fff', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' },
      };
    }
    if (layer?.id === 'ingreso') {
      const props = object.properties;
      const v = dataIndex.ing.get(props.codigo);
      return {
        html: `<div style="padding:8px;font-family:Inter,sans-serif">
          <strong>${props.nombre}</strong><br/>
          Ingreso medio: <b>$${v?.toLocaleString('es-CL') ?? '—'}</b>
        </div>`,
        style: { background: 'rgba(20,20,30,0.95)', color: '#fff', borderRadius: '8px' },
      };
    }
    if (layer?.id === 'metro-pins') {
      return {
        html: `<div style="padding:8px;font-family:Inter,sans-serif">
          🚇 <strong>${object.nombre}</strong><br/>
          Línea ${object.linea}<br/>
          <b>${object.afluenciaAnualM.toFixed(1)}M</b> pasajeros/año
        </div>`,
        style: { background: 'rgba(20,20,30,0.95)', color: '#fff', borderRadius: '8px' },
      };
    }
    if (layer?.id === 'paraderos') {
      return {
        html: `<div style="padding:8px;font-family:Inter,sans-serif">🚌 <strong>${object.name}</strong>${object.ref ? `<br/>Cód: ${object.ref}` : ''}</div>`,
        style: { background: 'rgba(20,20,30,0.95)', color: '#fff', borderRadius: '8px' },
      };
    }
    if (layer?.id === 'cafes') {
      return {
        html: `<div style="padding:8px;font-family:Inter,sans-serif">☕ <strong>${object.name}</strong><br/>${object.brand ? `${object.brand} · ` : ''}${object.type}</div>`,
        style: { background: 'rgba(20,20,30,0.95)', color: '#fff', borderRadius: '8px' },
      };
    }
    if (layer?.id === 'roads') {
      return {
        html: `<div style="padding:8px;font-family:Inter,sans-serif">🛣 <strong>${object.name}</strong><br/>${object.highway}${object.lanes ? ` · ${object.lanes} pistas` : ''}</div>`,
        style: { background: 'rgba(20,20,30,0.95)', color: '#fff', borderRadius: '8px' },
      };
    }
    if (layer?.id === 'red-bus-routes') {
      const refs = object.refs?.length ?? 0;
      return {
        html: `<div style="padding:8px;font-family:Inter,sans-serif">
          🚌 <strong>${refs} línea${refs === 1 ? '' : 's'} RED</strong><br/>
          <span style="opacity:0.85">${object.refsLabel ?? ''}</span><br/>
          ${object.operators?.length ? `<span style="opacity:0.6">${object.operators.join(' · ')}</span>` : ''}
        </div>`,
        style: { background: 'rgba(20,20,30,0.95)', color: '#fff', borderRadius: '8px' },
      };
    }
    if (layer?.id === 'urban-equipment') {
      const icon = object.category === 'hospital' ? '🏥' : object.category === 'university' ? '🎓' : object.category === 'school' ? '🏫' : '🛍';
      return {
        html: `<div style="padding:8px;font-family:Inter,sans-serif">${icon} <strong>${object.name}</strong><br/><span style="opacity:0.7;text-transform:capitalize">${object.category}</span></div>`,
        style: { background: 'rgba(20,20,30,0.95)', color: '#fff', borderRadius: '8px' },
      };
    }
    if (layer?.id === 'hex-activity') {
      return {
        html: `<div style="padding:8px;font-family:Inter,sans-serif"><strong>Hexágono de actividad</strong><br/>Puntos agregados: <b>${object.points.length}</b></div>`,
        style: { background: 'rgba(20,20,30,0.95)', color: '#fff', borderRadius: '8px' },
      };
    }
    return null;
  };

  const resetCamera = () => setViewState({ ...INITIAL_VIEW_STATE, transitionDuration: 800 });
  const flatView = () => setViewState((v) => ({ ...v, ...VIEW_2D, transitionDuration: 600 }));
  const view3D = () => setViewState((v) => ({ ...v, ...VIEW_3D, transitionDuration: 600 }));

  return (
    <div
      className={`relative h-full w-full ${containerClassName ?? ''}`}
      style={{ background: theme === 'dark' ? '#0a0a0c' : '#e2e8f0' }}
    >
      <DeckGL
        key={`deck-${theme}`}
        initialViewState={viewState as any}
        viewState={viewState as any}
        onViewStateChange={(e: any) => setViewState(e.viewState)}
        controller={{ dragRotate: true, touchRotate: true } as any}
        layers={deckLayers}
        onClick={handleClick}
        getTooltip={getTooltip}
        views={new MapView({ controller: true, repeat: true } as any)}
        style={{ position: 'absolute', top: '0', left: '0', right: '0', bottom: '0' }}
      />

      <div className="absolute right-4 top-4 z-[1000] w-80 max-w-[calc(100%-2rem)]">
        <GeocoderSearch />
      </div>
      <div className="absolute left-4 top-4 z-[1000] flex flex-col gap-2 max-w-[calc(100%-2rem)] w-72">
        <LayerControls />
        <TimeFilter />
        <RadiusSelector />
      </div>

      {/* Camera controls */}
      <div className="absolute right-4 bottom-4 z-[1000] flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        <button
          onClick={(e) => { e.stopPropagation(); flatView(); }}
          title="Vista plana 2D"
          className={`glass-elevated flex h-9 w-9 items-center justify-center rounded-full transition-all shadow-lg hover:scale-105 ${viewState.pitch < 10 ? 'text-accent ring-2 ring-accent/40' : 'text-foreground/70 hover:text-foreground'}`}
        >
          <Maximize2 className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); view3D(); }}
          title="Vista 3D inclinada"
          className={`glass-elevated flex h-9 w-9 items-center justify-center rounded-full transition-all shadow-lg hover:scale-105 ${viewState.pitch >= 10 ? 'text-accent ring-2 ring-accent/40' : 'text-foreground/70 hover:text-foreground'}`}
        >
          <Compass className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); resetCamera(); }}
          title="Centrar en la RM"
          className="glass-elevated flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 hover:text-foreground hover:scale-105 transition-all shadow-lg"
        >
          <Home className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setTheme(theme === 'dark' ? 'light' : 'dark'); }}
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          className="glass-elevated flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 hover:text-foreground hover:scale-105 transition-all shadow-lg"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      {/* Camera info */}
      <div className="pointer-events-none absolute left-4 bottom-4 z-[999] glass rounded-lg px-3 py-1.5 text-[10px] font-mono tabular text-muted-foreground shadow-lg">
        <span className="text-accent">●</span> 3D · pitch <b className="text-foreground">{viewState.pitch.toFixed(0)}°</b> · zoom <b className="text-foreground">{viewState.zoom.toFixed(1)}</b>
      </div>

      {!location && (
        <div className="pointer-events-none absolute inset-x-0 bottom-16 z-[1000] flex justify-center">
          <div className="rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2.5 text-xs font-medium text-white shadow-lg backdrop-blur animate-bounce-soft">
            👆 Click en una comuna para ver demografía · click en cualquier punto para fijar tu local
          </div>
        </div>
      )}

      {(layers.peatonal && loadingPeatonal) || (layers.equipamiento && loadingEquipment) || (layers.vehicular && loadingRoads) || (layers.busRoutes && loadingBusRoutes) ? (
        <div className="pointer-events-none absolute left-1/2 top-20 z-[1000] -translate-x-1/2">
          <div className="glass-elevated flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-medium shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
            </span>
            Cargando datos OSM RM…
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Export PolygonLayer for backward compat (no usage, satisfies tree-shake)
export { PolygonLayer, IconLayer };
