import { describe, expect, it } from 'vitest';
import type { PowerGeneralProblem } from '../../types';
import { GRADE_CONFIGS, LEVELS } from '../gameConfig';
import { generateOperationForTest, generateProblem } from '../generators';
import { contentStageFor } from '../contentStage';
import { buildHint } from '../hints';
import { practiceModeForOperation } from '../practiceConfig';
import { problemSpeechText } from '../problemText';
import { getSkillById, skillIdForOperation } from '../skillCatalog';
import {
  answersMatch,
  formatProblemAnswer,
  isPowerGeneralProblem,
} from '../problemUtils';

describe('power-general (T3 ampliación ESO)', () => {
  it('da siempre un entero exacto y seguro: base ≥ 0, exponente 0–5 y nunca 0^0', () => {
    for (const levelConfig of LEVELS) {
      for (let i = 0; i < 60; i += 1) {
        const problem = generateOperationForTest('power-general', levelConfig.id, levelConfig);
        expect(isPowerGeneralProblem(problem)).toBe(true);
        const power = problem as PowerGeneralProblem;
        expect(power.base).toBeGreaterThanOrEqual(0);
        expect(power.exponent).toBeGreaterThanOrEqual(0);
        expect(power.exponent).toBeLessThanOrEqual(5);
        expect(power.base === 0 && power.exponent === 0).toBe(false);
        expect(power.answer).toBe(power.base ** power.exponent);
        expect(Number.isSafeInteger(power.answer)).toBe(true);
      }
    }
  });

  it('cubre los casos especiales: exponentes 0–5 y bases 0/1', () => {
    const exponents = new Set<number>();
    let sawBaseZero = false;
    let sawBaseOne = false;
    for (let i = 0; i < 400; i += 1) {
      const problem = generateOperationForTest('power-general', 8, LEVELS[7]) as PowerGeneralProblem;
      exponents.add(problem.exponent);
      sawBaseZero ||= problem.base === 0;
      sawBaseOne ||= problem.base === 1;
      if (problem.exponent === 0) {
        expect(problem.answer).toBe(1);
      }
      if (problem.base === 0) {
        expect(problem.answer).toBe(0);
      }
      if (problem.base === 1) {
        expect(problem.answer).toBe(1);
      }
    }
    expect(exponents).toEqual(new Set([0, 1, 2, 3, 4, 5]));
    expect(sawBaseZero).toBe(true);
    expect(sawBaseOne).toBe(true);
  });

  it('pertenece a una habilidad T3 propia con prerrequisitos', () => {
    expect(skillIdForOperation('power-general')).toBe('potencias-eso');
    const skill = getSkillById('potencias-eso');
    expect(skill).not.toBeNull();
    expect(skill?.tier).toBe(3);
    expect(skill?.operations).toEqual(['power-general']);
    expect(skill?.prerequisites).toContain('potencias-raices');
  });

  it('se clasifica como eso-extension con cualquier curso y source', () => {
    expect(contentStageFor('6e', 'power-general')).toBe('eso-extension');
    expect(contentStageFor('5e', 'power-general', 'free')).toBe('eso-extension');
    expect(contentStageFor('4t', 'power-general', 'path')).toBe('eso-extension');
    expect(contentStageFor('6e', 'power-general', 'daily-session')).toBe('eso-extension');
  });

  it('se genera en el modo libre «Ampliación ESO» de 6.º pero no en 4.º/5.º', () => {
    expect(GRADE_CONFIGS['6e'].availableOperations).toContain('power-general');
    expect(GRADE_CONFIGS['5e'].availableOperations).not.toContain('power-general');
    expect(GRADE_CONFIGS['4t'].availableOperations).not.toContain('power-general');
    expect(practiceModeForOperation('power-general')).toBe('eso-extension');

    const seen = new Set<string>();
    for (let i = 0; i < 80; i += 1) {
      seen.add(generateProblem(5, 'eso-extension', '6e').operation);
    }
    expect(seen.has('power-general')).toBe(true);
    for (const bad of seen) {
      expect(contentStageFor('6e', bad, 'free')).toBe('eso-extension');
    }

    for (let i = 0; i < 40; i += 1) {
      expect(generateProblem(5, 'all', '5e').operation).not.toBe('power-general');
      expect(generateProblem(5, 'all', '4t').operation).not.toBe('power-general');
    }
  });

  it('acepta la respuesta formateada y verbaliza el exponente real', () => {
    for (let i = 0; i < 40; i += 1) {
      const problem = generateOperationForTest('power-general', 6, LEVELS[5]) as PowerGeneralProblem;
      expect(answersMatch(problem, formatProblemAnswer(problem))).toBe(true);
      expect(answersMatch(problem, String(problem.answer))).toBe(true);
      expect(answersMatch(problem, String(problem.answer + 1))).toBe(false);
      const speech = problemSpeechText(problem);
      if (problem.exponent === 2) {
        expect(speech).toBe(`${problem.base} al cuadrado`);
      } else if (problem.exponent === 3) {
        expect(speech).toBe(`${problem.base} al cubo`);
      } else {
        expect(speech).toBe(`${problem.base} elevado a ${problem.exponent}`);
      }
    }
  });

  it('tiene pista gradual', () => {
    const problem = generateOperationForTest('power-general', 5, LEVELS[4]);
    expect(buildHint(problem, 1)).not.toBeNull();
    expect(buildHint(problem, 2)).not.toBeNull();
  });
});
