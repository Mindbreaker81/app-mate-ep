import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../AuthContext';
import { GameProvider, useGame } from '../GameContext';
import { MyPath } from '../../components/MyPath';

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

function renderWithProviders(ui: React.ReactElement) {
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

  return render(<AuthContext.Provider value={authValue}>{ui}</AuthContext.Provider>);
}

function Harness() {
  const { state, dispatch, setPracticeMode, setAnswer, checkAnswer } = useGame();
  const skill = state.skillProgress['sumas-restas'];

  return (
    <div>
      <div data-testid="path-skill">{state.pathSkillId ?? 'none'}</div>
      <div data-testid="mode">{state.practiceMode}</div>
      <div data-testid="skill-results">{skill ? skill.recentResults.join(',') : 'none'}</div>
      <div data-testid="skill-streak">{skill ? skill.streakCorrect : 'none'}</div>
      {/* Misma secuencia que MyPath.startSkill: primero la habilidad, luego el modo. */}
      <button
        type="button"
        onClick={() => {
          dispatch({ type: 'SET_PATH_SKILL', payload: 'sumas-restas' });
          dispatch({ type: 'SET_PRACTICE_MODE', payload: 'addition' });
        }}
      >
        empezar habilidad
      </button>
      <button type="button" onClick={() => setPracticeMode('division')}>
        modo manual
      </button>
      <button type="button" onClick={() => { setAnswer('4'); checkAnswer('4'); }}>
        responder bien
      </button>
      <button type="button" onClick={() => { setAnswer('99'); checkAnswer('99'); }}>
        responder mal
      </button>
      <button type="button" onClick={() => { setAnswer('4'); checkAnswer('4'); }}>
        responder bien de nuevo
      </button>
      <div data-testid="problem-op">{state.currentProblem?.operation ?? 'none'}</div>
      <div data-testid="is-correct">{String(state.isCorrect)}</div>
      <div data-testid="session-done">{state.sessionDone}</div>
      <div data-testid="session-left">
        {state.dailySession === null ? 'none' : state.dailySession.length === 0 ? 'done' : state.dailySession.join(',')}
      </div>
      <button
        type="button"
        onClick={() => dispatch({ type: 'START_DAILY_SESSION', payload: ['sumas-restas', 'division-con-resto', 'multiplicacion-division'] })}
      >
        sesión 3 habilidades
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: 'START_DAILY_SESSION', payload: ['sumas-restas', 'sumas-restas', 'sumas-restas'] })}
      >
        sesión repetida
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: 'START_DAILY_SESSION', payload: ['sumas-restas', 'division-con-resto', 'division-con-resto', 'multiplicacion-division'] })}
      >
        sesión con doble
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: 'MERGE_SKILL_PROGRESS',
            payload: {
              'sumas-restas': {
                state: 'practicing', recentResults: [], streakCorrect: 0, streakWrong: 0,
                activeDays: [], reviewDueDate: null, reviewCount: 0, level: 2,
                updatedAt: new Date().toISOString(),
              },
            },
          })
        }
      >
        nivel 2 en sumas
      </button>
      <button type="button" onClick={() => dispatch({ type: 'SET_PATH_SKILL', payload: 'enteros' })}>
        otra habilidad
      </button>
      <button type="button" onClick={() => dispatch({ type: 'SET_PATH_SKILL', payload: 'ecuaciones-dos-pasos' })}>
        habilidad T3
      </button>
      <button type="button" onClick={() => dispatch({ type: 'SET_GRADE', payload: '4t' })}>
        curso 4t
      </button>
      <button type="button" onClick={() => dispatch({ type: 'SET_PRACTICE_MODE', payload: 'addition' })}>
        refrescar modo
      </button>
      <button type="button" onClick={() => dispatch({ type: 'NEXT_PROBLEM' })}>
        siguiente
      </button>
    </div>
  );
}

