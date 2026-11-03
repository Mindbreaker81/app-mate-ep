import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../AuthContext';
import { GameProvider, useGame } from '../GameContext';
import { recordSkillAttempt } from '../../utils/skillProgress';
import { SKILLS } from '../../utils/skillCatalog';
import type { SkillProgress } from '../../types';

const DAY_MS = 24 * 60 * 60 * 1000;

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

/**
 * `total` aciertos al primer intento repartidos ayer/hoy (5 en el primer día y
 * el resto hoy), construidos con el motor real para conservar sus invariantes.
 */
function progressAcrossTwoDays(total: number): SkillProgress {
  let progress: SkillProgress | undefined;
  const today = new Date();
  for (let i = 0; i < total; i += 1) {
    const date = new Date(today.getTime() + (i < 5 ? -1 : 0) * DAY_MS);
    progress = recordSkillAttempt(progress, { isCorrect: true, isFirstTry: true, date });
  }
  return progress!;
}

function renderWithoutSession() {
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
    requestPasswordReset: vi.fn(),
    passwordRecovery: false,
    finishPasswordRecovery: vi.fn(),
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
  const { state, dispatch, checkAnswer } = useGame();
  return (
    <div>
      <div data-testid="achievements">{state.achievements.map((a) => a.id).join(',')}</div>
      <div data-testid="recent">{state.recentAchievement?.id ?? 'none'}</div>
      <div data-testid="correct">{state.correctExercises}</div>
      <button type="button" onClick={() => checkAnswer('4')}>
        responder bien
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: 'INIT_SKILL_PROGRESS',
            payload: { 'sumas-restas': progressAcrossTwoDays(9) },
          })
        }
      >
        sembrar casi dominada
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: 'HYDRATE_PERSISTED',
            payload: {
              maxScore: 0,
              bestStreak: 0,
              totalExercises: 0,
              correctExercises: 0,
              timedCorrectExercises: 0,
              achievements: [],
              skills: { 'sumas-restas': progressAcrossTwoDays(10) },
            },
          })
        }
      >
        hidratar dominada
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: 'INIT_SKILL_PROGRESS',
            payload: Object.fromEntries(
              SKILLS.map((skill) => [skill.id, progressAcrossTwoDays(10)]),
            ),
          })
        }
      >
        sembrar todo dominado
      </button>
    </div>
  );
}

describe('GameContext — insignias por dominio (PIT-20)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('concede la insignia al registrar el intento que alcanza el dominio', async () => {
    // first_correct ya desbloqueado para que el toast quede libre para la insignia.
    window.localStorage.setItem(
      'achievements',
      JSON.stringify([
        { id: 'first_correct', name: 'x', description: '', icon: '🎯', unlocked: true },
      ]),
    );
    renderWithoutSession();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /responder bien/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /sembrar casi dominada/i }));
    fireEvent.click(screen.getByRole('button', { name: /responder bien/i }));

    expect(screen.getByTestId('achievements')).toHaveTextContent('mastery:sumas-restas');
    expect(screen.getByTestId('recent')).toHaveTextContent('mastery:sumas-restas');
  });

  it('no concede insignias por debajo del dominio', async () => {
    renderWithoutSession();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /responder bien/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /responder bien/i }));

    expect(screen.getByTestId('achievements')).not.toHaveTextContent('mastery:');
  });

  it('al hidratar se conceden en silencio (sin notificación duplicada)', async () => {
    renderWithoutSession();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /hidratar dominada/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /hidratar dominada/i }));

    expect(screen.getByTestId('achievements')).toHaveTextContent('mastery:sumas-restas');
    expect(screen.getByTestId('recent')).toHaveTextContent('none');
  });

  it('la fusión es por ID: hidratar dos veces no duplica la insignia', async () => {
    renderWithoutSession();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /hidratar dominada/i })).toBeInTheDocument();
    });
    const hydrateButton = screen.getByRole('button', { name: /hidratar dominada/i });
    fireEvent.click(hydrateButton);
    fireEvent.click(hydrateButton);

    const listed = screen.getByTestId('achievements').textContent ?? '';
    expect(listed.split('mastery:sumas-restas').length - 1).toBe(1);
  });

  it('con todo el catálogo dominado concede insignias de habilidad y de área', async () => {
    renderWithoutSession();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sembrar todo dominado/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /sembrar todo dominado/i }));

    const listed = screen.getByTestId('achievements').textContent ?? '';
    expect(listed).toContain('mastery:sumas-restas');
    expect(listed).toContain('mastery-area:calculo');
    expect(listed).toContain('mastery-area:datos');
    expect(listed).toContain('mastery-area:ampliacion');
  });
});
