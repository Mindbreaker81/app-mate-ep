import { supabase } from '../lib/supabaseClient';
import type { AttemptSource, SkillProgress } from '../types';
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
  /** Procedencia del intento; los registros antiguos se normalizan a 'free'. */
  source: AttemptSource;
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
  source: AttemptSource | null;
  is_correct: boolean;
  time_spent: number;
  created_at: string;
};

/** Todos los intentos de todos los niños (RLS: solo el admin obtiene filas). */
export async function fetchAllAttempts(): Promise<AttemptRecord[] | null> {
  const { data, error } = await supabase
    .from('attempts')
    .select('user_id, operation, grade, source, is_correct, time_spent, created_at');

  if (error) {
    logger.error('[adminService] Error al cargar intentos:', error);
    return null;
  }

  return ((data ?? []) as AttemptRow[]).map((row) => ({
    userId: row.user_id,
    operation: row.operation,
    grade: row.grade,
    // Filas anteriores a la migración 0008 no tienen source → modo libre.
    source: row.source ?? 'free',
    isCorrect: row.is_correct,
    timeSpent: row.time_spent,
    createdAt: row.created_at,
  }));
}

/** Motivo por el que no se pudo leer el dominio del niño (panel familiar, PIT-30). */
export type SkillProgressErrorReason =
  | 'migration-missing'
  | 'not-authorized'
  | 'child-not-found'
  | 'unknown';

export interface ChildSkillProgress {
  /** Progreso persistido por habilidad (game_state.data.skills). Vacío si aún no hay fila. */
  skills: Record<string, SkillProgress>;
  /** Marca temporal de la fila game_state; null si el niño todavía no la tiene. */
  updatedAt: string | null;
}

export type FetchSkillProgressResult =
  | { ok: true; progress: ChildSkillProgress }
  | { ok: false; reason: SkillProgressErrorReason; message: string };

const SKILL_PROGRESS_MESSAGES: Record<SkillProgressErrorReason, string> = {
  'migration-missing':
    'El dominio por habilidad todavía no está disponible: falta aplicar la migración 0009 en Supabase.',
  'not-authorized': 'No tienes permisos de administrador.',
  'child-not-found': 'Este niño ya no existe o no es una cuenta de niño.',
  unknown: 'No pudimos cargar el dominio de este niño. Inténtalo de nuevo.',
};

function classifySkillProgressError(error: { message: string; code?: string }): SkillProgressErrorReason {
  // Primero permisos: «permission denied for function admin_get_skill_progress»
  // también nombra la función, pero es un problema de grants, no de migración.
  if (error.code === '42501' || error.message.includes('not_admin')) {
    return 'not-authorized';
  }
  if (error.message.includes('user_not_found')) {
    return 'child-not-found';
  }
  // La función no existe en la caché de PostgREST (0009 sin aplicar) o en Postgres.
  if (
    error.code === 'PGRST202' ||
    error.code === '42883' ||
    error.message.includes('admin_get_skill_progress')
  ) {
    return 'migration-missing';
  }
  return 'unknown';
}

type SkillProgressRow = {
  skills: unknown;
  updated_at: string | null;
};

/** Filtra entradas malformadas: solo objetos con la ventana de resultados. */
function sanitizeSkillProgress(raw: unknown): Record<string, SkillProgress> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }
  const skills: Record<string, SkillProgress> = {};
  for (const [skillId, value] of Object.entries(raw)) {
    if (value && typeof value === 'object' && Array.isArray((value as SkillProgress).recentResults)) {
      skills[skillId] = value as SkillProgress;
    }
  }
  return skills;
}

/**
 * Progreso por habilidad del niño vía RPC admin_get_skill_progress (0009):
 * solo lectura, solo si is_admin(). Sin fila devuelve skills {} (vacío),
 * nunca inventa dominio.
 */
export async function fetchChildSkillProgress(childId: string): Promise<FetchSkillProgressResult> {
  const { data, error } = await supabase.rpc('admin_get_skill_progress', {
    target_user_id: childId,
  });

  if (error) {
    logger.error('[adminService] Error al cargar dominio por habilidad:', error);
    const reason = classifySkillProgressError(error);
    return { ok: false, reason, message: SKILL_PROGRESS_MESSAGES[reason] };
  }

  const row = ((data ?? []) as SkillProgressRow[])[0];
  return {
    ok: true,
    progress: { skills: sanitizeSkillProgress(row?.skills), updatedAt: row?.updated_at ?? null },
  };
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
