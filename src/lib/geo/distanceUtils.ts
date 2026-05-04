/** Haversine distance in meters between two lat/lng points. */
export function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/** Bounding box from a center and radius in meters → [south, west, north, east] */
export function bboxFromRadius(center: { lat: number; lng: number }, radiusMeters: number): [number, number, number, number] {
  const dLat = radiusMeters / 111320;
  const dLng = radiusMeters / (111320 * Math.cos((center.lat * Math.PI) / 180));
  return [center.lat - dLat, center.lng - dLng, center.lat + dLat, center.lng + dLng];
}

/** Test if a point is within radius of center. */
export function withinRadius(point: { lat: number; lng: number }, center: { lat: number; lng: number }, radiusMeters: number): boolean {
  return haversine(point, center) <= radiusMeters;
}

/** Simple ray-casting point-in-polygon for [lng, lat][] rings. */
export function pointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
