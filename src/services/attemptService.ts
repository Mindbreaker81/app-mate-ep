import { supabase } from '../lib/supabaseClient';
import type { AttemptPayload, LegacySnapshot, PendingAttempt } from '../types';
import { recordSyncAnomaly } from './instrumentationService';
import { logger } from '../utils/logger';

const QUEUE_KEY_PREFIX = 'pitagoritas:attemptQueue:';
const MIGRATION_KEY_PREFIX = 'pitagoritas:migrated:';
const LAST_SYNC_KEY_PREFIX = 'pitagoritas:lastSync:';
const MIGRATION_LIMIT = 120;

const memoryQueues = new Map<string, PendingAttempt[]>();
const flushingUsers = new Set<string>();
const pendingFlushUsers = new Set<string>();

const cloneQueue = (queue: PendingAttempt[]): PendingAttempt[] => JSON.parse(JSON.stringify(queue)) as PendingAttempt[];

const hasWindow = typeof window !== 'undefined';

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
};

function getQueue(userId: string): PendingAttempt[] {
  if (!hasWindow) {
    return cloneQueue(memoryQueues.get(userId) ?? []);
  }

  const raw = window.localStorage.getItem(`${QUEUE_KEY_PREFIX}${userId}`);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PendingAttempt[];
  } catch {
    return [];
  }
}

function saveQueue(userId: string, queue: PendingAttempt[]): void {
  if (!hasWindow) {
    memoryQueues.set(userId, cloneQueue(queue));
    return;
  }
  window.localStorage.setItem(`${QUEUE_KEY_PREFIX}${userId}`, JSON.stringify(queue));
}

function setLastSync(userId: string, iso: string): void {
  if (!hasWindow) return;
  window.localStorage.setItem(`${LAST_SYNC_KEY_PREFIX}${userId}`, iso);
}

async function sendAttempt(userId: string, attempt: PendingAttempt): Promise<void> {
  const { error } =   await supabase.from('attempts').insert({
    user_id: userId,
    operation: attempt.operation,
    level: attempt.level,
    practice_mode: attempt.practiceMode,
    grade: attempt.grade,
    is_correct: attempt.isCorrect,
    time_spent: attempt.timeSpent,
    user_answer: attempt.userAnswer,
    correct_answer: attempt.correctAnswer,
    created_at: attempt.createdAt,
  });

  if (error) {
    throw error;
  }
}

async function drainQueue(userId: string): Promise<void> {
  const queue = getQueue(userId);
  if (queue.length === 0) return;

  const remaining: PendingAttempt[] = [];
  const snapshotIds = new Set(queue.map((attempt) => attempt.id));

  for (let index = 0; index < queue.length; index++) {
    const pending = queue[index];
    try {
      await sendAttempt(userId, pending);
    } catch (error) {
      recordSyncAnomaly('attempt-upload-failed', {
        operation: pending.operation,
        level: pending.level,
        retryCount: pending.retryCount + 1,
        message: error instanceof Error ? error.message : String(error),
      });
      const retryCount = pending.retryCount + 1;
      remaining.push({ ...pending, retryCount });
      if (index + 1 < queue.length) {
        remaining.push(...queue.slice(index + 1));
      }
      break;
    }
  }

  const newlyQueued = getQueue(userId).filter((attempt) => !snapshotIds.has(attempt.id));
  const nextQueue = [...remaining, ...newlyQueued];

  if (nextQueue.length === 0) {
    setLastSync(userId, new Date().toISOString());
  }

  saveQueue(userId, nextQueue);
}

export async function flushQueue(userId: string): Promise<void> {
  if (flushingUsers.has(userId)) {
    pendingFlushUsers.add(userId);
    return;
  }

  flushingUsers.add(userId);

  try {
    do {
      pendingFlushUsers.delete(userId);
      await drainQueue(userId);
    } while (pendingFlushUsers.has(userId) && getQueue(userId).length > 0);
  } finally {
    flushingUsers.delete(userId);
    pendingFlushUsers.delete(userId);
  }
}

