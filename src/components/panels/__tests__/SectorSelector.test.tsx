import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectorSelector } from '../SectorSelector';

describe('SectorSelector', () => {
  it('renderiza y ofrece filtros de categoría más allá del café', () => {
    render(<SectorSelector />);
    // El header ya no habla solo de cafetería
    expect(screen.getByText(/proyecto retail food/i)).toBeInTheDocument();
    // Chip de categoría de un rubro no-café
    expect(screen.getByText('Heladería')).toBeInTheDocument();
    expect(screen.getByText('Comida rápida')).toBeInTheDocument();
  });
});
