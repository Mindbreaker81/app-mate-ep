import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Exercise } from '../Exercise';

const exerciseMocks = vi.hoisted(() => ({
  checkAnswer: vi.fn(),
  nextProblem: vi.fn(),
  setAnswer: vi.fn(),
  state: {
    currentProblem: null,
    userAnswer: '',
    isCorrect: null,
    timeRemaining: 0,
    isTimerActive: false,
    practiceMode: 'all',
    timeMode: 'no-limit',
    grade: '6e',
    level: 1,
    levelMode: 'auto',
    skillProgress: {},
    streak: 0,
  },
}));

vi.mock('../../utils/celebration', () => ({ celebrate: vi.fn() }));

vi.mock('../../context/GameContext', () => ({
  useGame: () => ({
    state: exerciseMocks.state,
    checkAnswer: exerciseMocks.checkAnswer,
    nextProblem: exerciseMocks.nextProblem,
    setAnswer: exerciseMocks.setAnswer,
    dispatch: vi.fn(),
  }),
}));

describe('Exercise + glosario', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(exerciseMocks.state, {
      currentProblem: {
        operation: 'mean',
        values: [4, 6, 8],
        prompt: '¿Cuál es la media de estos datos?',
        answer: 6,
        explanation: 'Media = (4 + 6 + 8) ÷ 3 = 6.',
      },
      userAnswer: '6',
      isCorrect: true,
      skillProgress: {},
      streak: 1,
    });
  });

  it('enlaza la explicación con los términos del glosario por ID explícito', () => {
    render(<Exercise />);

    fireEvent.click(screen.getByRole('button', { name: /por qué/i }));

    expect(screen.getByRole('button', { name: /ver «media» en el glosario/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ver «mediana» en el glosario/i })).toBeInTheDocument();
  });

  it('abre el glosario en el término enlazado sin perder el ejercicio', () => {
    render(<Exercise />);

    fireEvent.click(screen.getByRole('button', { name: /por qué/i }));
    fireEvent.click(screen.getByRole('button', { name: /ver «media» en el glosario/i }));

    const dialog = screen.getByRole('dialog', { name: /glosario/i });
    expect(dialog).toBeInTheDocument();
    expect(dialog.querySelector('[aria-current="true"]')).toHaveTextContent('mitjana');

    fireEvent.keyDown(dialog, { key: 'Escape' });

    expect(screen.queryByRole('dialog', { name: /glosario/i })).not.toBeInTheDocument();
    // El ejercicio resuelto sigue en pantalla tras cerrar el glosario.
    expect(screen.getByText(/¡correcto!/i)).toBeInTheDocument();
  });
});
