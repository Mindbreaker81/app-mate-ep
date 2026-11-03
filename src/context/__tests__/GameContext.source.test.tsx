import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';
import { AuthContext, type AuthContextValue } from '../AuthContext';
import { GameProvider, useGame } from '../GameContext';

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
  generateOperation: vi.fn((operation: string) => ({
    ...mockState.fixedProblem,
    operation,
    prompt: `op:${operation}`,
  })),
  getDifficulty: vi.fn(() => 'easy'),
}));

const attemptServiceMocks = vi.hoisted(() => ({
  recordAttemptDirect: vi.fn(),
  flushQueue: vi.fn().mockResolvedValue(undefined),
  migrateLegacyData: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../services/attemptService', () => attemptServiceMocks);

vi.mock('../../services/statsService', () => ({
  fetchUserStats: vi.fn().mockResolvedValue(null),
  fetchOwnAttempts: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../services/gameStateService', () => ({
  loadGameState: vi.fn().mockResolvedValue(null),
  saveGameState: vi.fn().mockResolvedValue(true),
}));

function Harness() {
  const { dispatch, setPracticeMode, setAnswer, checkAnswer } = useGame();
  return (
    <div>
      <button type="button" onClick={() => dispatch({ type: 'SET_PATH_SKILL', payload: 'sumas-restas' })}>
        empezar habilidad
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({ type: 'START_DAILY_SESSION', payload: ['sumas-restas', 'division-con-resto'] })
        }
      >
        sesión 2 habilidades
      </button>
      <button
        type="button"
        onClick={() => {
          setAnswer('4');
          checkAnswer('4');
        }}
      >
        responder bien
      </button>
      <button type="button" onClick={() => dispatch({ type: 'NEXT_PROBLEM' })}>
        siguiente
      </button>
      <button type="button" onClick={() => setPracticeMode('division')}>
        modo manual
      </button>
    </div>
  );
}

function renderWithSession() {
  const authValue: AuthContextValue = {
    session: { user: { id: 'uuid-nino' } } as Session,
    profile: null,
    isAdmin: false,
    loading: false,
    error: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signInAdmin: vi.fn(),
    changePassword: vi.fn(),
    requestPasswordReset: vi.fn(),
    passwordRecovery: false,
    finishPasswordRecovery: vi.fn(),
    signOut: vi.fn(),
    clearError: vi.fn(),
  };
  return render(
    <AuthContext.Provider value={authValue}>
      <GameProvider>
        <Harness />
      </GameProvider>
    </AuthContext.Provider>,
  );
}

const lastPayload = () =>
  attemptServiceMocks.recordAttemptDirect.mock.calls.at(-1)![1] as { source?: string };

describe('GameContext — source del intento', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('el modo libre guarda source «free»', () => {
    renderWithSession();

    act(() => {
      screen.getByText('responder bien').click();
    });

    expect(attemptServiceMocks.recordAttemptDirect).toHaveBeenCalledTimes(1);
    expect(lastPayload().source).toBe('free');
  });

  it('la práctica de una habilidad de «Mi camino» guarda «path»', () => {
    renderWithSession();

    // Un act por evento de usuario: dentro de un mismo act React no
    // re-renderiza entre clicks y checkAnswer usaría el estado anterior.
    act(() => {
      screen.getByText('empezar habilidad').click();
    });
    act(() => {
      screen.getByText('responder bien').click();
    });

    expect(lastPayload().source).toBe('path');
  });

  it('la sesión diaria guarda «daily-session» en cada ejercicio', () => {
    renderWithSession();

    act(() => {
      screen.getByText('sesión 2 habilidades').click();
    });
    act(() => {
      screen.getByText('responder bien').click();
    });
    expect(lastPayload().source).toBe('daily-session');

    // Segundo ejercicio de la sesión (cola agotada, sigue en sesión).
    act(() => {
      screen.getByText('siguiente').click();
    });
    act(() => {
      screen.getByText('responder bien').click();
    });
    expect(lastPayload().source).toBe('daily-session');
  });

  it('al agotar la sesión el siguiente ejercicio vuelve a «free»', () => {
    renderWithSession();

    act(() => {
      screen.getByText('sesión 2 habilidades').click();
    });
    act(() => {
      screen.getByText('responder bien').click();
    });
    // Cola agotada: NEXT_PROBLEM sale del camino y el problema es de modo libre.
    for (let i = 0; i < 2; i++) {
      act(() => {
        screen.getByText('siguiente').click();
      });
    }
    act(() => {
      screen.getByText('responder bien').click();
    });

    expect(lastPayload().source).toBe('free');
  });

  it('elegir un modo a mano vuelve a «free» tras «path»', () => {
    renderWithSession();

    act(() => {
      screen.getByText('empezar habilidad').click();
    });
    act(() => {
      screen.getByText('responder bien').click();
    });
    expect(lastPayload().source).toBe('path');

    act(() => {
      screen.getByText('modo manual').click();
    });
    act(() => {
      screen.getByText('responder bien').click();
    });
    expect(lastPayload().source).toBe('free');
  });
});
