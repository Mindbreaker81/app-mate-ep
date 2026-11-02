import { fireEvent, render, screen, within } from '@testing-library/react';
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
    setAnswer: (value: string) => {
      exerciseMocks.state.userAnswer = value;
    },
  }),
}));

const decimalProblem = {
  prompt: '¿Qué número está marcado con el punto en la recta?',
  operation: 'number-line-decimal',
  start: 0,
  step: 0.1,
  tickCount: 6,
  pointIndex: 3,
  scale: 1,
  answer: 0.3,
  explanation: '0 + 3 × 0.1 = 0.3',
};

const integerProblem = {
  prompt: '¿Qué número está marcado con el punto en la recta?',
  operation: 'number-line-integer',
  start: -4,
  step: 1,
  tickCount: 9,
  pointIndex: 5,
  scale: 0,
  answer: 1,
  explanation: '-4 + 5 × 1 = 1',
};

describe('Exercise — recta numérica visual', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(exerciseMocks.state, {
      currentProblem: decimalProblem,
      userAnswer: '',
      isCorrect: null,
      practiceMode: 'all',
    });
  });

  it('muestra la recta accesible y el campo de respuesta, sin revelar la solución', () => {
    render(<Exercise />);

    expect(screen.getByRole('img', { name: /Recta numérica/ })).toBeTruthy();
    expect(screen.getByText(/marcas cada 0\.1/)).toBeTruthy();
    expect(screen.queryByText('0.3')).toBeNull();
    expect(screen.getByLabelText('Tu respuesta')).toBeTruthy();
  });

  it('el campo acepta la coma decimal y la pasa al estado', () => {
    render(<Exercise />);
    const input = screen.getByLabelText('Tu respuesta') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '0,3' } });
    // El mock del contexto muta el estado sin re-render: comprobamos el valor
    // que llegará a checkAnswer (la aceptación de coma/punto se cubre en
    // numberLine.test.ts vía answersMatch).
    expect(exerciseMocks.state.userAnswer).toBe('0,3');
  });

  it('en la recta de enteros el teclado en pantalla ofrece ±', () => {
    exerciseMocks.state.currentProblem = integerProblem;
    render(<Exercise />);

    fireEvent.click(screen.getByRole('button', { name: /Teclado/ }));
    const group = screen.getByRole('group', { name: 'Teclado matemático' });
    expect(within(group).getByRole('button', { name: 'Cambiar signo' })).toBeTruthy();
  });
});
