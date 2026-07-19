import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Home } from '../Home';

const homeMocks = vi.hoisted(() => ({
  resetGame: vi.fn(),
  setGrade: vi.fn(),
  state: {
    currentProblem: {
      num1: 2,
      num2: 2,
      operation: 'addition',
      answer: 4,
      explanation: 'Suma',
    },
    userAnswer: '',
    isCorrect: null,
    score: 5,
    streak: 2,
    level: 1,
    grade: '4t',
    achievements: [],
    stats: null,
    practiceMode: 'all',
    timeMode: 'no-limit',
    timeRemaining: 0,
    isTimerActive: false,
    recentAchievement: null,
    daily: null,
    practiceDays: [],
  },
}));

vi.mock('../../context/GameContext', () => ({
  useGame: () => ({
    state: homeMocks.state,
    resetGame: homeMocks.resetGame,
    setGrade: homeMocks.setGrade,
    checkAnswer: vi.fn(),
    nextProblem: vi.fn(),
    setAnswer: vi.fn(),
  }),
}));

vi.mock('../Exercise', () => ({ Exercise: () => <div data-testid="exercise" /> }));

describe('Home — confirmación de reinicio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('el primer clic no reinicia: pide confirmación', () => {
    render(<Home />);

    fireEvent.click(screen.getByRole('button', { name: /reiniciar juego/i }));

    expect(homeMocks.resetGame).not.toHaveBeenCalled();
    expect(screen.getByText(/¿seguro\?/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sí, reiniciar/i })).toBeInTheDocument();
  });

  it('confirmar sí reinicia', () => {
    render(<Home />);

    fireEvent.click(screen.getByRole('button', { name: /reiniciar juego/i }));
    fireEvent.click(screen.getByRole('button', { name: /sí, reiniciar/i }));

    expect(homeMocks.resetGame).toHaveBeenCalled();
  });

  it('cancelar vuelve al botón original sin reiniciar', () => {
    render(<Home />);

    fireEvent.click(screen.getByRole('button', { name: /reiniciar juego/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(homeMocks.resetGame).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /reiniciar juego/i })).toBeInTheDocument();
  });
});
