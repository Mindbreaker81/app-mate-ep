import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecommendedPractice } from '../RecommendedPractice';

const statsServiceState = vi.hoisted(() => ({
  fetchOwnAttempts: vi.fn(),
}));

vi.mock('../../services/statsService', () => ({
  fetchOwnAttempts: statsServiceState.fetchOwnAttempts,
}));

const gameMocks = vi.hoisted(() => ({
  setPracticeMode: vi.fn(),
  state: { grade: '5e' },
}));

vi.mock('../../context/GameContext', () => ({
  useGame: () => ({
    state: gameMocks.state,
    setPracticeMode: gameMocks.setPracticeMode,
  }),
}));

const authMocks = vi.hoisted(() => ({
  session: { user: { id: 'uuid-1' } },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ session: authMocks.session }),
}));

const badDivisionAttempts = Array.from({ length: 10 }, (_, i) => ({
  operation: 'division',
  grade: '5e',
  isCorrect: i < 3,
  timeSpent: 10,
  createdAt: new Date().toISOString(),
}));

describe('RecommendedPractice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gameMocks.state.grade = '5e';
  });

  it('recomienda practicar el punto débil y activa el modo al pulsar', async () => {
    statsServiceState.fetchOwnAttempts.mockResolvedValue(badDivisionAttempts);

    render(<RecommendedPractice />);

    expect(await screen.findByText(/te toca entrenar/i)).toBeInTheDocument();
    expect(screen.getByText(/divisiones/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /practicar ahora/i }));

    expect(gameMocks.setPracticeMode).toHaveBeenCalledWith('division');
  });

  it('sin puntos débiles no renderiza nada', async () => {
    statsServiceState.fetchOwnAttempts.mockResolvedValue(
      Array.from({ length: 10 }, () => ({
        operation: 'division',
        grade: '5e',
        isCorrect: true,
        timeSpent: 5,
        createdAt: new Date().toISOString(),
      })),
    );

    const { container } = render(<RecommendedPractice />);

    await waitFor(() => {
      expect(statsServiceState.fetchOwnAttempts).toHaveBeenCalled();
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('no recomienda modos que no existen en el curso actual', async () => {
    gameMocks.state.grade = '4t';
    statsServiceState.fetchOwnAttempts.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => ({
        operation: 'integer-addition',
        grade: '6e',
        isCorrect: i < 3,
        timeSpent: 10,
        createdAt: new Date().toISOString(),
      })),
    );

    const { container } = render(<RecommendedPractice />);

    await waitFor(() => {
      expect(statsServiceState.fetchOwnAttempts).toHaveBeenCalled();
    });
    expect(container).toBeEmptyDOMElement();
  });
});
