import { describe, expect, it } from 'vitest';
import { GRADE_CONFIGS } from '../gameConfig';
import { generateProblem } from '../problemGenerator';

const SIXTH_ONLY_PREFIXES = [
  'integer-',
  'simple-equation',
  'ratio',
  'proportion',
  'median',
  'mode',
  'range',
  'probability-',
  'circle-',
  'volume-',
  'triangle-angle',
  'scale-',
];

function isSixthOnlyOperation(operation: string): boolean {
  return SIXTH_ONLY_PREFIXES.some(
    (prefix) => operation === prefix.replace(/-$/, '') || operation.startsWith(prefix),
  );
}

describe('curriculum isolation 5e vs 6e', () => {
  it('5th grade keeps 39 operations without sixth-grade exclusives', () => {
    expect(GRADE_CONFIGS['5e'].availableOperations).toHaveLength(39);
    GRADE_CONFIGS['5e'].availableOperations.forEach((operation) => {
      expect(isSixthOnlyOperation(operation)).toBe(false);
    });
  });

  it('6th grade inherits all 5th grade operations', () => {
    GRADE_CONFIGS['5e'].availableOperations.forEach((operation) => {
      expect(GRADE_CONFIGS['6e'].availableOperations).toContain(operation);
    });
  });

  it('5th grade random mode all never emits sixth-only operations', () => {
    for (let index = 0; index < 40; index += 1) {
      const problem = generateProblem(8, 'all', '5e');
      expect(isSixthOnlyOperation(problem.operation)).toBe(false);
    }
  });

  it('6th grade can emit sixth-only operations in all mode', () => {
    const operations = new Set<string>();
    for (let index = 0; index < 80; index += 1) {
      operations.add(generateProblem(8, 'all', '6e').operation);
    }
    expect([...operations].some((operation) => isSixthOnlyOperation(operation))).toBe(true);
  });
});