function enqueue(userId: string, attempt: AttemptPayload): void {
  const queue = getQueue(userId);
  queue.push({ ...attempt, id: generateId(), retryCount: 0 });
  saveQueue(userId, queue);
}

// Guardar intento directamente en Supabase (sin cola)
export async function recordAttemptDirect(userId: string, attempt: AttemptPayload): Promise<void> {
  try {
    const { error } =   await supabase.from('attempts').insert({
    user_id: userId,
    operation: attempt.operation,
    level: attempt.level,
    practice_mode: attempt.practiceMode,
    grade: attempt.grade,
    is_correct: attempt.isCorrect,
      time_spent: attempt.timeSpent,
      user_answer: attempt.userAnswer,
      correct_answer: attempt.correctAnswer,
      created_at: attempt.createdAt,
    });

    if (error) {
      logger.error('[attemptService] Error al guardar intento:', error);
      // Si falla, usar el sistema de cola como fallback
      enqueue(userId, attempt);
      void flushQueue(userId);
    }
  } catch (error) {
    logger.error('[attemptService] Excepción al guardar intento:', error);
    // Si falla, usar el sistema de cola como fallback
    enqueue(userId, attempt);
    void flushQueue(userId);
  }
}

// Mantener la función anterior para compatibilidad con migración
export function recordAttempt(userId: string, attempt: AttemptPayload): void {
  enqueue(userId, attempt);
  void flushQueue(userId);
}

interface BatchOptions {
  flush?: boolean;
}

export function enqueueBatch(userId: string, attempts: AttemptPayload[], options: BatchOptions = {}): void {
  attempts.forEach((attempt) => enqueue(userId, attempt));
  if (options.flush !== false) {
    void flushQueue(userId);
  }
}

export async function migrateLegacyData(userId: string, snapshot: LegacySnapshot): Promise<void> {
  if (!hasWindow) return;
  const migrationKey = `${MIGRATION_KEY_PREFIX}${userId}`;
  if (window.localStorage.getItem(migrationKey) === 'true') {
    return;
  }

  const attempts: AttemptPayload[] = [];
  const entries = Object.entries(snapshot.stats.operationStats);

  for (const [operationKey, detail] of entries) {
    if (!('total' in detail) || detail.total === 0) continue;
    const total = detail.total;
    const sampleSize = Math.min(total, MIGRATION_LIMIT);
    if (sampleSize === 0) continue;
    const correctRatio = detail.correct / Math.max(total, 1);
    const correctSamples = Math.round(correctRatio * sampleSize);

    for (let index = 0; index < sampleSize; index++) {
      const isCorrect = index < correctSamples;
      attempts.push({
        operation: operationKey as AttemptPayload['operation'],
        level: snapshot.level,
        practiceMode: snapshot.practiceMode,
        isCorrect,
        timeSpent: Math.round(detail.averageTime) || 0,
        userAnswer: null,
        correctAnswer: null,
        createdAt: new Date().toISOString(),
        grade: snapshot.grade ?? '4t',
      });
    }
  }

  if (attempts.length > 0) {
    enqueueBatch(userId, attempts, { flush: false });
    await flushQueue(userId);
  }

  window.localStorage.setItem(migrationKey, 'true');
}

export const __testing = {
  reset() {
    memoryQueues.clear();
    flushingUsers.clear();
    pendingFlushUsers.clear();

    if (!hasWindow) {
      return;
    }

    const keysToRemove = Object.keys(window.localStorage).filter(
      (key) =>
        key.startsWith(QUEUE_KEY_PREFIX) ||
        key.startsWith(MIGRATION_KEY_PREFIX) ||
        key.startsWith(LAST_SYNC_KEY_PREFIX),
    );

    keysToRemove.forEach((key) => {
      window.localStorage.removeItem(key);
    });
  },
};
