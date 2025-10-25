import { describe, expect, it } from 'vitest';
import {
  normalizeUsername,
  isValidPin,
  isValidUsername,
  buildSyntheticEmail,
  SYNTHETIC_EMAIL_DOMAIN,
} from '../authHelpers';

describe('authHelpers', () => {
  it('normalizes username by trimming and lowercasing', () => {
    expect(normalizeUsername('  PiTO  ')).toBe('pito');
  });

  it('validates usernames with allowed characters and length', () => {
    expect(isValidUsername('pitagoritas')).toBe(true);
    expect(isValidUsername('pi')).toBe(false);
    expect(isValidUsername('usuario_demo')).toBe(false);
    expect(isValidUsername('invalid!')).toBe(false);
  });

  it('validates PIN as six digits', () => {
    expect(isValidPin('123456')).toBe(true);
    expect(isValidPin('12345')).toBe(false);
    expect(isValidPin('1234567')).toBe(false);
    expect(isValidPin('12a456')).toBe(false);
  });

  it('builds synthetic email using configured domain', () => {
    expect(buildSyntheticEmail('usuario')).toBe(`usuario@${SYNTHETIC_EMAIL_DOMAIN}`);
  });
});
