import { describe, expect, it } from 'vitest';
import { practiceModeForOperation } from '../practiceConfig';
import { OPERATION_KEYS } from '../../types';

describe('practiceModeForOperation', () => {
  it.each([
    ['division', 'division'],
    ['division-remainder', 'division'],
    ['fraction-addition', 'fractions'],
    ['decimal-multiplication', 'decimals'],
    ['word-problem', 'word-problems'],
    ['gcd', 'number-theory'],
    ['integer-addition', 'integers'],
    ['circle-area', 'geometry-advanced'],
    ['percentage', 'percentages'],
    ['simple-equation', 'equations'],
  ])('mapea %s → %s', (operation, mode) => {
    expect(practiceModeForOperation(operation)).toBe(mode);
  });

  it('factorization prefiere el modo específico', () => {
    expect(practiceModeForOperation('factorization')).toBe('factorization');
  });

  it('operación desconocida devuelve null', () => {
    expect(practiceModeForOperation('teleportation')).toBeNull();
  });

  it('toda operación del juego tiene un modo de práctica', () => {
    for (const operation of OPERATION_KEYS) {
      expect(practiceModeForOperation(operation), operation).not.toBeNull();
    }
  });
});
