import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Exercise } from '../Exercise';

vi.mock('../../utils/celebration', () => ({ celebrate: vi.fn() }));

const exerciseMocks = vi.hoisted(() => ({
  checkAnswer: vi.fn(),
  nextProblem: vi.fn(),
  setAnswer: vi.fn(),
  state: {
    currentProblem: null as unknown,
    userAnswer: '',
    isCorrect: null as boolean | null,
    timeRemaining: 0,
    isTimerActive: false,
    practiceMode: 'all',
    timeMode: 'no-limit',
    grade: '5e',
    level: 1,
    streak: 0,
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

const additionProblem = {
  num1: 2,
  num2: 3,
  operation: 'addition',
  answer: 5,
  explanation: '2 + 3 = 5',
};

const compareProblem = {
  prompt: '¿Qué símbolo va entre 3/4 y 2/4?',
  operation: 'compare-fractions',
  answer: '>',
  explanation: '3/4 > 2/4',
};

describe('Exercise — fluidez', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(exerciseMocks.state, {
      currentProblem: additionProblem,
      userAnswer: '',
      isCorrect: null,
      practiceMode: 'all',
    });
  });

  it('Enter pasa al siguiente problema cuando ya se respondió', () => {
    exerciseMocks.state.isCorrect = true;

    render(<Exercise />);

    fireEvent.keyDown(window, { key: 'Enter' });

    expect(exerciseMocks.nextProblem).toHaveBeenCalled();
  });

  it('Enter no hace nada si aún no se respondió', () => {
    render(<Exercise />);

    fireEvent.keyDown(window, { key: 'Enter' });

    expect(exerciseMocks.nextProblem).not.toHaveBeenCalled();
  });

  it('tocar una opción de opción múltiple envía la respuesta directamente', () => {
    Object.assign(exerciseMocks.state, { currentProblem: compareProblem });

    render(<Exercise />);

    fireEvent.click(screen.getByRole('button', { name: /el primero es mayor/i }));

    expect(exerciseMocks.checkAnswer).toHaveBeenCalledWith('>');
    expect(screen.queryByRole('button', { name: /enviar/i })).not.toBeInTheDocument();
  });

  it('tras acertar, «¿Por qué?» muestra la explicación', () => {
    exerciseMocks.state.isCorrect = true;

    render(<Exercise />);

    expect(screen.queryByText('2 + 3 = 5')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /por qué/i }));

    expect(screen.getByText('2 + 3 = 5')).toBeInTheDocument();
  });
});
