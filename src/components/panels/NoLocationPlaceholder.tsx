import { MapPin } from 'lucide-react';

export function NoLocationPlaceholder({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-xs text-muted-foreground">
      <MapPin className="h-8 w-8 opacity-30" />
      <p>{message ?? 'Selecciona un punto en el mapa para ver datos del área.'}</p>
    </div>
  );
}
