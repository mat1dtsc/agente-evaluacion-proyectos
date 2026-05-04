import { useState } from 'react';
import { useGeocoder } from '@/hooks/useGeocoder';
import { useProjectStore } from '@/store/projectStore';
import { Search, MapPin } from 'lucide-react';

export function GeocoderSearch() {
  const [query, setQuery] = useState('');
  const { results, search, clear, loading } = useGeocoder();
  const setLocation = useProjectStore((s) => s.setLocation);

  return (
    <div className="glass rounded-xl shadow-xl shadow-black/5">
      <div className="flex items-center gap-2 px-3 py-2">
        <Search className="h-4 w-4 text-accent" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search(query)}
          placeholder="Buscar dirección en Chile..."
          className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
        />
        {query && (
          <button onClick={() => { setQuery(''); clear(); }} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
        )}
      </div>
      {loading && (
        <div className="border-t px-3 py-2 text-xs text-muted-foreground">
          <div className="animate-shimmer rounded">Buscando…</div>
        </div>
      )}
      {results.length > 0 && (
        <ul className="max-h-56 overflow-y-auto border-t">
          {results.map((r, i) => (
            <li key={i}>
              <button
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-xs transition hover:bg-secondary"
                onClick={() => {
                  setLocation({ lat: r.lat, lng: r.lng, label: r.label });
                  clear();
                  setQuery('');
                }}
              >
                <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0 text-accent" />
                <span className="truncate">{r.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
