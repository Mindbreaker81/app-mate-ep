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

const KEYBOARD_KEY = 'pitagoritas.mathKeyboard.anon';

describe('Exercise — teclado matemático opcional', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    Object.assign(exerciseMocks.state, {
      currentProblem: { num1: 2, num2: 3, operation: 'addition', answer: 5, explanation: '2 + 3 = 5' },
      userAnswer: '',
      isCorrect: null,
      practiceMode: 'all',
    });
  });

  it('el teclado se abre por decisión del niño y guarda su preferencia', () => {
    render(<Exercise />);

    // Cerrado por defecto.
    expect(screen.queryByRole('group', { name: 'Teclado matemático' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Teclado/ }));
    expect(screen.getByRole('group', { name: 'Teclado matemático' })).toBeTruthy();
    expect(JSON.parse(window.localStorage.getItem(KEYBOARD_KEY) ?? '{}')).toEqual({ enabled: true });
    expect(screen.getByRole('button', { name: /Teclado/ }).getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: /Teclado/ }));
    expect(screen.queryByRole('group', { name: 'Teclado matemático' })).toBeNull();
    expect(JSON.parse(window.localStorage.getItem(KEYBOARD_KEY) ?? '{}')).toEqual({ enabled: false });
  });

  it('escribe en el campo de respuesta y no envía el formulario', () => {
    render(<Exercise />);
    fireEvent.click(screen.getByRole('button', { name: /Teclado/ }));
    const group = screen.getByRole('group', { name: 'Teclado matemático' });
    fireEvent.click(within(group).getByRole('button', { name: '4' }));
    expect(exerciseMocks.state.userAnswer).toBe('4');
  });

  it('los símbolos disponibles dependen del tipo de respuesta', () => {
    // Sumas: sin negativos y sin decimales.
    render(<Exercise />);
    fireEvent.click(screen.getByRole('button', { name: /Teclado/ }));
    const group = screen.getByRole('group', { name: 'Teclado matemático' });
    expect(within(group).queryByRole('button', { name: 'Coma' })).toBeNull();
    expect(within(group).queryByRole('button', { name: 'Cambiar signo' })).toBeNull();
  });

  it('los enteros muestran ±', () => {
    exerciseMocks.state.currentProblem = {
      display: '-3 + 5',
      operation: 'integer-addition',
      answer: 2,
      explanation: '...',
    };
    render(<Exercise />);
    fireEvent.click(screen.getByRole('button', { name: /Teclado/ }));
    expect(within(screen.getByRole('group', { name: 'Teclado matemático' })).getByRole('button', { name: 'Cambiar signo' })).toBeTruthy();
  });

  it('los decimales muestran la coma', () => {
    exerciseMocks.state.currentProblem = {
      num1: 1.5,
      num2: 2.25,
      operation: 'decimal-addition',
      answer: 3.75,
      explanation: '...',
    };
    render(<Exercise />);
    fireEvent.click(screen.getByRole('button', { name: /Teclado/ }));
    expect(within(screen.getByRole('group', { name: 'Teclado matemático' })).getByRole('button', { name: 'Coma' })).toBeTruthy();
  });

  it('las fracciones muestran la barra para cambiar de campo', () => {
    exerciseMocks.state.currentProblem = {
      num1: { numerator: 1, denominator: 2 },
      num2: { numerator: 1, denominator: 4 },
      operation: 'fraction-addition',
      answer: { numerator: 3, denominator: 4 },
      explanation: '...',
    };
    render(<Exercise />);
    fireEvent.click(screen.getByRole('button', { name: /Teclado/ }));
    expect(within(screen.getByRole('group', { name: 'Teclado matemático' })).getByRole('button', { name: 'Siguiente campo' })).toBeTruthy();
  });

  it('los problemas de opción múltiple no ofrecen teclado', () => {
    exerciseMocks.state.currentProblem = {
      prompt: '¿Qué símbolo va entre 3/4 y 2/4?',
      operation: 'compare-fractions',
      answer: '>',
      explanation: '3/4 > 2/4',
    };
    render(<Exercise />);
    expect(screen.queryByRole('button', { name: /Teclado/ })).toBeNull();
  });
});
