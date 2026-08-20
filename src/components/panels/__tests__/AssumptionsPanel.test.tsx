import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssumptionsPanel } from '../AssumptionsPanel';
import { useProjectStore } from '@/store/projectStore';

describe('AssumptionsPanel', () => {
  beforeEach(() => {
    useProjectStore.getState().resetInputs();
  });

  it('escribe varios dígitos seguidos sin perder el foco del input', async () => {
    // Regresion: NumField se declaraba dentro del render, asi que React
    // remontaba el <input> en cada tecla y el foco se perdia al segundo digito.
    const user = userEvent.setup();
    render(<AssumptionsPanel />);

    const ticket = screen.getByLabelText('Ticket promedio (CLP)');
    await user.clear(ticket);
    await user.type(ticket, '5200');

    expect(ticket).toHaveFocus();
    expect(ticket).toHaveValue(5200);
    expect(useProjectStore.getState().inputs.ticketPromedio).toBe(5200);
  });

  it('propaga cada campo editado al store', async () => {
    const user = userEvent.setup();
    render(<AssumptionsPanel />);

    const dias = screen.getByLabelText('Días operación/año');
    await user.clear(dias);
    await user.type(dias, '300');

    expect(useProjectStore.getState().inputs.diasOperacionAno).toBe(300);
  });
});
