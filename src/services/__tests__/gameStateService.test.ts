import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseState = vi.hoisted(() => {
  const maybeSingle = vi.fn();
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const upsert = vi.fn();
  const from = vi.fn(() => ({ select, upsert }));
  return { from, select, eq, maybeSingle, upsert };
});

vi.mock('../../lib/supabaseClient', () => ({
  supabase: { from: supabaseState.from },
}));

import { loadGameState, saveGameState, type PersistedGameState } from '../gameStateService';

const sample: PersistedGameState = {
  maxScore: 12,
  bestStreak: 7,
  totalExercises: 40,
  correctExercises: 30,
  timedCorrectExercises: 5,
  achievements: [],
};

describe('gameStateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carga el estado remoto del usuario', async () => {
    supabaseState.maybeSingle.mockResolvedValue({ data: { data: sample }, error: null });

    expect(await loadGameState('uuid-1')).toEqual(sample);
    expect(supabaseState.from).toHaveBeenCalledWith('game_state');
    expect(supabaseState.eq).toHaveBeenCalledWith('user_id', 'uuid-1');
  });

  it('devuelve null si no hay fila', async () => {
    supabaseState.maybeSingle.mockResolvedValue({ data: null, error: null });

    expect(await loadGameState('uuid-1')).toBeNull();
  });

  it('lanza si hay error (para no confundir fallo de red con primera sesión)', async () => {
    supabaseState.maybeSingle.mockResolvedValue({ data: null, error: { message: 'boom' } });

    await expect(loadGameState('uuid-1')).rejects.toThrow('boom');
  });

  it('guarda con upsert', async () => {
    supabaseState.upsert.mockResolvedValue({ error: null });

    expect(await saveGameState('uuid-1', sample)).toBe(true);
    expect(supabaseState.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'uuid-1', data: sample }),
      { onConflict: 'user_id' },
    );
  });

  it('devuelve false si el upsert falla', async () => {
    supabaseState.upsert.mockResolvedValue({ error: { message: 'boom' } });

    expect(await saveGameState('uuid-1', sample)).toBe(false);
  });
});
