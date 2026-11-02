import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { SkillProgress } from '../../../types';
import type { AttemptRecord } from '../../../services/adminService';
import { SkillMasteryView } from '../SkillMasteryView';

const NOW = new Date('2026-11-04T12:00:00'); // miércoles; semana desde el lunes 2 nov

const progress = (overrides: Partial<SkillProgress> = {}): SkillProgress => ({
  state: 'practicing',
  recentResults: [],
  streakCorrect: 0,
  streakWrong: 0,
  activeDays: [],
  reviewDueDate: null,
  reviewCount: 0,
  level: 1,
  updatedAt: '2026-10-31T10:00:00Z',
  ...overrides,
});

const weekAttempt = (
  operation: string,
  grade: string,
  source: AttemptRecord['source'],
  isCorrect: boolean,
  createdAt = '2026-11-03T09:00:00',
): AttemptRecord =>
  ({ userId: 'u1', operation, grade, source, isCorrect, timeSpent: 5, createdAt }) as AttemptRecord;

const SKILLS_FIXTURE: Record<string, SkillProgress> = {
  'sumas-restas': progress({ state: 'dominated', level: 3, reviewDueDate: '2026-12-01' }),
  'multiplicacion-division': progress({ state: 'review', level: 2, reviewDueDate: '2026-11-01', reviewCount: 1 }),
  'fracciones-basicas': progress({ recentResults: [true, false, true], activeDays: ['2026-11-01'], level: 2 }),
};

const ATTEMPTS_FIXTURE: AttemptRecord[] = [
  weekAttempt('addition', '4t', 'free', true, '2026-11-02T09:00:00'),
  weekAttempt('addition', '6e', 'daily-session', true),
  weekAttempt('two-step-equation', '6e', 'path', false, '2026-11-04T09:00:00'),
  weekAttempt('operacion-inexistente', '5e', 'free', true, '2026-11-04T10:00:00'),
];

describe('SkillMasteryView', () => {
  it('resume la semana distinguiendo procedencia y tramo del contenido', () => {
    render(<SkillMasteryView skills={SKILLS_FIXTURE} updatedAt={null} attempts={ATTEMPTS_FIXTURE} now={NOW} />);

    expect(screen.getByText(/4 intentos · 75% de aciertos/)).toBeInTheDocument();
    expect(screen.getByText('Procedencia')).toBeInTheDocument();
    expect(screen.getByText('Modo libre')).toBeInTheDocument();
    expect(screen.getByText('Sesión diaria')).toBeInTheDocument();
    expect(screen.getByText('Mi camino')).toBeInTheDocument();
    expect(screen.getByText('Tramo del contenido')).toBeInTheDocument();
    expect(screen.getByText('Repaso de 4.º')).toBeInTheDocument();
    expect(screen.getByText('Inicio del ciclo 5.º–6.º')).toBeInTheDocument();
    expect(screen.getByText('Ampliación ESO')).toBeInTheDocument();
    expect(screen.getByText('Sin clasificar')).toBeInTheDocument();
  });

  it('sin intentos esta semana lo dice sin inventar datos', () => {
    render(<SkillMasteryView skills={SKILLS_FIXTURE} updatedAt={null} attempts={[]} now={NOW} />);

    expect(screen.getByText('Esta semana todavía no ha hecho ejercicios.')).toBeInTheDocument();
  });

  it('sin intentos cargados muestra el aviso de carga fallida', () => {
    render(<SkillMasteryView skills={SKILLS_FIXTURE} updatedAt={null} attempts={null} now={NOW} />);

    expect(screen.getByText('No pudimos cargar los intentos de esta semana.')).toBeInTheDocument();
  });

  it('lista los repasos pendientes con la fecha desde la que tocan', () => {
    render(<SkillMasteryView skills={SKILLS_FIXTURE} updatedAt={null} attempts={[]} now={NOW} />);

    expect(screen.getByText(/Repasos pendientes/)).toBeInTheDocument();
    // Aparece en la lista de repasos y en su propia fila del mapa de dominio
    expect(screen.getAllByText(/Multiplicación y división/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/le toca repasar desde el 1 nov/)).toBeInTheDocument();
  });

  it('sin repasos pendientes lo indica claramente', () => {
    render(<SkillMasteryView skills={{}} updatedAt={null} attempts={[]} now={NOW} />);

    expect(screen.getByText(/Ninguno ahora mismo/)).toBeInTheDocument();
  });

  it('muestra el estado de cada habilidad: dominada, en práctica, sin empezar y bloqueada', () => {
    render(<SkillMasteryView skills={SKILLS_FIXTURE} updatedAt={null} attempts={[]} now={NOW} />);

    expect(screen.getByText('Dominada')).toBeInTheDocument();
    expect(screen.getByText('En práctica')).toBeInTheDocument();
    // decimales queda abierta (su prerrequisito está en repaso) pero sin registro
    expect(screen.getAllByText('Sin empezar').length).toBeGreaterThan(0);
    // estimacion-redondeo necesita decimales, que aún no se practicó
    expect(screen.getAllByText('Bloqueada').length).toBeGreaterThan(0);
    const estimacionRow = screen.getByText(/Estimación y redondeo/).closest('li')!;
    expect(within(estimacionRow).getByText(/Se desbloquea al dominar: Decimales/)).toBeInTheDocument();
    expect(screen.getByText(/Nivel 3\/3 · dominada el/)).toBeInTheDocument();
  });

  it('sin progreso guardado avisa de ausencia de datos, no de suspenso', () => {
    render(<SkillMasteryView skills={{}} updatedAt={null} attempts={[]} now={NOW} />);

    expect(screen.getByText(/Todavía no hay progreso guardado en «Mi camino»/)).toBeInTheDocument();
  });
});
