import { describe, expect, it } from 'vitest';
import { allowsNegativeAnswer } from '../problemUtils';
import type { Problem } from '../../types';

const problemWith = (operation: string): Problem =>
  ({ operation } as unknown as Problem);

describe('allowsNegativeAnswer', () => {
  it.each([
    'integer-addition',
    'integer-subtraction',
    'integer-multiplication',
    'integer-division',
    'simple-equation',
  ])('permite negativos en %s', (operation) => {
    expect(allowsNegativeAnswer(problemWith(operation))).toBe(true);
  });

  it.each(['addition', 'subtraction', 'fraction-addition', 'percentage', 'word-problem'])(
    'no permite negativos en %s',
    (operation) => {
      expect(allowsNegativeAnswer(problemWith(operation))).toBe(false);
    },
  );
});
