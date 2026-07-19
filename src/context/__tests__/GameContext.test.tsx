import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
  const { state, setAnswer, setTimeMode } = useGame();

  return (
    <div>
      <div data-testid="problem-ready">{state.currentProblem?.operation ?? 'none'}</div>
      <div data-testid="timer">{state.timeRemaining}</div>
      <div data-testid="is-correct">{String(state.isCorrect)}</div>
      <div data-testid="active">{String(state.isTimerActive)}</div>
      <button type="button" onClick={() => setTimeMode('30s')}>
        activar 30s
      </button>
      <button type="button" onClick={() => setAnswer('4')}>
        escribir respuesta
      </button>
    </div>
  );
}

describe('GameContext timer flow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('checks the latest answer when the timer reaches zero', async () => {
    renderWithProviders(
      <GameProvider>
        <Harness />
      </GameProvider>,
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId('problem-ready')).toHaveTextContent('addition');

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /activar 30s/i }));
      fireEvent.click(screen.getByRole('button', { name: /escribir respuesta/i }));
    });

    expect(screen.getByTestId('timer')).toHaveTextContent('30');

    for (let index = 0; index < 30; index += 1) {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    }

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId('is-correct')).toHaveTextContent('true');
    expect(screen.getByTestId('active')).toHaveTextContent('false');
  });
});
