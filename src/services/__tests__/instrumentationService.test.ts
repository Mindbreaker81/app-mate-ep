import { describe, it, expect, beforeEach } from 'vitest';
import { recordMixedAnomaly, recordSyncAnomaly, __testing } from '../instrumentationService';

describe('instrumentationService', () => {
  beforeEach(() => {
    __testing.reset();
  });

  it('records mixed anomalies with metadata', () => {
    recordMixedAnomaly('non-integer-answer', { level: 3, answer: 7.5 });
    const events = __testing.loadEvents();

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('mixed-non-integer-answer');
    expect(events[0].meta).toMatchObject({ level: 3, answer: 7.5 });
    expect(events[0].occurrences).toBe(1);
  });

  it('aggregates repeated events', () => {
    recordMixedAnomaly('token-issue');
    recordMixedAnomaly('token-issue');
    const events = __testing.loadEvents();

    expect(events).toHaveLength(1);
    expect(events[0].occurrences).toBe(2);
  });

  it('records sync anomalies with severity', () => {
    recordSyncAnomaly('attempt-upload-failed', { operation: 'mixed', retryCount: 2 });
    const events = __testing.loadEvents();

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('sync-attempt-upload-failed');
    expect(events[0].meta).toMatchObject({ operation: 'mixed', retryCount: 2 });
  });
});
