type TelemetrySeverity = 'info' | 'warn' | 'error';

export type TelemetryEventType =
  | 'mixed-generation-anomaly'
  | 'mixed-non-integer-answer'
  | 'mixed-token-issue'
  | 'mixed-expression-mismatch'
  | 'sync-attempt-upload-failed'
  | 'sync-supabase-fetch-error'
  | 'sync-unknown-operation';

interface TelemetryEvent {
  id: string;
  type: TelemetryEventType;
  message: string;
  severity: TelemetrySeverity;
  timestamp: string;
  occurrences: number;
  meta?: Record<string, unknown>;
}

const STORAGE_KEY = 'pitagoritas:telemetry';
const MAX_EVENTS = 50;

const hasWindow = typeof window !== 'undefined';
const memoryEvents: TelemetryEvent[] = [];

const loadEvents = (): TelemetryEvent[] => {
  if (!hasWindow) {
    return [...memoryEvents];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TelemetryEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveEvents = (events: TelemetryEvent[]): void => {
  const trimmed = events.slice(-MAX_EVENTS);
  if (!hasWindow) {
    memoryEvents.length = 0;
    memoryEvents.push(...trimmed);
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore storage errors silently
  }
};

const generateId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

const logToConsole = (severity: TelemetrySeverity, message: string, meta?: Record<string, unknown>) => {
  if (typeof console === 'undefined') return;
  const payload = meta ? { ...meta } : undefined;
  if (severity === 'error' && console.error) {
    console.error(`[Pitagoritas] ${message}`, payload);
  } else if (severity === 'warn' && console.warn) {
    console.warn(`[Pitagoritas] ${message}`, payload);
  } else if (console.info) {
    console.info(`[Pitagoritas] ${message}`, payload);
  }
};

export function recordTelemetry(
  type: TelemetryEventType,
  message: string,
  options: {
    severity?: TelemetrySeverity;
    meta?: Record<string, unknown>;
  } = {}
): void {
  const severity = options.severity ?? 'warn';
  const timestamp = new Date().toISOString();
  const events = loadEvents();
  const last = events[events.length - 1];

  if (last && last.type === type && last.message === message) {
    last.timestamp = timestamp;
    last.occurrences = (last.occurrences ?? 1) + 1;
    last.meta = options.meta || last.meta;
  } else {
    events.push({
      id: generateId(),
      type,
      message,
      severity,
      timestamp,
      occurrences: 1,
      meta: options.meta,
    });
  }

  saveEvents(events);

  if (import.meta.env.DEV) {
    logToConsole(severity, message, options.meta);
  }
}

export function recordMixedAnomaly(reason: string, meta?: Record<string, unknown>): void {
  const type: TelemetryEventType =
    reason === 'non-integer-answer'
      ? 'mixed-non-integer-answer'
      : reason === 'token-issue'
      ? 'mixed-token-issue'
      : reason === 'expression-mismatch'
      ? 'mixed-expression-mismatch'
      : 'mixed-generation-anomaly';

  recordTelemetry(type, `Mixed operation anomaly: ${reason}`, {
    severity: reason === 'expression-mismatch' ? 'error' : 'warn',
    meta,
  });
}

export function recordSyncAnomaly(reason: string, meta?: Record<string, unknown>): void {
  const type: TelemetryEventType =
    reason === 'attempt-upload-failed'
      ? 'sync-attempt-upload-failed'
      : reason === 'unknown-operation'
      ? 'sync-unknown-operation'
      : 'sync-supabase-fetch-error';

  recordTelemetry(type, `Sync anomaly: ${reason}`, {
    severity: reason === 'attempt-upload-failed' ? 'error' : 'warn',
    meta,
  });
}

export const __testing = {
  loadEvents,
  reset() {
    if (!hasWindow) {
      memoryEvents.length = 0;
      return;
    }
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  },
};
