import { describe, expect, it } from 'vitest';
import { __templates, generateWordProblem } from '../generators/wordProblems';
import { LEVELS } from '../gameConfig';

const configs = [LEVELS[0], LEVELS[Math.floor(LEVELS.length / 2)], LEVELS[LEVELS.length - 1]];

describe('generadores de problemas verbales', () => {
  it('hay al menos 18 plantillas (2 pasos y distractores incluidos)', () => {
    expect(__templates.length).toBeGreaterThanOrEqual(18);
  });

  it.each(configs.map((config) => [config.id, config]))(
    'todas las plantillas producen problemas coherentes con el nivel %s',
    (_id, config) => {
      for (const [index, template] of __templates.entries()) {
        for (let i = 0; i < 25; i++) {
          const problem = template(config);
          expect(problem.operation, `plantilla ${index}`).toBe('word-problem');
          expect(problem.prompt, `plantilla ${index}`).not.toMatch(/NaN|undefined|Infinity/);
          expect(problem.explanation, `plantilla ${index}`).not.toMatch(/NaN|undefined|Infinity/);
          expect(problem.explanation.length, `plantilla ${index}`).toBeGreaterThan(0);
          expect(Number.isFinite(problem.answer), `plantilla ${index}`).toBe(true);
          expect(problem.answer, `plantilla ${index}`).toBeGreaterThanOrEqual(0);
        }
      }
    },
  );

  it('generateWordProblem devuelve un problema válido', () => {
    for (let i = 0; i < 50; i++) {
      const problem = generateWordProblem(LEVELS[0]);
      expect(problem.operation).toBe('word-problem');
      expect(Number.isFinite(problem.answer)).toBe(true);
    }
  });
});