describe('GameContext — camino de aprendizaje', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('la habilidad del camino sobrevive al cambio de modo que lanza MyPath', () => {
    renderWithProviders(
      <GameProvider>
        <Harness />
      </GameProvider>,
    );

    act(() => {
      screen.getByText('empezar habilidad').click();
    });

    expect(screen.getByTestId('path-skill').textContent).toBe('sumas-restas');
    expect(screen.getByTestId('mode').textContent).toBe('addition');
  });

  it('elegir un modo a mano sale del camino (limpia la habilidad activa)', () => {
    renderWithProviders(
      <GameProvider>
        <Harness />
      </GameProvider>,
    );

    act(() => {
      screen.getByText('empezar habilidad').click();
    });
    expect(screen.getByTestId('path-skill').textContent).toBe('sumas-restas');

    act(() => {
      screen.getByText('modo manual').click();
    });

    expect(screen.getByTestId('path-skill').textContent).toBe('none');
    expect(screen.getByTestId('mode').textContent).toBe('division');
  });

  it('el intento se atribuye a la habilidad de la operación y el reintento no es primer intento', () => {
    renderWithProviders(
      <GameProvider>
        <Harness />
      </GameProvider>,
    );

    act(() => {
      screen.getByText('responder mal').click();
    });
    expect(screen.getByTestId('skill-results').textContent).toBe('false');

    // El segundo intento acierta pero no cuenta como acierto al primer intento.
    act(() => {
      screen.getByText('responder bien de nuevo').click();
    });
    expect(screen.getByTestId('skill-results').textContent).toBe('false,true');
    expect(screen.getByTestId('skill-streak').textContent).toBe('0');
  });

  it('la sesión diaria rota de habilidad en cada ejercicio y no vuelve atrás al terminar', () => {
    renderWithProviders(
      <GameProvider>
        <Harness />
      </GameProvider>,
    );

    act(() => {
      screen.getByText('sesión 3 habilidades').click();
    });
    expect(screen.getByTestId('path-skill').textContent).toBe('sumas-restas');
    expect(screen.getByTestId('session-left').textContent).toBe('division-con-resto,multiplicacion-division');

    act(() => {
      screen.getByText('siguiente').click();
    });
    expect(screen.getByTestId('path-skill').textContent).toBe('division-con-resto');

    act(() => {
      screen.getByText('siguiente').click();
    });
    expect(screen.getByTestId('path-skill').textContent).toBe('multiplicacion-division');
    expect(screen.getByTestId('session-left').textContent).toBe('done');

    // Cola agotada: la sesión se cierra de forma observable — sale del camino
    // y el ejercicio vuelve al modo libre (mock: operación 'addition').
    act(() => {
      screen.getByText('siguiente').click();
    });
    expect(screen.getByTestId('path-skill').textContent).toBe('none');
    expect(screen.getByTestId('session-left').textContent).toBe('none');
    expect(screen.getByTestId('problem-op').textContent).toBe('addition');
  });

  it('las repeticiones de habilidad en la cola no se pierden ([A,B,B,C] y [A,A,A])', () => {
    renderWithProviders(
      <GameProvider>
        <Harness />
      </GameProvider>,
    );

    act(() => {
      screen.getByText('sesión con doble').click();
    });
    const sequence = ['sumas-restas'];
    for (let i = 0; i < 3; i++) {
      act(() => {
        screen.getByText('siguiente').click();
      });
      sequence.push(screen.getByTestId('path-skill').textContent ?? '');
    }
    expect(sequence).toEqual(['sumas-restas', 'division-con-resto', 'division-con-resto', 'multiplicacion-division']);

    act(() => {
      screen.getByText('sesión repetida').click();
    });
    const repeated = ['sumas-restas'];
    for (let i = 0; i < 2; i++) {
      act(() => {
        screen.getByText('siguiente').click();
      });
      repeated.push(screen.getByTestId('path-skill').textContent ?? '');
    }
    expect(repeated).toEqual(['sumas-restas', 'sumas-restas', 'sumas-restas']);
  });

  it('elegir otra habilidad a mano cancela la sesión en curso', () => {
    renderWithProviders(
      <GameProvider>
        <Harness />
      </GameProvider>,
    );

    act(() => {
      screen.getByText('sesión 3 habilidades').click();
      screen.getByText('otra habilidad').click();
    });

    expect(screen.getByTestId('path-skill').textContent).toBe('enteros');
    expect(screen.getByTestId('session-left').textContent).toBe('none');
  });

  it('la dificultad en el camino usa el nivel de la habilidad (2 → nivel de problema 6)', async () => {
    const { generateOperation } = await import('../../utils/problemGenerator');
    renderWithProviders(
      <GameProvider>
        <Harness />
      </GameProvider>,
    );

    for (const label of ['nivel 2 en sumas', 'sesión 3 habilidades', 'refrescar modo']) {
      act(() => {
        screen.getByText(label).click();
      });
    }

    expect(generateOperation).toHaveBeenLastCalledWith(expect.any(String), 6, expect.anything());
  });

  it('sessionDone solo cuenta intentos dentro de la sesión', () => {
    renderWithProviders(
      <GameProvider>
        <Harness />
      </GameProvider>,
    );

    // Modo libre: no cuenta.
    act(() => {
      screen.getByText('responder bien').click();
    });
    expect(screen.getByTestId('session-done').textContent).toBe('0');

    for (const label of ['sesión 3 habilidades', 'refrescar modo', 'responder mal']) {
      act(() => {
        screen.getByText(label).click();
      });
    }
    expect(screen.getByTestId('session-done').textContent).toBe('1');

    // El reintento de la misma pregunta no vuelve a sumar.
    act(() => {
      screen.getByText('responder bien de nuevo').click();
    });
    expect(screen.getByTestId('session-done').textContent).toBe('1');
  });

  it('«Continuar» vuelve al ejercicio sin regenerarlo, antes y después de responder', async () => {
    const { generateOperation } = await import('../../utils/problemGenerator');
    const onStartSkill = vi.fn();
    renderWithProviders(
      <GameProvider>
        <MyPath onStartSkill={onStartSkill} onStartExam={vi.fn()} />
        <Harness />
      </GameProvider>,
    );

    act(() => {
      screen.getByText('sesión 3 habilidades').click();
      screen.getByText('refrescar modo').click();
    });
    const callsAfterStart = vi.mocked(generateOperation).mock.calls.length;

    // Pausa antes de responder: «Sesión de hoy» (0 hechos) reanuda sin regenerar.
    act(() => {
      screen.getByRole('button', { name: /Sesión de hoy/ }).click();
    });
    expect(onStartSkill).toHaveBeenCalledTimes(1);
    expect(vi.mocked(generateOperation).mock.calls.length).toBe(callsAfterStart);

    // Tras un fallo + revelado: «Continuar» vuelve al mismo ejercicio resuelto.
    act(() => {
      screen.getByText('responder mal').click();
    });
    act(() => {
      screen.getByText('responder mal').click(); // segundo fallo → revelado
    });
    expect(screen.getByTestId('is-correct').textContent).toBe('false');
    expect(screen.getByText('Continuar')).toBeTruthy();

    act(() => {
      screen.getByRole('button', { name: 'Continuar' }).click();
    });
    expect(onStartSkill).toHaveBeenCalledTimes(2);
    expect(vi.mocked(generateOperation).mock.calls.length).toBe(callsAfterStart);
    expect(screen.getByTestId('is-correct').textContent).toBe('false');
    expect(screen.getByTestId('session-done').textContent).toBe('1');
  });

  it('al cambiar de día con la app abierta (intervalo) cierra la sesión y sale a modo libre limpio', () => {
    vi.useFakeTimers();
    renderWithProviders(
      <GameProvider>
        <Harness />
      </GameProvider>,
    );

    for (const label of ['sesión 3 habilidades', 'refrescar modo', 'responder mal']) {
      act(() => {
        screen.getByText(label).click();
      });
    }
    expect(screen.getByTestId('session-done').textContent).toBe('1');
    expect(screen.getByTestId('is-correct').textContent).toBe('false');

    vi.setSystemTime(Date.now() + 24 * 60 * 60 * 1000);
    act(() => {
      vi.advanceTimersByTime(61_000);
    });

    // Sesión cerrada por completo: ni cola/contador ni habilidad ni el
    // ejercicio de ayer — queda uno nuevo de modo libre (mock: 'addition').
    expect(screen.getByTestId('session-done').textContent).toBe('0');
    expect(screen.getByTestId('session-left').textContent).toBe('none');
    expect(screen.getByTestId('path-skill').textContent).toBe('none');
    expect(screen.getByTestId('is-correct').textContent).toBe('null');
    expect(screen.getByTestId('problem-op').textContent).toBe('addition');
    vi.useRealTimers();
  });

  it('al volver a primer plano otro día (visibilitychange) también cierra la sesión', () => {
    vi.useFakeTimers();
    renderWithProviders(
      <GameProvider>
        <Harness />
      </GameProvider>,
    );

    for (const label of ['sesión 3 habilidades', 'refrescar modo', 'responder mal']) {
      act(() => {
        screen.getByText(label).click();
      });
    }
    expect(screen.getByTestId('session-done').textContent).toBe('1');

    vi.setSystemTime(Date.now() + 24 * 60 * 60 * 1000);
    act(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(screen.getByTestId('session-done').textContent).toBe('0');
    expect(screen.getByTestId('session-left').textContent).toBe('none');
    expect(screen.getByTestId('path-skill').textContent).toBe('none');
    expect(screen.getByTestId('problem-op').textContent).toBe('addition');
    vi.useRealTimers();
  });

  it('cancelar la sesión (otra habilidad o modo libre) reinicia también el contador', () => {
    renderWithProviders(
      <GameProvider>
        <Harness />
      </GameProvider>,
    );

    for (const label of ['sesión 3 habilidades', 'refrescar modo', 'responder mal']) {
      act(() => {
        screen.getByText(label).click();
      });
    }
    expect(screen.getByTestId('session-done').textContent).toBe('1');

    act(() => {
      screen.getByText('otra habilidad').click();
    });
    expect(screen.getByTestId('session-done').textContent).toBe('0');
    expect(screen.getByTestId('session-left').textContent).toBe('none');

    for (const label of ['sesión 3 habilidades', 'refrescar modo', 'responder mal']) {
      act(() => {
        screen.getByText(label).click();
      });
    }
    act(() => {
      screen.getByText('modo manual').click();
    });
    expect(screen.getByTestId('session-done').textContent).toBe('0');
    expect(screen.getByTestId('session-left').textContent).toBe('none');
  });

  it('cambiar de curso en modo libre genera el problema con el curso nuevo', async () => {
    const { generateProblem } = await import('../../utils/problemGenerator');
    renderWithProviders(
      <GameProvider>
        <Harness />
      </GameProvider>,
    );

    act(() => {
      screen.getByText('curso 4t').click();
    });

    expect(generateProblem).toHaveBeenCalledWith(expect.any(Number), expect.any(String), '4t');
  });

  it('con habilidad activa el problema pertenece a sus operaciones (no a todo el modo)', () => {
    renderWithProviders(
      <GameProvider>
        <Harness />
      </GameProvider>,
    );

    act(() => {
      screen.getByText('sesión 3 habilidades').click();
      screen.getByText('siguiente').click();
    });

    // 'division-con-resto' solo tiene 'division-remainder': el modo 'division'
    // también incluiría 'division' (de otra habilidad) si se generara por modo.
    expect(screen.getByTestId('problem-op').textContent).toBe('division-remainder');
  });

  it('una T3 se genera aunque el curso libre no tenga su modo (4.º)', () => {
    renderWithProviders(
      <GameProvider>
        <Harness />
      </GameProvider>,
    );

    act(() => {
      screen.getByText('curso 4t').click();
      screen.getByText('habilidad T3').click();
      screen.getByText('siguiente').click();
    });

    expect(screen.getByTestId('problem-op').textContent).toBe('two-step-equation');
  });

  it('salir del camino limpia habilidad y sesión', () => {
    renderWithProviders(
      <GameProvider>
        <Harness />
      </GameProvider>,
    );

    act(() => {
      screen.getByText('sesión 3 habilidades').click();
      screen.getByText('modo manual').click();
    });

    expect(screen.getByTestId('path-skill').textContent).toBe('none');
    expect(screen.getByTestId('session-left').textContent).toBe('none');
  });
});
