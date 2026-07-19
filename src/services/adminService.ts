import { supabase } from '../lib/supabaseClient';
import { isValidPin } from '../utils/authHelpers';
import { logger } from '../utils/logger';

export interface ChildOverview {
  id: string;
  username: string;
  avatar: string | null;
  createdAt: string;
  totalAttempts: number;
  correctAttempts: number;
  lastActivity: string | null;
}

type ChildRow = {
  id: string;
  username: string;
  avatar: string | null;
  created_at: string;
  total_attempts: number;
  correct_attempts: number;
  last_activity: string | null;
};

export interface AttemptRecord {
  userId: string;
  operation: string;
  grade: string;
  isCorrect: boolean;
  timeSpent: number;
  createdAt: string;
}

export type ResetPinResult = { ok: true } | { ok: false; error: string };

const RESET_PIN_ERRORS: Record<string, string> = {
  not_admin: 'No tienes permisos de administrador.',
  invalid_pin: 'El PIN debe contener exactamente 6 dígitos.',
  user_not_found: 'No encontramos ningún niño con ese nombre de usuario.',
};

export async function listChildren(): Promise<ChildOverview[] | null> {
  const { data, error } = await supabase.rpc('admin_list_children');

  if (error) {
    logger.error('[adminService] Error al listar niños:', error);
    return null;
  }

  return ((data ?? []) as ChildRow[]).map((row) => ({
    id: row.id,
    username: row.username,
    avatar: row.avatar,
    createdAt: row.created_at,
    totalAttempts: Number(row.total_attempts),
    correctAttempts: Number(row.correct_attempts),
    lastActivity: row.last_activity,
  }));
}

type AttemptRow = {
  user_id: string;
  operation: string;
  grade: string;
  is_correct: boolean;
  time_spent: number;
  created_at: string;
};

/** Todos los intentos de todos los niños (RLS: solo el admin obtiene filas). */
export async function fetchAllAttempts(): Promise<AttemptRecord[] | null> {
  const { data, error } = await supabase
    .from('attempts')
    .select('user_id, operation, grade, is_correct, time_spent, created_at');

  if (error) {
    logger.error('[adminService] Error al cargar intentos:', error);
    return null;
  }

  return ((data ?? []) as AttemptRow[]).map((row) => ({
    userId: row.user_id,
    operation: row.operation,
    grade: row.grade,
    isCorrect: row.is_correct,
    timeSpent: row.time_spent,
    createdAt: row.created_at,
  }));
}

export async function resetChildPin(username: string, pin: string): Promise<ResetPinResult> {
  if (!isValidPin(pin)) {
    return { ok: false, error: RESET_PIN_ERRORS.invalid_pin };
  }

  const { error } = await supabase.rpc('admin_reset_pin', {
    target_username: username,
    new_pin: pin,
  });

  if (error) {
    logger.error('[adminService] Error al resetear PIN:', error);
    const known = Object.keys(RESET_PIN_ERRORS).find((key) => error.message.includes(key));
    return { ok: false, error: known ? RESET_PIN_ERRORS[known] : 'No pudimos resetear el PIN. Intenta de nuevo.' };
  }

  return { ok: true };
}
