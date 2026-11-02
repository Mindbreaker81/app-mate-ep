import { describe, expect, it } from 'vitest';
import { GRADE_CONFIGS } from '../gameConfig';
import { generateProblem } from '../problemGenerator';

const SIXTH_ONLY_EXACT = [
  'integer-addition',
  'integer-subtraction',
  'integer-multiplication',
  'integer-division',
  'integer-compare',
  'integer-order',
  'simple-equation',
  'ratio',
  'proportion',
  'median',
  'mode',
  'range',
  'probability-simple',
  'probability-compare',
  'circle-area',
  'circle-circumference',
  'volume-rectangular-prism',
  'triangle-angle-sum',
  'scale-conversion',
  'two-step-equation',
  'inverse-proportion',
  'number-line-integer',
  'power-general',
];

const SIXTH_ONLY_PREFIXES = ['integer-'];

function isSixthOnlyOperation(operation: string): boolean {
  return (
    SIXTH_ONLY_EXACT.includes(operation) ||
    SIXTH_ONLY_PREFIXES.some((prefix) => operation.startsWith(prefix))
  );
}

describe('curriculum isolation 5e vs 6e', () => {
  it('5th grade keeps 43 operations without sixth-grade exclusives', () => {
    expect(GRADE_CONFIGS['5e'].availableOperations).toHaveLength(45);
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
