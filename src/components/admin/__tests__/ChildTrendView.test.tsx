import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChildTrendView } from '../ChildTrendView';
import type { WeeklyBucket } from '../../../utils/weeklyTrend';

const buckets: WeeklyBucket[] = [
  { weekStart: '2026-06-01', total: 0, correct: 0, accuracy: null },
  { weekStart: '2026-06-08', total: 10, correct: 4, accuracy: 40 },
  { weekStart: '2026-06-15', total: 8, correct: 6, accuracy: 75 },
  { weekStart: '2026-06-22', total: 5, correct: 5, accuracy: 100 },
];

describe('ChildTrendView', () => {
  it('muestra el título y una barra por semana', () => {
    render(<ChildTrendView trend={buckets} />);

    expect(screen.getByText(/evolución/i)).toBeInTheDocument();

    const chart = screen.getByRole('img');
    expect(chart.getAttribute('aria-label')).toMatch(/semana/i);
    expect(chart.querySelectorAll('[data-week]')).toHaveLength(4);
  });

  it('etiqueta cada semana con su precisión y total', () => {
    render(<ChildTrendView trend={buckets} />);

    expect(screen.getByTitle(/semana del 8 jun.*40\s?%.*10 intentos/i)).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('las semanas sin intentos se marcan como sin datos', () => {
    render(<ChildTrendView trend={buckets} />);

    expect(screen.getByTitle(/semana del 1 jun.*sin intentos/i)).toBeInTheDocument();
  });

  it('sin datos en ninguna semana no renderiza nada', () => {
    const empty = buckets.map((b) => ({ ...b, total: 0, correct: 0, accuracy: null }));
    const { container } = render(<ChildTrendView trend={empty} />);

    expect(container).toBeEmptyDOMElement();
  });
});
