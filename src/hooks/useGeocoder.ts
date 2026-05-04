import { useState } from 'react';

export interface GeocoderResult {
  lat: number;
  lng: number;
  label: string;
}

export function useGeocoder() {
  const [results, setResults] = useState<GeocoderResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(query: string) {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=cl&limit=5&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'es-CL' } });
      if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
      const items: any[] = await res.json();
      setResults(
        items.map((it) => ({
          lat: parseFloat(it.lat),
          lng: parseFloat(it.lon),
          label: it.display_name,
        })),
      );
    } catch (e) {
      setError((e as Error).message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return { results, loading, error, search, clear: () => setResults([]) };
}
