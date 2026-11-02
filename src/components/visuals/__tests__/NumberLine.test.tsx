import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NumberLine } from '../NumberLine';
import { VisualProblemFrame } from '../VisualProblemFrame';
import type { NumberLineProblem } from '../../../types';

const decimalProblem: NumberLineProblem = {
  prompt: '¿Qué número está marcado con el punto en la recta?',
  operation: 'number-line-decimal',
  start: 0,
  step: 0.1,
  tickCount: 6,
  pointIndex: 3,
  scale: 1,
  answer: 0.3,
  explanation: '0 + 3 × 0.1 = 0.3',
};

const integerProblem: NumberLineProblem = {
  prompt: '¿Qué número está marcado con el punto en la recta?',
  operation: 'number-line-integer',
  start: -4,
  step: 1,
  tickCount: 9,
  pointIndex: 5,
  scale: 0,
  answer: 1,
  explanation: '-4 + 5 × 1 = 1',
};

describe('VisualProblemFrame', () => {
  it('expone título y descripción accesibles y una alternativa textual visible', () => {
    render(
      <VisualProblemFrame
        title="Recta numérica"
        description="Recta de 0 a 0.5 con marcas cada 0.1"
        alternative="La recta empieza en 0 y cada marca vale 0.1."
      >
        <rect x={0} y={0} width={10} height={10} />
      </VisualProblemFrame>,
    );

    const svg = screen.getByRole('img', { name: /Recta numérica/ });
    expect(svg).toBeTruthy();
    // La descripción está vinculada como <desc>, no como atributo que filtre datos.
    expect(svg.querySelector('desc')?.textContent).toContain('marcas cada 0.1');
    // La alternativa es texto visible equivalente.
    expect(screen.getByText(/cada marca vale 0\.1/)).toBeTruthy();
  });
});

describe('NumberLine', () => {
  it('dibuja las marcas y el punto sin revelar el valor del punto', () => {
    render(<NumberLine problem={decimalProblem} />);
    const svg = document.querySelector('svg');
    expect(svg).toBeTruthy();
    // Hay etiquetas de marca con el inicio y el final.
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    expect(screen.getAllByText('0.5').length).toBeGreaterThan(0);
    // El punto existe (círculo marcado como punto de la recta)…
    expect(document.querySelector('[data-visual-role="point"]')).toBeTruthy();
    // … pero no hay ninguna etiqueta con el valor de la solución.
    expect(screen.queryByText('0.3')).toBeNull();
  });

  it('la recta de enteros etiqueta los valores negativos', () => {
    render(<NumberLine problem={integerProblem} />);
    expect(screen.getAllByText('-4').length).toBeGreaterThan(0);
    expect(screen.getAllByText('4').length).toBeGreaterThan(0);
    // La marca del punto (valor 1) no lleva etiqueta: no se lee la solución.
    expect(screen.queryByText('1')).toBeNull();
  });
});
