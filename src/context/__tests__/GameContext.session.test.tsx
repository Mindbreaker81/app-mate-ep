import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';
import { AuthContext, type AuthContextValue } from '../AuthContext';
import { GameProvider, useGame } from '../GameContext';
import { dailySessionStorageKey } from '../../utils/dailySessionStorage';
import { todayKey } from '../../utils/skillProgress';

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

const USER_A = 'uuid-nino-a';
const USER_B = 'uuid-nino-b';

function authFor(userId: string): AuthContextValue {
  return {
    session: { user: { id: userId } } as Session,
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
}

function renderWithUser(userId: string) {
  return render(
    <AuthContext.Provider value={authFor(userId)}>
      <GameProvider>
        <Harness />
      </GameProvider>
    </AuthContext.Provider>,
  );
}

function Harness() {
  const { state, dispatch, setPracticeMode, setAnswer, checkAnswer } = useGame();
  return (
    <div>
      <div data-testid="path-skill">{state.pathSkillId ?? 'none'}</div>
      <div data-testid="session-done">{state.sessionDone}</div>
      <div data-testid="session-date">{state.sessionDate ?? 'none'}</div>
      <div data-testid="session-left">
        {state.dailySession === null ? 'none' : state.dailySession.length === 0 ? 'empty' : state.dailySession.join(',')}
      </div>
      <div data-testid="problem-op">{state.currentProblem?.operation ?? 'none'}</div>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: 'START_DAILY_SESSION',
            payload: ['division-con-resto', 'sumas-restas', 'multiplicacion-division'],
          })
        }
      >
        sesión 3 habilidades
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: 'START_DAILY_SESSION', payload: ['division-con-resto'] })}
      >
        sesión 1 habilidad
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
      <button type="button" onClick={() => dispatch({ type: 'CANCEL_DAILY_SESSION' })}>
        cancelar sesión
      </button>
      <button type="button" onClick={() => setPracticeMode('division')}>
        modo manual
      </button>
    </div>
  );
}

function storedSession(userId: string) {
  const raw = window.localStorage.getItem(dailySessionStorageKey(userId));
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
}

