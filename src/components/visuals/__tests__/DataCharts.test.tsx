import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BarChart } from '../BarChart';
import { Pictogram } from '../Pictogram';
import { ProblemBody, type AnswerFieldsState } from '../../ProblemBody';
import type { DataChartProblem } from '../../../types';

const barProblem: DataChartProblem = {
  prompt: '¿Cuántos votos hay en total entre todas las categorías?',
  operation: 'bar-chart-reading',
  title: 'Fruta favorita del cole',
  unit: 'votos',
  symbol: '🍎',
  symbolValue: 1,
  categories: ['manzana', 'pera', 'uva'],
  values: [3, 7, 5],
  question: 'total',
  questionIndexes: [],
  answer: 15,
  explanation: '3 + 7 + 5 = 15.',
};

const pictogramProblem: DataChartProblem = {
  prompt: '¿Cuántos votos reúne «uva»?',
  operation: 'pictogram-reading',
  title: 'Fruta favorita del cole',
  unit: 'votos',
  symbol: '🍇',
  symbolValue: 2,
  categories: ['manzana', 'pera', 'uva'],
  values: [4, 2, 6],
  question: 'frequency',
  questionIndexes: [2],
  answer: 6,
  explanation: '3 símbolos × 2 = 6.',
};

const unitPictogramProblem: DataChartProblem = {
  prompt: '¿Cuántos votos reúne «pera»?',
  operation: 'pictogram-reading',
  title: 'Fruta favorita del cole',
  unit: 'votos',
  symbol: '🍎',
  symbolValue: 1,
  categories: ['manzana', 'pera', 'uva'],
  values: [2, 3, 5],
  question: 'frequency',
  questionIndexes: [1],
  answer: 3,
  explanation: '3 símbolos × 1 = 3.',
};

/** La tabla equivalente: oculta con sr-only por defecto, accesible por rol y nombre. */
function expectTableHiddenByDefault() {
  const table = screen.getByRole('table', { name: /Tabla de datos/ });
  expect(table.closest('.sr-only')).toBeTruthy();
  const toggle = screen.getByRole('button', { name: 'Ver tabla' });
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
}

/** Al pulsar «Ver tabla» la tabla se hace visible con todos los valores. */
function expectTableRevealsValues() {
  fireEvent.click(screen.getByRole('button', { name: 'Ver tabla' }));
  const table = screen.getByRole('table', { name: /Tabla de datos/ });
  expect(table.closest('.sr-only')).toBeNull();
  for (const value of ['3', '7', '5']) {
    expect(within(table).getByText(value)).toBeTruthy();
  }
  const toggle = screen.getByRole('button', { name: 'Ocultar tabla' });
  expect(toggle.getAttribute('aria-expanded')).toBe('true');
}

