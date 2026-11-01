import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../AuthContext';
import { GameProvider, useGame } from '../GameContext';
import type { ExamQuestion } from '../../types';

const mockState = vi.hoisted(() => ({
  fixedProblem: {
    num1: 2,
    num2: 2,
    operation: 'addition' as const,
    answer: 4,
    explanation: 'Suma simple',
  },
}));

vi.mock('../../utils/problemGenerator', () => ({
  generateProblem: vi.fn(() => mockState.fixedProblem),
  generateOperation: vi.fn(() => mockState.fixedProblem),
  getDifficulty: vi.fn(() => 'easy'),
}));

vi.mock('../../services/attemptService', () => ({
  recordAttemptDirect: vi.fn(),
  flushQueue: vi.fn().mockResolvedValue(undefined),
  migrateLegacyData: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../services/statsService', () => ({
  fetchUserStats: vi.fn().mockResolvedValue(null),
  fetchOwnAttempts: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../services/gameStateService', () => ({
  loadGameState: vi.fn().mockResolvedValue(null),
  saveGameState: vi.fn().mockResolvedValue(true),
}));

const QUESTIONS: ExamQuestion[] = [
  {
    skillId: 'sumas-restas',
    skillName: 'Sumas y restas',
    problem: { operation: 'addition', num1: 2, num2: 3, answer: 5, explanation: 'Suma' },
  },
  {
    skillId: 'sumas-restas',
    skillName: 'Sumas y restas',
    problem: { operation: 'subtraction', num1: 9, num2: 4, answer: 5, explanation: 'Resta' },
  },
];

function renderProbe() {
  const authValue: AuthContextValue = {
    session: null,
    profile: null,
    isAdmin: false,
    loading: false,
    error: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signInAdmin: vi.fn(),
    changePassword: vi.fn(),
    signOut: vi.fn(),
    clearError: vi.fn(),
  };
  return render(
    <AuthContext.Provider value={authValue}>
      <GameProvider>
        <Probe />
      </GameProvider>
    </AuthContext.Provider>,
  );
}

function Probe() {
  const { state, dispatch } = useGame();
  return (
    <div>
      <div data-testid="exam">{state.exam ? 'activo' : 'no'}</div>
      <div data-testid="index">{state.exam?.index ?? '-'}</div>
      <div data-testid="finished">{state.exam?.finished ? 'sí' : 'no'}</div>
      <div data-testid="answer0">{state.exam?.answers[0] === undefined ? '-' : String(state.exam.answers[0])}</div>
      <div data-testid="total">{state.totalExercises}</div>
      <div data-testid="correct">{state.correctExercises}</div>
      <div data-testid="skills">{Object.keys(state.skillProgress ?? {}).length}</div>
      <div data-testid="achievements">{state.achievements.filter((a) => a.unlocked).length}</div>
      <button type="button" onClick={() => dispatch({ type: 'START_EXAM', payload: QUESTIONS })}>
        empezar
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: 'ANSWER_EXAM', payload: { index: 0, answer: '5' } })}
      >
        responder
      </button>
      <button type="button" onClick={() => dispatch({ type: 'ADVANCE_EXAM' })}>
        siguiente
      </button>
      <button type="button" onClick={() => dispatch({ type: 'FINISH_EXAM' })}>
        terminar
      </button>
      <button type="button" onClick={() => dispatch({ type: 'CANCEL_EXAM' })}>
        cancelar
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: 'HYDRATE_PERSISTED',
            payload: {
              maxScore: 1,
              bestStreak: 1,
              totalExercises: 3,
              correctExercises: 2,
              timedCorrectExercises: 0,
              achievements: [],
            },
          })
        }
      >
        hidratar
      </button>
    </div>
  );
}

describe('GameContext — repaso de examen (PIT-32)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('ciclo de vida: empezar, responder, navegar, terminar', () => {
    renderProbe();
    expect(screen.getByTestId('exam')).toHaveTextContent('no');

    fireEvent.click(screen.getByText('empezar'));
    expect(screen.getByTestId('exam')).toHaveTextContent('activo');
    expect(screen.getByTestId('index')).toHaveTextContent('0');
    expect(screen.getByTestId('finished')).toHaveTextContent('no');

    fireEvent.click(screen.getByText('responder'));
    expect(screen.getByTestId('answer0')).toHaveTextContent('5');

    fireEvent.click(screen.getByText('siguiente'));
    expect(screen.getByTestId('index')).toHaveTextContent('1');

    fireEvent.click(screen.getByText('terminar'));
    expect(screen.getByTestId('finished')).toHaveTextContent('sí');
    // El examen sigue disponible para mostrar el resumen.
    expect(screen.getByTestId('exam')).toHaveTextContent('activo');
  });

  it('responder y terminar el examen no toca puntuación, dominio ni logros', () => {
    renderProbe();
    fireEvent.click(screen.getByText('empezar'));
    fireEvent.click(screen.getByText('responder'));
    fireEvent.click(screen.getByText('siguiente'));
    fireEvent.click(screen.getByText('terminar'));

    expect(screen.getByTestId('total')).toHaveTextContent('0');
    expect(screen.getByTestId('correct')).toHaveTextContent('0');
    expect(screen.getByTestId('skills')).toHaveTextContent('0');
    expect(screen.getByTestId('achievements')).toHaveTextContent('0');
  });

  it('cancelar descarta el examen sin tocar el progreso', () => {
    renderProbe();
    fireEvent.click(screen.getByText('empezar'));
    fireEvent.click(screen.getByText('responder'));
    fireEvent.click(screen.getByText('cancelar'));

    expect(screen.getByTestId('exam')).toHaveTextContent('no');
    expect(screen.getByTestId('total')).toHaveTextContent('0');
    expect(screen.getByTestId('skills')).toHaveTextContent('0');
  });

  it('la hidratación de otro estado persistido descarta el examen en curso', () => {
    // Al llegar el estado de otro usuario (o un merge remoto) el examen local
    // no debe seguir vivo: las respuestas no se atribuyen a otra cuenta.
    renderProbe();
    fireEvent.click(screen.getByText('empezar'));
    fireEvent.click(screen.getByText('responder'));
    fireEvent.click(screen.getByText('hidratar'));

    expect(screen.getByTestId('exam')).toHaveTextContent('no');
    expect(screen.getByTestId('total')).toHaveTextContent('3');
  });
});
