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
vi.mock('../MyPath', () => ({ MyPath: () => <div>MyPath</div> }));
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

    const pathTab = screen.getByRole('tab', { name: /mi camino/i });
    const exerciseTab = screen.getByRole('tab', { name: /ejercicio/i });
    const statsTab = screen.getByRole('tab', { name: /estadísticas/i });

    // El camino de aprendizaje es el inicio por defecto.
    expect(pathTab).toHaveAttribute('aria-selected', 'true');
    expect(exerciseTab).toHaveAttribute('aria-selected', 'false');

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

  it('las pestañas tienen nombre accesible con texto y sin emoji duplicado (e2e Chrome)', () => {
    render(<Home />);

    // Nombre accesible completo en ambos breakpoints: el texto no vive solo
    // en `hidden sm:inline` (que en móvil dejaba el nombre reducido al emoji).
    const expectedNames = ['Mi camino', 'Ejercicio', 'Estadísticas', 'Logros', 'Práctica', 'Tiempo'];
    expectedNames.forEach((name) => {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument();
    });

    // El emoji decorativo aparece exactamente una vez por pestaña y queda
    // oculto a lectores de pantalla.
    const pathTab = screen.getByRole('tab', { name: 'Mi camino' });
    expect(pathTab.textContent?.split('🧭') ?? []).toHaveLength(2); // emoji + 1 aparición
    expect(pathTab.querySelector('[aria-hidden="true"]')?.textContent).toBe('🧭');
  });
});
