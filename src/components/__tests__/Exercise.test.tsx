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
    grade: '5e',
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

describe('Exercise', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders powers using superscript notation', () => {
    Object.assign(exerciseMocks.state, {
      currentProblem: {
        base: 5,
        exponent: 2,
        operation: 'power',
        answer: 25,
        explanation: '5² = 25',
      },
      userAnswer: '',
      practiceMode: 'powers',
    });

    render(<Exercise />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('2', { selector: 'sup' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/tu respuesta/i)).toBeInTheDocument();
  });

  it('validates empty factorization answers before submitting', () => {
    Object.assign(exerciseMocks.state, {
      currentProblem: {
        target: 12,
        operation: 'factorization',
        answer: '2 × 2 × 3',
        explanation: '12 = 2 × 2 × 3',
      },
      userAnswer: '',
      practiceMode: 'factorization',
    });

    render(<Exercise />);

    fireEvent.click(screen.getByRole('button', { name: /enviar/i }));

    expect(screen.getByText(/escribe una respuesta antes de enviarla/i)).toBeInTheDocument();
    expect(exerciseMocks.checkAnswer).not.toHaveBeenCalled();
  });
});
