import { supabase } from '../lib/supabaseClient';
import type { PersistedGameState } from '../types';
import { logger } from '../utils/logger';

export type { PersistedGameState } from '../types';

/**
 * Devuelve null solo cuando el usuario aún no tiene fila (primera sesión).
 * Un error de red/BD LANZA: quien llama no debe sembrar el remoto con datos
 * locales posiblemente vacíos si simplemente falló la lectura.
 */
export async function loadGameState(userId: string): Promise<PersistedGameState | null> {
  const { data, error } = await supabase
    .from('game_state')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    logger.error('[gameStateService] Error al cargar estado:', error);
    throw new Error(error.message);
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
