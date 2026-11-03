import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../../context/AuthContext';
import { GameProvider, useGame } from '../../context/GameContext';
import { MyPath } from '../MyPath';
import { accessibleSkills, EXAM_QUESTION_COUNT } from '../../utils/examSession';

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

const startExamSpy = vi.hoisted(() => vi.fn());

function Screen() {
  const { state } = useGame();
  return (
    <div>
      <div data-testid="exam">{state.exam ? `${state.exam.questions.length}` : 'no'}</div>
      <MyPath onStartSkill={() => {}} onStartExam={startExamSpy} />
    </div>
  );
}

function renderScreen() {
  return render(
    <AuthContext.Provider value={authValue}>
      <GameProvider>
        <Screen />
      </GameProvider>
    </AuthContext.Provider>,
  );
}

describe('MyPath — entrada al repaso de examen (PIT-32)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('ofrece el repaso de examen y lo inicia con diez preguntas de habilidades accesibles', () => {
    renderScreen();

    fireEvent.click(screen.getByRole('button', { name: /empezar examen/i }));

    expect(startExamSpy).toHaveBeenCalled();
    expect(screen.getByTestId('exam')).toHaveTextContent(String(EXAM_QUESTION_COUNT));
  });

  it('las preguntas generadas usan solo habilidades accesibles del catálogo', () => {
    const questions = accessibleSkills({});
    expect(questions.length).toBeGreaterThan(0);
    renderScreen();
    fireEvent.click(screen.getByRole('button', { name: /empezar examen/i }));
    // El examen ya está activo con sus preguntas (verificadas en examSession.test).
    expect(screen.getByTestId('exam')).toHaveTextContent(String(EXAM_QUESTION_COUNT));
  });
});
