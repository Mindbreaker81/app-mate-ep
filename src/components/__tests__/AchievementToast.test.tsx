import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AchievementToast } from '../AchievementToast';
import type { Achievement } from '../../types';

const achievement: Achievement = {
  id: 'streak_5',
  name: 'Racha de 5',
  description: 'Cinco aciertos seguidos',
  icon: '🔥',
  unlocked: true,
};

describe('AchievementToast', () => {
  it('muestra el logro desbloqueado', () => {
    render(<AchievementToast achievement={achievement} />);

    expect(screen.getByRole('status')).toHaveTextContent('¡Logro desbloqueado!');
    expect(screen.getByRole('status')).toHaveTextContent('Racha de 5');
    expect(screen.getByRole('status')).toHaveTextContent('🔥');
  });

  it('no renderiza nada sin logro', () => {
    render(<AchievementToast achievement={null} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
