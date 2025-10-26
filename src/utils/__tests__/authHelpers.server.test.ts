import { describe, it, expect } from 'vitest';
import { SYNTHETIC_EMAIL_DOMAIN } from '../authHelpers';

describe('SYNTHETIC_EMAIL_DOMAIN', () => {
  it('is defined and non-empty', () => {
    expect(typeof SYNTHETIC_EMAIL_DOMAIN).toBe('string');
    expect(SYNTHETIC_EMAIL_DOMAIN.length).toBeGreaterThan(0);
  });
});
