import { supabase } from '../lib/supabaseClient';
import type { AttemptPayload, LegacySnapshot, PendingAttempt } from '../types';
import { recordSyncAnomaly } from './instrumentationService';

const QUEUE_KEY_PREFIX = 'pitagoritas:attemptQueue:';
const MIGRATION_KEY_PREFIX = 'pitagoritas:migrated:';
const LAST_SYNC_KEY_PREFIX = 'pitagoritas:lastSync:';
const MIGRATION_LIMIT = 120;

const memoryQueues = new Map<string, PendingAttempt[]>();

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
  const { error } = await supabase.from('attempts').insert({
    user_id: userId,
    operation: attempt.operation,
    level: attempt.level,
    practice_mode: attempt.practiceMode,
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

export async function flushQueue(userId: string): Promise<void> {
  let queue = getQueue(userId);
  if (queue.length === 0) return;

  const remaining: PendingAttempt[] = [];

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
      saveQueue(userId, remaining);
      return;
    }
  }

  if (remaining.length === 0) {
    setLastSync(userId, new Date().toISOString());
  }

  saveQueue(userId, remaining);
  queue = remaining;
}

function enqueue(userId: string, attempt: AttemptPayload): void {
  const queue = getQueue(userId);
  queue.push({ ...attempt, id: generateId(), retryCount: 0 });
  saveQueue(userId, queue);
}

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
      });
    }
  }

  if (attempts.length > 0) {
    enqueueBatch(userId, attempts, { flush: false });
    await flushQueue(userId);
  }

  window.localStorage.setItem(migrationKey, 'true');
}
