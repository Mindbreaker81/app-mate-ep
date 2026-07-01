import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseState = vi.hoisted(() => {
  const insert = vi.fn();
  const from = vi.fn(() => ({ insert }));
  return { insert, from };
});

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: supabaseState.from,
  },
}));

import { __testing, enqueueBatch, flushQueue } from '../attemptService';

const baseAttempt = {
  operation: 'addition' as const,
  level: 1,
  practiceMode: 'all' as const,
  grade: '5e' as const,
  isCorrect: true,
  timeSpent: 2,
  userAnswer: 4,
  correctAnswer: 4,
  createdAt: '2026-04-03T00:00:00.000Z',
};

describe('attemptService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __testing.reset();
    supabaseState.insert.mockResolvedValue({ error: null });
  });

  it('serializes concurrent flushes for the same user', async () => {
    supabaseState.insert.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ error: null }), 10);
        }),
    );

    enqueueBatch(
      'user-1',
      [
        baseAttempt,
        { ...baseAttempt, createdAt: '2026-04-03T00:00:01.000Z', userAnswer: 5, correctAnswer: 5 },
      ],
      { flush: false },
    );

    await Promise.all([flushQueue('user-1'), flushQueue('user-1')]);

    expect(supabaseState.insert).toHaveBeenCalledTimes(2);
  });

  it('reprocesses newly queued attempts after an in-flight flush', async () => {
    supabaseState.insert.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ error: null }), 10);
        }),
    );

    enqueueBatch('user-1', [baseAttempt], { flush: false });

    const firstFlush = flushQueue('user-1');
    await new Promise((resolve) => setTimeout(resolve, 1));

    enqueueBatch(
      'user-1',
      [{ ...baseAttempt, createdAt: '2026-04-03T00:00:02.000Z', userAnswer: 6, correctAnswer: 6 }],
      { flush: false },
    );
    const secondFlush = flushQueue('user-1');

    await Promise.all([firstFlush, secondFlush]);

    expect(supabaseState.insert).toHaveBeenCalledTimes(2);
  });
});
