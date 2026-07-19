import { supabase } from '../lib/supabaseClient';
import type { PersistedGameState } from '../types';
import { logger } from '../utils/logger';

export type { PersistedGameState } from '../types';

export async function loadGameState(userId: string): Promise<PersistedGameState | null> {
  const { data, error } = await supabase
    .from('game_state')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    logger.error('[gameStateService] Error al cargar estado:', error);
    return null;
  }

  return (data?.data as PersistedGameState | undefined) ?? null;
}

export async function saveGameState(userId: string, state: PersistedGameState): Promise<boolean> {
  const { error } = await supabase
    .from('game_state')
    .upsert(
      { user_id: userId, data: state, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );

  if (error) {
    logger.error('[gameStateService] Error al guardar estado:', error);
    return false;
  }

  return true;
}