describe('GameContext — sesión diaria persistente (PIT-28)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('guarda la sesión en localStorage por usuario al iniciarla y al responder', () => {
    renderWithUser(USER_A);

    act(() => {
      screen.getByText('sesión 3 habilidades').click();
    });

    expect(storedSession(USER_A)).toMatchObject({
      date: todayKey(),
      skillId: 'division-con-resto',
      queue: ['sumas-restas', 'multiplicacion-division'],
      done: 0,
    });
    expect(storedSession(USER_B)).toBeNull();

    act(() => {
      screen.getByText('responder bien').click();
    });

    expect(storedSession(USER_A)).toMatchObject({ done: 1 });
  });

  it('tras recargar (remontar) se restauran cola, habilidad, contador y fecha', () => {
    const first = renderWithUser(USER_A);

    for (const label of ['sesión 3 habilidades', 'responder bien', 'siguiente']) {
      act(() => {
        screen.getByText(label).click();
      });
    }
    expect(screen.getByTestId('session-done').textContent).toBe('1');
    expect(screen.getByTestId('path-skill').textContent).toBe('sumas-restas');

    first.unmount();
    renderWithUser(USER_A);

    expect(screen.getByTestId('path-skill').textContent).toBe('sumas-restas');
    expect(screen.getByTestId('session-left').textContent).toBe('multiplicacion-division');
    expect(screen.getByTestId('session-done').textContent).toBe('1');
    expect(screen.getByTestId('session-date').textContent).toBe(todayKey());
  });

  it('tras recargar, el ejercicio regenerado es de la habilidad en curso', () => {
    const first = renderWithUser(USER_A);

    act(() => {
      screen.getByText('sesión 3 habilidades').click();
    });
    first.unmount();
    renderWithUser(USER_A);

    // 'division-con-resto' solo tiene la operación 'division-remainder': el
    // ejercicio al reanudar es de la habilidad, no uno de modo libre.
    expect(screen.getByTestId('problem-op').textContent).toBe('division-remainder');
  });

  it('al cambiar de usuario no se ve la sesión de otro niño ni se escribe en su clave', () => {
    const view = renderWithUser(USER_A);

    for (const label of ['sesión 3 habilidades', 'responder bien']) {
      act(() => {
        screen.getByText(label).click();
      });
    }
    expect(storedSession(USER_A)).toMatchObject({ done: 1 });

    // Cambio de usuario sin desmontar el proveedor (misma pestaña).
    act(() => {
      view.rerender(
        <AuthContext.Provider value={authFor(USER_B)}>
          <GameProvider>
            <Harness />
          </GameProvider>
        </AuthContext.Provider>,
      );
    });

    expect(screen.getByTestId('session-done').textContent).toBe('0');
    expect(screen.getByTestId('session-left').textContent).toBe('none');
    expect(screen.getByTestId('path-skill').textContent).toBe('none');
    // La sesión de A no se copia a la clave de B, y la de A sigue intacta.
    expect(storedSession(USER_B)).toBeNull();
    expect(storedSession(USER_A)).toMatchObject({ done: 1 });
  });

  it('al entrar otro usuario con sesión propia se restaura la suya', () => {
    window.localStorage.setItem(
      dailySessionStorageKey(USER_B),
      JSON.stringify({
        version: 1,
        date: todayKey(),
        skillId: 'division-con-resto',
        queue: ['sumas-restas'],
        done: 4,
      }),
    );

    renderWithUser(USER_B);

    expect(screen.getByTestId('path-skill').textContent).toBe('division-con-resto');
    expect(screen.getByTestId('session-left').textContent).toBe('sumas-restas');
    expect(screen.getByTestId('session-done').textContent).toBe('4');
  });

  it('una sesión guardada de otro día no se restaura y se descarta', () => {
    window.localStorage.setItem(
      dailySessionStorageKey(USER_A),
      JSON.stringify({
        version: 1,
        date: '2000-01-01',
        skillId: 'division-con-resto',
        queue: ['sumas-restas'],
        done: 4,
      }),
    );

    renderWithUser(USER_A);

    expect(screen.getByTestId('session-done').textContent).toBe('0');
    expect(screen.getByTestId('session-left').textContent).toBe('none');
    expect(screen.getByTestId('path-skill').textContent).toBe('none');
    expect(storedSession(USER_A)).toBeNull();
  });

  it('datos corruptos en la clave de sesión no rompen la carga', () => {
    window.localStorage.setItem(dailySessionStorageKey(USER_A), '{json roto');

    renderWithUser(USER_A);

    expect(screen.getByTestId('session-done').textContent).toBe('0');
    expect(screen.getByTestId('session-left').textContent).toBe('none');
    expect(storedSession(USER_A)).toBeNull();
  });

  it('una sesión con habilidades que ya no existen se descarta', () => {
    window.localStorage.setItem(
      dailySessionStorageKey(USER_A),
      JSON.stringify({
        version: 1,
        date: todayKey(),
        skillId: 'skill-que-ya-no-existe',
        queue: ['sumas-restas'],
        done: 2,
      }),
    );

    renderWithUser(USER_A);

    expect(screen.getByTestId('session-done').textContent).toBe('0');
    expect(screen.getByTestId('session-left').textContent).toBe('none');
    expect(storedSession(USER_A)).toBeNull();
  });

  it('cancelar la sesión borra lo guardado', () => {
    renderWithUser(USER_A);

    act(() => {
      screen.getByText('sesión 3 habilidades').click();
    });
    expect(storedSession(USER_A)).not.toBeNull();

    act(() => {
      screen.getByText('cancelar sesión').click();
    });
    expect(storedSession(USER_A)).toBeNull();
  });

  it('elegir un modo a mano (salir de la sesión) borra lo guardado', () => {
    renderWithUser(USER_A);

    act(() => {
      screen.getByText('sesión 3 habilidades').click();
    });
    act(() => {
      screen.getByText('modo manual').click();
    });

    expect(storedSession(USER_A)).toBeNull();
    expect(screen.getByTestId('session-left').textContent).toBe('none');
  });

  it('agotar la cola (terminar la sesión) borra lo guardado', () => {
    renderWithUser(USER_A);

    act(() => {
      screen.getByText('sesión 1 habilidad').click();
    });
    // Cola vacía pero sesión viva: sigue guardada para poder reanudar.
    expect(storedSession(USER_A)).toMatchObject({ skillId: 'division-con-resto', queue: [] });

    act(() => {
      screen.getByText('siguiente').click();
    });
    expect(screen.getByTestId('session-left').textContent).toBe('none');
    expect(storedSession(USER_A)).toBeNull();
  });

  it('los datos antiguos de game_state (sin campos de sesión) cargan sin errores', () => {
    // Caché por usuario anterior al cambio: no lleva nada de la sesión diaria.
    window.localStorage.setItem(
      'pitagoritas:gameState:' + USER_A,
      JSON.stringify({
        maxScore: 42,
        bestStreak: 5,
        totalExercises: 60,
        correctExercises: 50,
        timedCorrectExercises: 3,
        achievements: [],
      }),
    );

    renderWithUser(USER_A);

    expect(screen.getByTestId('session-done').textContent).toBe('0');
    expect(screen.getByTestId('session-left').textContent).toBe('none');
    expect(screen.getByTestId('path-skill').textContent).toBe('none');
  });
});
