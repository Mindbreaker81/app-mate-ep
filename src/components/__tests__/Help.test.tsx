import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Help } from '../Help';

describe('Help', () => {
  it('abre el glosario catalán-castellano desde la ayuda y lo cierra con Escape', () => {
    const onClose = vi.fn();
    render(<Help onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /glosario catalán-castellano/i }));

    const dialog = screen.getByRole('dialog', { name: /glosario/i });
    expect(dialog).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: /glosario/i })).not.toBeInTheDocument();
    // La ayuda sigue abierta: el glosario es un panel superpuesto.
    expect(screen.getByRole('button', { name: /cerrar ayuda/i })).toBeInTheDocument();
  });
});
