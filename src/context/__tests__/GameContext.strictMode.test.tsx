import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';
import { StrictMode } from 'react';
import { AuthContext, type AuthContextValue } from '../AuthContext';
import { GameProvider, useGame } from '../GameContext';
import { serializeDailySession } from '../../utils/dailySessionStorage';
import { todayKey } from '../../utils/skillProgress';

const problemMocks = vi.hoisted(() => ({
  // Problema de modo libre (generateProblem) y de habilidad (generateOperation)
  // distinguibles para detectar cuándo se pisa el ejercicio restaurado.
  freeProblem: null as unknown,
  skillProblem: null as unknown,
}));

vi.mock('../../utils/problemGenerator', () => ({
  generateProblem: vi.fn(() => problemMocks.freeProblem),
  generateOperation: vi.fn(() => problemMocks.skillProblem),
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

function Probe() {
  const { state } = useGame();
  return <div data-testid="exercise">{state.currentProblem?.explanation ?? 'none'}</div>;
}

const session = { user: { id: 'user-strict' } } as unknown as Session;

const authValue: AuthContextValue = {
  session,
  profile: { id: 'user-strict', username: 'tester', avatar: '🙂', created_at: '' },
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

describe('GameContext en StrictMode (desarrollo)', () => {
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
    problemMocks.skillProblem = {
      num1: 5,
      num2: 5,
      operation: 'addition',
      answer: 10,
      explanation: 'problema-habilidad',
    };
  });

  it('regresión (PIT-28): el ejercicio restaurado de la sesión diaria no se pisa al montar dos veces', async () => {
    // Sesión en curso guardada: habilidad en curso + cola pendiente.
    window.localStorage.setItem(
      'pitagoritas.dailySession.user-strict',
      serializeDailySession({ date: todayKey(), skillId: 'sumas-restas', queue: ['sumas-restas'], done: 3 }),
    );

    render(
      <StrictMode>
        <AuthContext.Provider value={authValue}>
          <GameProvider>
            <Probe />
          </GameProvider>
        </AuthContext.Provider>
      </StrictMode>,
    );

    // El problema actual debe ser el de la habilidad restaurada, y quedarse siéndolo.
    await waitFor(() => expect(screen.getByTestId('exercise')).toHaveTextContent('problema-habilidad'));
    // Deja pasar varios ciclos de efectos (como el doble montaje de StrictMode).
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.getByTestId('exercise')).toHaveTextContent('problema-habilidad');
  });
});