const mostFrequentProblem: DataChartProblem = {
  prompt: '¿Cuál es la categoría que más votos reúne?',
  operation: 'pictogram-reading',
  title: 'Fruta favorita del cole',
  unit: 'votos',
  symbol: '🍇',
  symbolValue: 2,
  categories: ['manzana', 'pera', 'uva'],
  values: [4, 2, 6],
  question: 'most-frequent',
  questionIndexes: [2],
  answer: 'uva',
  options: ['manzana', 'pera', 'uva'],
  explanation: '«uva» es la más alta: 6 votos.',
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

describe('BarChart', () => {
  it('dibuja barras proporcionalmente, con eje desde cero y sin etiquetas de valor en las barras', () => {
    render(<BarChart problem={barProblem} />);

    const svg = screen.getByRole('img', { name: /Fruta favorita del cole/ });
    // Eje con líneas de cuadrícula etiquetadas (0, 2, 4, 6, 8).
    for (const label of ['0', '2', '4', '6', '8']) {
      expect(within(svg).getAllByText(label).length).toBeGreaterThan(0);
    }
    // Las barras NO llevan su valor escrito (se lee contra el eje).
    for (const value of ['3', '7', '5']) {
      expect(within(svg).queryByText(value)).toBeNull();
    }
    // Categorías bajo las barras y tabla textual equivalente (oculta por defecto).
    expect(within(svg).getAllByText('manzana').length).toBeGreaterThan(0);
    expectTableHiddenByDefault();
  });

  it('«Ver tabla» muestra la tabla de datos con todos los valores', () => {
    render(<BarChart problem={barProblem} />);
    expectTableRevealsValues();
  });

  it('todas las barras parten de la misma base (misma escala)', () => {
    const { container } = render(<BarChart problem={barProblem} />);
    const bars = container.querySelectorAll('[data-visual-role="bar"]');
    expect(bars).toHaveLength(3);
    const bottoms = [...bars].map((bar) => Number((bar as SVGRectElement).getAttribute('y')) + Number((bar as SVGRectElement).getAttribute('height')));
    // La base (parte inferior) es la misma para todas.
    expect(new Set(bottoms).size).toBe(1);
    // La más alta corresponde al valor máximo (7).
    const heights = [...bars].map((bar) => Number((bar as SVGRectElement).getAttribute('height')));
    expect(heights.indexOf(Math.max(...heights))).toBe(1);
  });
});

describe('Pictogram', () => {
  it('dibuja símbolos completos según la leyenda y muestra la tabla', () => {
    const { container } = render(<Pictogram problem={pictogramProblem} />);

    // Símbolos completos: 4/2 + 2/2 + 6/2 = 6 símbolos, sin medias figuras.
    expect(container.querySelectorAll('[data-visual-role="symbol"]')).toHaveLength(6);
    // Leyenda explícita, con singular/plural correcto.
    expect(screen.getByText(/1 🍇 = 2 votos/)).toBeTruthy();
    expectTableHiddenByDefault();
  });

  it('la leyenda usa singular cuando cada símbolo vale 1', () => {
    render(<Pictogram problem={unitPictogramProblem} />);
    expect(screen.getByText(/1 🍎 = 1 voto/)).toBeTruthy();
    expect(screen.queryByText(/1 voto(s)? de error|1 votos/)).toBeNull();
  });
});

describe('ProblemBody con gráficos de datos', () => {
  it('las preguntas numéricas muestran el gráfico y el campo de respuesta', () => {
    render(<ProblemBody problem={barProblem} fields={fieldsFor()} onSelectOption={() => {}} />);
    expect(screen.getByRole('img', { name: /Fruta favorita del cole/ })).toBeTruthy();
    expect(screen.getByLabelText('Tu respuesta')).toBeTruthy();
  });

  it('«el más frecuente» responde por opciones y no por teclado', () => {
    const onSelectOption = vi.fn();
    render(
      <ProblemBody problem={mostFrequentProblem} fields={fieldsFor()} onSelectOption={onSelectOption} />,
    );
    expect(screen.queryByLabelText('Tu respuesta')).toBeNull();
    const uva = screen.getByRole('button', { name: 'uva' });
    fireEvent.click(uva);
    expect(onSelectOption).toHaveBeenCalledWith('uva');
  });

  it('«el más frecuente» en pictograma dibuja el gráfico junto a las opciones', () => {
    const onSelectOption = vi.fn();
    render(
      <ProblemBody problem={mostFrequentProblem} fields={fieldsFor()} onSelectOption={onSelectOption} />,
    );
    // El pictograma debe estar dibujado: sin él la pregunta no se puede responder.
    expect(screen.getByRole('img', { name: /Fruta favorita del cole/ })).toBeTruthy();
    expect(screen.queryByLabelText('Tu respuesta')).toBeNull();
    for (const option of ['manzana', 'pera', 'uva']) {
      expect(screen.getByRole('button', { name: option })).toBeTruthy();
    }
  });

  it('«el más frecuente» en barras dibuja el gráfico junto a las opciones', () => {
    const barMostFrequent: DataChartProblem = { ...barProblem, question: 'most-frequent', answer: 'uva', questionIndexes: [2] };
    render(<ProblemBody problem={barMostFrequent} fields={fieldsFor()} onSelectOption={() => {}} />);
    expect(screen.getByRole('img', { name: /Fruta favorita del cole/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'uva' })).toBeTruthy();
    expect(screen.queryByLabelText('Tu respuesta')).toBeNull();
  });
});
