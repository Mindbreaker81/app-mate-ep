import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CoordinateGrid } from '../CoordinateGrid';
import { GeometryDiagram } from '../GeometryDiagram';
import { ProblemBody, type AnswerFieldsState } from '../../ProblemBody';
import type {
  CoordinateValueProblem,
  PlaneTransformProblem,
  ShapeClassificationProblem,
} from '../../../types';

const coordinateProblem: CoordinateValueProblem = {
  prompt: '¿Qué valor tiene la coordenada x del punto P?',
  operation: 'coordinate-value',
  point: { x: 7, y: 4 },
  pointLabel: 'P',
  axis: 'x',
  answer: 7,
  explanation: 'Cuenta las casillas desde el eje vertical hasta el punto.',
};

const transformProblem: PlaneTransformProblem = {
  prompt: 'Elige la figura que resulta de reflejar la original sobre la recta vertical.',
  operation: 'plane-transform',
  transform: 'reflection-vertical',
  vertices: [
    { x: 2, y: 3 },
    { x: 4, y: 3 },
    { x: 2, y: 5 },
  ],
  mirrorLine: { axis: 'x', value: 5 },
  options: ['A', 'B', 'C'],
  optionFigures: [
    [
      { x: 8, y: 3 },
      { x: 6, y: 3 },
      { x: 8, y: 5 },
    ],
    [
      { x: 8, y: 3 },
      { x: 10, y: 3 },
      { x: 8, y: 5 },
    ],
    [
      { x: 2, y: 7 },
      { x: 4, y: 7 },
      { x: 2, y: 9 },
    ],
  ],
  answer: 'A',
  explanation: 'Cada vértice se refleja al otro lado de la recta x = 5, a la misma distancia.',
};

const classificationProblem: ShapeClassificationProblem = {
  prompt: '¿Cómo se clasifica esta figura por su número de lados?',
  operation: 'shape-classification',
  vertices: [
    { x: 2, y: 2 },
    { x: 6, y: 2 },
    { x: 7, y: 5 },
    { x: 3, y: 6 },
  ],
  options: ['triángulo', 'cuadrilátero', 'pentágono', 'hexágono'],
  answer: 'cuadrilátero',
  explanation: 'Tiene 4 lados, así que es un cuadrilátero.',
};

function fieldsFor(): AnswerFieldsState {
  return {
    userAnswer: '',
    setAnswer: () => {},
    fracAnswer: { numerator: '', denominator: '' },
    setFracAnswer: () => {},
    mixedAnswer: { whole: '', numerator: '', denominator: '' },
    setMixedAnswer: () => {},
    remainderAnswer: { quotient: '', remainder: '' },
    setRemainderAnswer: () => {},
    setValidationError: () => {},
    disabled: false,
  };
}

describe('CoordinateGrid', () => {
  it('dibuja la cuadrícula 0–10 con ejes etiquetados y el punto sin su valor', () => {
    render(<CoordinateGrid description="Cuadrícula de coordenadas." alternative="Cuadrícula de 0 a 10.">{null}</CoordinateGrid>);

    // Números de los ejes visibles (no el par del punto).
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    expect(screen.getAllByText('10').length).toBeGreaterThan(0);
    // El punto NO lleva escrita su coordenada.
    expect(screen.queryByText('(7, 4)')).toBeNull();
    expect(screen.queryByText('7, 4')).toBeNull();
  });
});

describe('GeometryDiagram', () => {
  it('dibuja la original marcada en su cuadrícula y cada opción en mini-cuadrícula separada', () => {
    render(<GeometryDiagram problem={transformProblem} />);

    // Cuadrícula principal: SOLO la figura original, claramente marcada.
    const main = screen.getByRole('img', { name: /Cuadrícula de coordenadas/ });
    expect(main.querySelectorAll('[data-visual-role="shape"]')).toHaveLength(1);
    expect(within(main).getAllByText('Original').length).toBeGreaterThan(0);
    // Recta de simetría dibujada.
    expect(main.querySelector('[data-visual-role="mirror"]')).not.toBeNull();
    // Las opciones NO se dibujan encima de la original (nada de solapes).
    for (const label of ['A', 'B', 'C']) {
      expect(within(main).queryByText(label)).toBeNull();
    }

    // Cada opción en su propia mini-cuadrícula, con su letra e figura completa.
    for (const letter of ['A', 'B', 'C']) {
      const mini = screen.getByRole('img', { name: `Opción ${letter}` });
      expect(mini.querySelectorAll('[data-visual-role="shape"]')).toHaveLength(1);
      expect(within(mini).getAllByText(letter).length).toBeGreaterThan(0);
    }
    // El texto de las opciones es distinguible del de la original.
    expect(screen.getByText(/Opción A \(mini-cuadrícula A\):/)).toBeTruthy();
    expect(screen.getByText(/Figura original \(marcada como «Original»\)/)).toBeTruthy();
  });

  it('la alternativa con los vértices de las opciones está oculta hasta pulsar «Ver tabla»', () => {
    const { container } = render(<GeometryDiagram problem={transformProblem} />);

    // Accesible pero no visible por defecto: facilitaría la respuesta.
    const hidden = container.querySelector('.sr-only');
    expect(hidden).toBeTruthy();
    expect(hidden?.textContent).toContain('Opción A (mini-cuadrícula A):');
    expect(screen.getByRole('button', { name: 'Ver tabla' }).getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(screen.getByRole('button', { name: 'Ver tabla' }));
    expect(container.querySelector('.sr-only')).toBeNull();
    expect(screen.getByRole('button', { name: 'Ocultar tabla' }).getAttribute('aria-expanded')).toBe('true');
  });

  it('dibuja el polígono a clasificar con alternativa que no cuenta los lados', () => {
    render(<GeometryDiagram problem={classificationProblem} />);
    const svg = screen.getByRole('img', { name: /Cuadrícula de coordenadas/ });
    expect(svg.querySelectorAll('[data-visual-role="shape"]')).toHaveLength(1);
    expect(screen.queryByText(/triángulo|cuadrilátero|pentágono|hexágono/)).toBeNull();
    expect(screen.getByText(/Figura cerrada/)).toBeTruthy();
  });
});

describe('ProblemBody con geometría visual', () => {
  it('coordinate-value responde con campo numérico', () => {
    render(<ProblemBody problem={coordinateProblem} fields={fieldsFor()} onSelectOption={() => {}} />);
    expect(screen.getByRole('img', { name: /cuadrícula/i })).toBeTruthy();
    expect(screen.getByLabelText('Tu respuesta')).toBeTruthy();
  });

  it('plane-transform responde por opciones y no por teclado', () => {
    const onSelectOption = vi.fn();
    render(
      <ProblemBody problem={transformProblem} fields={fieldsFor()} onSelectOption={onSelectOption} />,
    );
    expect(screen.queryByLabelText('Tu respuesta')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'A' }));
    expect(onSelectOption).toHaveBeenCalledWith('A');
  });

  it('shape-classification responde por opciones textuales', () => {
    const onSelectOption = vi.fn();
    render(
      <ProblemBody problem={classificationProblem} fields={fieldsFor()} onSelectOption={onSelectOption} />,
    );
    expect(screen.queryByLabelText('Tu respuesta')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'cuadrilátero' }));
    expect(onSelectOption).toHaveBeenCalledWith('cuadrilátero');
  });
});
