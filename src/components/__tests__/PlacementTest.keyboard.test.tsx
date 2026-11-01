import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlacementTest } from '../MyPath';

describe('PlacementTest — teclado matemático opcional', () => {
  it('permite responder con el teclado en pantalla sin enviar el formulario', () => {
    const onFinish = vi.fn();
    const onCancel = vi.fn();
    render(<PlacementTest onFinish={onFinish} onCancel={onCancel} />);

    // Cerrado por defecto.
    expect(screen.queryByRole('group', { name: 'Teclado matemático' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Teclado/ }));
    const group = screen.getByRole('group', { name: 'Teclado matemático' });
    fireEvent.click(within(group).getByRole('button', { name: '7' }));

    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('7');
    expect(onFinish).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });
});
