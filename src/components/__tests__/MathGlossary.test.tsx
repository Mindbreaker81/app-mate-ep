import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MathGlossary } from '../MathGlossary';

describe('MathGlossary', () => {
  it('muestra el diálogo con términos en castellano y catalán', () => {
    render(<MathGlossary onClose={() => undefined} />);

    expect(screen.getByRole('dialog', { name: /glosario/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'media' })).toBeInTheDocument();
    expect(screen.getByText('mitjana')).toBeInTheDocument();
    expect(screen.getByText('circumferència')).toBeInTheDocument();
  });

  it('el buscador filtra por término catalán sin distinguir tildes', () => {
    render(<MathGlossary onClose={() => undefined} />);

    fireEvent.change(screen.getByRole('searchbox', { name: /buscar/i }), {
      target: { value: 'mitjana' },
    });

    expect(screen.getByRole('heading', { name: 'media' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'perímetro' })).not.toBeInTheDocument();
  });

  it('el buscador encuentra términos castellanos sin escribir la tilde', () => {
    render(<MathGlossary onClose={() => undefined} />);

    fireEvent.change(screen.getByRole('searchbox', { name: /buscar/i }), {
      target: { value: 'circunferencia' },
    });

    expect(screen.getByText('circumferència')).toBeInTheDocument();
  });

  it('avisa cuando no hay resultados', () => {
    render(<MathGlossary onClose={() => undefined} />);

    fireEvent.change(screen.getByRole('searchbox', { name: /buscar/i }), {
      target: { value: 'xyzzy' },
    });

    expect(screen.getByText(/sin resultados/i)).toBeInTheDocument();
  });

  it('cierra con Escape y con el botón de cierre', () => {
    const onClose = vi.fn();
    render(<MathGlossary onClose={onClose} />);

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /cerrar glosario/i }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('enfoca el buscador al abrir y devuelve el foco al elemento anterior al cerrar', () => {
    render(<button type="button">Abrir</button>);
    const opener = screen.getByRole('button', { name: 'Abrir' });
    opener.focus();

    const { unmount } = render(<MathGlossary onClose={() => undefined} />);
    expect(screen.getByRole('searchbox', { name: /buscar/i })).toHaveFocus();

    unmount();
    expect(opener).toHaveFocus();
  });

  it('destaca el término inicial abierto desde una explicación', () => {
    const { container } = render(<MathGlossary onClose={() => undefined} initialTermId="mediana" />);

    const highlighted = container.querySelector('[aria-current="true"]');
    expect(highlighted).not.toBeNull();
    expect(highlighted).toHaveTextContent('mediana');
  });

  it('los enlaces de términos relacionados mueven el término destacado', () => {
    const { container } = render(<MathGlossary onClose={() => undefined} initialTermId="media" />);

    fireEvent.click(screen.getByRole('button', { name: /mediana/i }));

    const highlighted = container.querySelector('[aria-current="true"]');
    expect(highlighted).toHaveTextContent('mediana');
  });
});
