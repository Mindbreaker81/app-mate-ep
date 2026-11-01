import type { DailySessionSnapshot } from '../types';
import { getSkillById } from './skillCatalog';
import { todayKey } from './skillProgress';
import { logger } from './logger';

/**
 * Sesión diaria de «Mi camino» guardada en localStorage con una clave por
 * usuario (`pitagoritas.dailySession.<userId>`). A propósito NO va en
 * game_state de Supabase: la sesión es efímera y del dispositivo, así no se
 * restaura una sesión vieja en otro dispositivo ni se mezcla con la carga
 * remota.
 */

const STORAGE_PREFIX = 'pitagoritas.dailySession.';
const STORAGE_VERSION = 1;

const hasWindow = typeof window !== 'undefined';

export function dailySessionStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

/** Serializa la sesión para localStorage (con versión por si cambia el formato). */
export function serializeDailySession(session: DailySessionSnapshot): string {
  return JSON.stringify({ version: STORAGE_VERSION, ...session });
}

/**
 * Valida un dato leído de localStorage y devuelve la sesión lista para
 * restaurar, o null si hay que descartarla: no es del día de hoy, está
 * corrupta, referencia habilidades que ya no existen en el catálogo o ya no
 * tiene nada que reanudar (sin habilidad en curso ni cola).
 */
export function parseDailySession(raw: unknown, today: string): DailySessionSnapshot | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const { date, skillId, queue, done } = raw as Record<string, unknown>;

  if (typeof date !== 'string' || date !== today) {
    return null;
  }
  if (skillId !== null && (typeof skillId !== 'string' || !getSkillById(skillId))) {
    return null;
  }
  if (!Array.isArray(queue) || queue.some((id) => typeof id !== 'string' || !getSkillById(id))) {
    return null;
  }
  if (typeof done !== 'number' || !Number.isInteger(done) || done < 0) {
    return null;
  }
  if (queue.length === 0 && skillId === null) {
    return null;
  }

  return { date, skillId, queue, done };
}

export function saveDailySession(userId: string, session: DailySessionSnapshot): void {
  if (!hasWindow) {
    return;
  }
  try {
    window.localStorage.setItem(dailySessionStorageKey(userId), serializeDailySession(session));
  } catch (error) {
    logger.warn('No se pudo guardar la sesión diaria.', error);
  }
}

export function clearDailySession(userId: string): void {
  if (!hasWindow) {
    return;
  }
  try {
    window.localStorage.removeItem(dailySessionStorageKey(userId));
  } catch (error) {
    logger.warn('No se pudo borrar la sesión diaria guardada.', error);
  }
}

/**
 * Lee la sesión guardada del usuario para el día de hoy. Las entradas
 * corruptas o caducadas se borran para no reintentarlas en cada arranque.
 */
export function loadDailySession(
  userId: string,
  today: string = todayKey(),
): DailySessionSnapshot | null {
  if (!hasWindow) {
    return null;
  }

  const key = dailySessionStorageKey(userId);
  let stored: string | null;
  try {
    stored = window.localStorage.getItem(key);
  } catch {
    return null;
  }
  if (!stored) {
    return null;
  }

  try {
    const session = parseDailySession(JSON.parse(stored), today);
    if (!session) {
      window.localStorage.removeItem(key);
    }
    return session;
  } catch (error) {
    logger.warn('No se pudo leer la sesión diaria guardada.', error);
    window.localStorage.removeItem(key);
    return null;
  }
}
