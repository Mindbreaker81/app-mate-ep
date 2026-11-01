import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChildReportView } from '../ChildReportView';
import { buildChildReport, type ChildAttempt } from '../../../utils/childReport';

function attempt(overrides: Partial<ChildAttempt> = {}): ChildAttempt {
  return {
    operation: 'addition',
    grade: '5e',
    isCorrect: true,
    timeSpent: 10,
    createdAt: '2026-07-18T10:00:00Z',
    ...overrides,
  };
}

describe('ChildReportView', () => {
  it('distingue el curso elegido del tramo del contenido (ESO bajo 6.º)', () => {
    const report = buildChildReport([
      attempt({ grade: '6e', operation: 'two-step-equation' }),
    ]);

    render(<ChildReportView report={report} />);

    expect(screen.getByText(/curso elegido: 6\.º de primaria/i)).toBeInTheDocument();
    // El contenido T3 se etiqueta como ampliación ESO, nunca como «6.º».
    expect(screen.getAllByText('Ampliación ESO').length).toBeGreaterThan(0);
    expect(screen.getByText(/por tramo de contenido/i)).toBeInTheDocument();
  });

  it('muestra el repaso de 4.º como tramo propio', () => {
    const report = buildChildReport([attempt({ grade: '4t', operation: 'addition' })]);

    render(<ChildReportView report={report} />);

    expect(screen.getByText(/curso elegido: 4\.º de primaria/i)).toBeInTheDocument();
    expect(screen.getAllByText('Repaso de 4.º').length).toBeGreaterThan(0);
  });

  it('agrupa los tramos del ciclo sin atribuirlos a un curso', () => {
    const report = buildChildReport([
      attempt({ grade: '5e', operation: 'decimal-addition' }),
      attempt({ grade: '6e', operation: 'decimal-addition' }),
    ]);

    render(<ChildReportView report={report} />);

    // Un solo tramo «Consolidación del ciclo 5.º–6.º» suma los intentos de ambos cursos.
    const stageSection = screen.getByText(/por tramo de contenido/i).closest('section')!;
    expect(
      within(stageSection).getByText(/contenido: consolidación del ciclo 5\.º–6\.º/i),
    ).toBeInTheDocument();
    expect(within(stageSection).getByText(/2 intentos · 100% de aciertos/i)).toBeInTheDocument();
  });

  it('resume el origen: modo libre frente a «Mi camino»', () => {
    const report = buildChildReport([
      attempt({ grade: '4t', operation: 'addition', source: 'free' }),
      attempt({ grade: '4t', operation: 'addition', source: 'path', isCorrect: false }),
      attempt({ grade: '6e', operation: 'two-step-equation', source: 'daily-session' }),
    ]);

    render(<ChildReportView report={report} />);

    const freeCard = screen.getByText('Modo libre').closest('div')!;
    expect(within(freeCard).getByText(/1 intento · 100% de aciertos/i)).toBeInTheDocument();
    const pathCard = screen.getByText('Mi camino').closest('div')!;
    expect(within(pathCard).getByText(/2 intentos · 50% de aciertos/i)).toBeInTheDocument();
  });
});
