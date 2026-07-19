import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DailyGoalCard } from '../DailyGoalCard';
import { localDateKey } from '../../utils/dailyGoal';

const today = localDateKey(new Date());

describe('DailyGoalCard', () => {
  it('muestra el progreso de hoy hacia la meta', () => {
    render(<DailyGoalCard daily={{ date: today, count: 7 }} practiceDays={[today]} />);

    expect(screen.getByText(/7 \/ 10 hoy/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '7');
  });

  it('celebra la meta cumplida', () => {
    render(<DailyGoalCard daily={{ date: today, count: 12 }} practiceDays={[today]} />);

    expect(screen.getByText(/¡meta cumplida!/i)).toBeInTheDocument();
  });

  it('muestra la racha de días cuando hay 2 o más', () => {
    const yesterday = localDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
    render(<DailyGoalCard daily={{ date: today, count: 3 }} practiceDays={[yesterday, today]} />);

    expect(screen.getByText(/🔥 2 días seguidos/)).toBeInTheDocument();
  });

  it('sin racha no muestra el fuego', () => {
    render(<DailyGoalCard daily={{ date: today, count: 3 }} practiceDays={[today]} />);

    expect(screen.queryByText(/días seguidos/)).not.toBeInTheDocument();
  });

  it('un día sin ejercicios muestra 0', () => {
    const yesterday = localDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
    render(<DailyGoalCard daily={{ date: yesterday, count: 9 }} practiceDays={[]} />);

    expect(screen.getByText(/0 \/ 10 hoy/)).toBeInTheDocument();
  });
});
