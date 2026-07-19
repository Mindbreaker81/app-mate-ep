import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseState = vi.hoisted(() => {
  const order = vi.fn();
  const eq = vi.fn(() => ({ order }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { from, select, eq, order };
});

vi.mock('../../lib/supabaseClient', () => ({
  supabase: { from: supabaseState.from },
}));

import { fetchOwnAttempts } from '../statsService';

describe('fetchOwnAttempts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mapea los intentos propios al shape de childReport', async () => {
    supabaseState.order.mockResolvedValue({
      data: [
        {
          operation: 'division',
          grade: '5e',
          is_correct: false,
          time_spent: 12,
          created_at: '2026-07-18T10:00:00Z',
        },
      ],
      error: null,
    });

    const result = await fetchOwnAttempts('uuid-1');

    expect(supabaseState.from).toHaveBeenCalledWith('attempts');
    expect(supabaseState.eq).toHaveBeenCalledWith('user_id', 'uuid-1');
    expect(result).toEqual([
      {
        operation: 'division',
        grade: '5e',
        isCorrect: false,
        timeSpent: 12,
        createdAt: '2026-07-18T10:00:00Z',
      },
    ]);
  });

  it('devuelve null si la consulta falla', async () => {
    supabaseState.order.mockResolvedValue({ data: null, error: { message: 'boom' } });

    expect(await fetchOwnAttempts('uuid-1')).toBeNull();
  });
});
