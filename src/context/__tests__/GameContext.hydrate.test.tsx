import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';
import { AuthContext, type AuthContextValue } from '../AuthContext';
import { GameProvider, useGame } from '../GameContext';
import type { PersistedGameState } from '../../types';

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
  getDifficulty: vi.fn(() => 'easy'),
}));

vi.mock('../../services/attemptService', () => ({
  recordAttemptDirect: vi.fn(),
  flushQueue: vi.fn().mockResolvedValue(undefined),
  migrateLegacyData: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../services/statsService', () => ({
  fetchUserStats: vi.fn().mockResolvedValue(null),
}));

const gameStateServiceState = vi.hoisted(() => ({
  loadGameState: vi.fn(),
  saveGameState: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../services/gameStateService', () => ({
  loadGameState: gameStateServiceState.loadGameState,
  saveGameState: gameStateServiceState.saveGameState,
}));

const remoteState: PersistedGameState = {
  maxScore: 99,
  bestStreak: 9,
  totalExercises: 120,
  correctExercises: 100,
  timedCorrectExercises: 11,
  achievements: [
    {
      id: 'streak_5',
      name: 'Racha de 5',
      description: '5 seguidas',
      icon: '🔥',
      unlocked: true,
    },
  ],
};

function renderWithSession() {
  const session = { user: { id: 'uuid-1' } } as Session;
  const authValue: AuthContextValue = {
    session,
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
  const { state, checkAnswer } = useGame();
  return (
    <div>
      <div data-testid="max-score">{state.maxScore}</div>
      <div data-testid="best-streak">{state.bestStreak}</div>
      <div data-testid="total">{state.totalExercises}</div>
      <div data-testid="achievements">{state.achievements.map((a) => a.id).join(',')}</div>
      <button type="button" onClick={() => checkAnswer('4')}>
        responder bien
      </button>
    </div>
  );
}

describe('GameContext hidratación desde Supabase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('hidrata récords y logros desde el estado remoto tras el login', async () => {
    gameStateServiceState.loadGameState.mockResolvedValue(remoteState);

    renderWithSession();

    await waitFor(() => {
      expect(screen.getByTestId('max-score')).toHaveTextContent('99');
    });
    expect(screen.getByTestId('best-streak')).toHaveTextContent('9');
    expect(screen.getByTestId('total')).toHaveTextContent('120');
    expect(screen.getByTestId('achievements')).toHaveTextContent('streak_5');
  });

  it('siembra el estado remoto con el local cuando no existe fila', async () => {
    gameStateServiceState.loadGameState.mockResolvedValue(null);
    window.localStorage.setItem('maxScore', '7');

    renderWithSession();

    await waitFor(() => {
      expect(gameStateServiceState.saveGameState).toHaveBeenCalledWith(
        'uuid-1',
        expect.objectContaining({ maxScore: 7 }),
      );
    });
  });

  it('guarda el estado en Supabase (debounced) tras responder', async () => {
    gameStateServiceState.loadGameState.mockResolvedValue(remoteState);

    renderWithSession();

    await waitFor(() => {
      expect(screen.getByTestId('total')).toHaveTextContent('120');
    });
    gameStateServiceState.saveGameState.mockClear();

    fireEvent.click(screen.getByRole('button', { name: /responder bien/i }));
    expect(screen.getByTestId('total')).toHaveTextContent('121');

    await waitFor(
      () => {
        expect(gameStateServiceState.saveGameState).toHaveBeenCalledWith(
          'uuid-1',
          expect.objectContaining({ totalExercises: 121 }),
        );
      },
      { timeout: 4000 },
    );
  });

  it('en la fusión gana el máximo entre local y remoto', async () => {
    window.localStorage.setItem('maxScore', '150');
    gameStateServiceState.loadGameState.mockResolvedValue(remoteState);

    renderWithSession();

    await waitFor(() => {
      expect(screen.getByTestId('best-streak')).toHaveTextContent('9');
    });
    expect(screen.getByTestId('max-score')).toHaveTextContent('150');
  });
});
