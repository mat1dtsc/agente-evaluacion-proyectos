import type { ProjectInputs } from '@/lib/finance/types';
import type { FinancialModelOutput } from '@/hooks/useFinancialModel';

/** Contrato comun de los tres exportadores (Excel, Word, PDF). */
export interface ExportArgs {
  inputs: ProjectInputs;
  model: FinancialModelOutput;
  projectName: string;
  location: { lat: number; lng: number; label?: string } | null;
}
