import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Achievements } from '../Achievements';
import { masteryAchievementCatalog } from '../../utils/masteryAchievements';
import { SKILLS } from '../../utils/skillCatalog';

const gameMocks = vi.hoisted(() => ({
  state: {
    achievements: [] as Array<{
      id: string;
      name: string;
      description: string;
      icon: string;
      unlocked: boolean;
      unlockedAt?: Date;
    }>,
  },
}));

vi.mock('../../context/GameContext', () => ({
  useGame: () => ({ state: gameMocks.state }),
}));

describe('Achievements — insignias por dominio', () => {
  it('siempre muestra el catálogo de insignias para explicar cómo se obtienen', () => {
    gameMocks.state.achievements = [];
    render(<Achievements />);

    expect(screen.getByText(/insignias por dominio/i)).toBeInTheDocument();
    const total = masteryAchievementCatalog().length;
    expect(screen.getByText(new RegExp(`0 de ${total}`))).toBeInTheDocument();
    // Las insignias bloqueadas muestran el candado y la forma de conseguirlas.
    expect(screen.getAllByText('🔒')).toHaveLength(total);
    expect(screen.getByText(/domina «sumas y restas» en mi camino/i)).toBeInTheDocument();
  });

  it('marca como conseguidas las insignias dominadas y conserva los logros normales', () => {
    gameMocks.state.achievements = [
      {
        id: 'first_correct',
        name: '¡Primer Acierto!',
        description: 'Resuelve tu primer ejercicio correctamente',
        icon: '🎯',
        unlocked: true,
      },
      {
        id: 'mastery:sumas-restas',
        name: 'Dominio: Sumas y restas',
        description: 'Domina «Sumas y restas» en Mi camino',
        icon: '➕',
        unlocked: true,
        unlockedAt: new Date(),
      },
    ];
    render(<Achievements />);

    // Logro normal intacto.
    expect(screen.getByText('¡Primer Acierto!')).toBeInTheDocument();
    // Insignia desbloqueada con su icono propio (no candado).
    expect(screen.getByText('Dominio: Sumas y restas')).toBeInTheDocument();
    const total = masteryAchievementCatalog().length;
    expect(screen.getByText(new RegExp(`1 de ${total}`))).toBeInTheDocument();
    expect(screen.getAllByText('🔒')).toHaveLength(total - 1);
    // La insignia de área sigue bloqueada.
    expect(screen.getByText('Área: Cálculo y operaciones')).toBeInTheDocument();
  });

  it('el catálogo cubre una insignia por cada habilidad del camino', () => {
    gameMocks.state.achievements = [];
    render(<Achievements />);

    for (const skill of SKILLS) {
      expect(screen.getByText(`Dominio: ${skill.name}`)).toBeInTheDocument();
    }
  });
});
