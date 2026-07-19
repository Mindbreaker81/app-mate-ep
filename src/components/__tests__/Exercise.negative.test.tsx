import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Exercise } from '../Exercise';

const exerciseMocks = vi.hoisted(() => ({
  checkAnswer: vi.fn(),
  nextProblem: vi.fn(),
  setAnswer: vi.fn(),
  state: {
    currentProblem: null as unknown,
    userAnswer: '',
    isCorrect: null,
    timeRemaining: 0,
    isTimerActive: false,
    practiceMode: 'all',
    timeMode: 'no-limit',
    grade: '6e',
    level: 1,
  },
}));

vi.mock('../../context/GameContext', () => ({
  useGame: () => ({
    state: exerciseMocks.state,
    checkAnswer: exerciseMocks.checkAnswer,
    nextProblem: exerciseMocks.nextProblem,
    setAnswer: exerciseMocks.setAnswer,
  }),
}));

const integerProblem = {
  display: '(-5) + 3',
  num1: -5,
  num2: 3,
  operation: 'integer-addition',
  answer: -2,
  explanation: '(-5) + 3 = -2',
};

describe('Exercise — respuestas negativas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(exerciseMocks.state, {
      currentProblem: integerProblem,
      userAnswer: '',
      isCorrect: null,
      practiceMode: 'integers',
    });
  });

  it('muestra el botón ± en problemas de enteros', () => {
    render(<Exercise />);

    expect(screen.getByRole('button', { name: /cambiar signo/i })).toBeInTheDocument();
  });

  it('el botón ± añade el signo menos a la respuesta', () => {
    exerciseMocks.state.userAnswer = '5';

    render(<Exercise />);

    fireEvent.click(screen.getByRole('button', { name: /cambiar signo/i }));

    expect(exerciseMocks.setAnswer).toHaveBeenCalledWith('-5');
  });

  it('el botón ± quita el signo menos si ya lo tiene', () => {
    exerciseMocks.state.userAnswer = '-5';

    render(<Exercise />);

    fireEvent.click(screen.getByRole('button', { name: /cambiar signo/i }));

    expect(exerciseMocks.setAnswer).toHaveBeenCalledWith('5');
  });

  it('no muestra el botón ± en sumas normales', () => {
    Object.assign(exerciseMocks.state, {
      currentProblem: {
        num1: 2,
        num2: 3,
        operation: 'addition',
        answer: 5,
        explanation: '2 + 3 = 5',
      },
      practiceMode: 'all',
      grade: '4t',
    });

    render(<Exercise />);

    expect(screen.queryByRole('button', { name: /cambiar signo/i })).not.toBeInTheDocument();
  });
});
