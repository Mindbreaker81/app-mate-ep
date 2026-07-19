import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

vi.mock('../../services/gameStateService', () => ({
  loadGameState: vi.fn().mockResolvedValue(null),
  saveGameState: vi.fn().mockResolvedValue(true),
}));

function Probe() {
  const { state, checkAnswer, nextProblem } = useGame();
  return (
    <div>
      <div data-testid="recent">{state.recentAchievement?.id ?? 'none'}</div>
      <button type="button" onClick={() => checkAnswer('4')}>
        responder bien
      </button>
      <button type="button" onClick={nextProblem}>
        siguiente
      </button>
    </div>
  );
}

function renderProvider() {
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

describe('GameContext — logro recién desbloqueado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('expone el logro desbloqueado y lo limpia al pasar de problema', () => {
    renderProvider();

    expect(screen.getByTestId('recent')).toHaveTextContent('none');

    fireEvent.click(screen.getByRole('button', { name: /responder bien/i }));
    expect(screen.getByTestId('recent')).toHaveTextContent('first_correct');

    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    expect(screen.getByTestId('recent')).toHaveTextContent('none');
  });
});
