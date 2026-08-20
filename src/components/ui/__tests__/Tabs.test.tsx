import { describe, it, expect } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Tabs';

function Ejemplo({ controlado }: { controlado: boolean }) {
  const [tab, setTab] = useState('uno');
  return (
    <Tabs
      defaultValue="uno"
      value={controlado ? tab : undefined}
      onValueChange={controlado ? setTab : undefined}
    >
      <TabsList>
        <TabsTrigger value="uno">Uno</TabsTrigger>
        <TabsTrigger value="dos">Dos</TabsTrigger>
      </TabsList>
      <TabsContent value="uno">Contenido uno</TabsContent>
      <TabsContent value="dos">Contenido dos</TabsContent>
    </Tabs>
  );
}

describe('Tabs', () => {
  it('cambia de pestaña en modo no controlado', async () => {
    const user = userEvent.setup();
    render(<Ejemplo controlado={false} />);

    expect(screen.getByText('Contenido uno')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Dos' }));
    expect(await screen.findByText('Contenido dos')).toBeInTheDocument();
  });

  it('cambia de pestaña cuando el valor lo gobierna el padre', async () => {
    // Regresion: el sync value->estado interno vivia en un useEffect con
    // setState sincrono; el prop controlado ya manda por si solo.
    const user = userEvent.setup();
    render(<Ejemplo controlado />);

    expect(screen.getByText('Contenido uno')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Dos' }));
    expect(await screen.findByText('Contenido dos')).toBeInTheDocument();
  });
});
