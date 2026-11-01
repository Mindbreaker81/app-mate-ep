import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';
import { AuthContext, type AuthContextValue } from '../../context/AuthContext';
import { GameProvider } from '../../context/GameContext';
import { MyPath } from '../MyPath';
import { serializeDailySession } from '../../utils/dailySessionStorage';
import { todayKey } from '../../utils/skillProgress';

const problemMocks = vi.hoisted(() => ({
  freeProblem: null as unknown,
}));

vi.mock('../../utils/problemGenerator', () => ({
  generateProblem: vi.fn(() => problemMocks.freeProblem),
  generateOperation: vi.fn(() => problemMocks.freeProblem),
  getDifficulty: vi.fn(() => 'easy'),
}));

vi.mock('../../services/attemptService', () => ({
  recordAttemptDirect: vi.fn(),
  flushQueue: vi.fn().mockResolvedValue(undefined),
  migrateLegacyData: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../services/statsService', () => ({
  fetchUserStats: vi.fn().mockResolvedValue(null),
  fetchOwnAttempts: vi.fn().mockResolvedValue(null),
}));

vi.mock('../../services/gameStateService', () => ({
  loadGameState: vi.fn().mockResolvedValue(null),
  saveGameState: vi.fn().mockResolvedValue(true),
}));

const session = { user: { id: 'user-session' } } as unknown as Session;

const authValue: AuthContextValue = {
  session,
  profile: { id: 'user-session', username: 'tester', avatar: '🙂', created_at: '' },
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

describe('MyPath — sesión de hoy completada y recarga', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    problemMocks.freeProblem = {
      num1: 1,
      num2: 1,
      operation: 'addition',
      answer: 2,
      explanation: 'problema-libre',
    };
  });

  it('regresión: tras recargar, la sesión completada hoy se sigue mostrando como completada (10/10)', async () => {
    window.localStorage.setItem(
      'pitagoritas.dailySession.user-session',
      serializeDailySession({ date: todayKey(), skillId: null, queue: [], done: 10 }),
    );

    render(
      <AuthContext.Provider value={authValue}>
        <GameProvider>
          <MyPath onStartSkill={vi.fn()} />
        </GameProvider>
      </AuthContext.Provider>,
    );

    await waitFor(() => expect(screen.getByText('10/10')).toBeInTheDocument());
    expect(screen.getByText(/¡Sesión completada!/)).toBeInTheDocument();

    // El botón de sesión queda deshabilitado: no se empieza otra sin pedirlo.
    const button = screen.getByRole('button', { name: /Completada/i });
    expect(button).toBeDisabled();
  });

  it('una sesión parcialmente completada se muestra como reanudable tras recargar', async () => {
    window.localStorage.setItem(
      'pitagoritas.dailySession.user-session',
      serializeDailySession({ date: todayKey(), skillId: 'sumas-restas', queue: ['sumas-restas'], done: 4 }),
    );

    render(
      <AuthContext.Provider value={authValue}>
        <GameProvider>
          <MyPath onStartSkill={vi.fn()} />
        </GameProvider>
      </AuthContext.Provider>,
    );

    await waitFor(() => expect(screen.getByText('4/10')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled();
  });
});
