import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Home } from '../Home';

const gameMocks = vi.hoisted(() => ({
  resetGame: vi.fn(),
  setGrade: vi.fn(),
}));

vi.mock('../../context/GameContext', () => ({
  useGame: () => ({
    state: {
      score: 8,
      streak: 3,
      level: 2,
      grade: '4t',
      achievements: [{ id: 'first_correct', unlocked: true }],
      recentAchievement: null,
      daily: null,
      practiceDays: [],
    },
    resetGame: gameMocks.resetGame,
    setGrade: gameMocks.setGrade,
  }),
}));

vi.mock('../Exercise', () => ({ Exercise: () => <div>Exercise</div> }));
vi.mock('../ScoreBoard', () => ({ ScoreBoard: () => <div>ScoreBoard</div> }));
vi.mock('../Achievements', () => ({ Achievements: () => <div>Achievements</div> }));
vi.mock('../DetailedStats', () => ({ DetailedStats: () => <div>DetailedStats</div> }));
vi.mock('../PracticeModes', () => ({ PracticeModes: () => <div>PracticeModes</div> }));
vi.mock('../TimeModes', () => ({ TimeModes: () => <div>TimeModes</div> }));

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders accessible tabs and switches panels', () => {
    render(<Home />);

    expect(screen.getByRole('tablist', { name: /secciones principales/i })).toBeInTheDocument();

    const exerciseTab = screen.getByRole('tab', { name: /ejercicio/i });
    const statsTab = screen.getByRole('tab', { name: /estadísticas/i });

    expect(exerciseTab).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(statsTab);

    expect(statsTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'stats-tab');
  });

  it('shows grade selector state and notifies grade changes', () => {
    render(<Home />);

    const fourthGradeButton = screen.getByRole('button', { name: /4.º de primaria/i });
    const fifthGradeButton = screen.getByRole('button', { name: /5.º de primaria/i });
    const sixthGradeButton = screen.getByRole('button', { name: /6.º de primaria/i });

    expect(fourthGradeButton).toHaveAttribute('aria-pressed', 'true');
    expect(fifthGradeButton).toHaveAttribute('aria-pressed', 'false');
    expect(sixthGradeButton).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(fifthGradeButton);

    expect(gameMocks.setGrade).toHaveBeenCalledWith('5e');
  });
});
