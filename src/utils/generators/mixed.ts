import type { MixedProblem } from '../../types';
import { recordMixedAnomaly } from '../../services/instrumentationService';
import { evaluateMathTokens } from '../expressionUtils';
import { randomInt, type LevelConfig } from './shared';

export function generateMixedProblem(level: number, levelConfig: LevelConfig): MixedProblem {
  const additionRange = Math.max(6, Math.min(levelConfig.maxNumber, 60));
  const factorRange = Math.max(4, Math.min(levelConfig.maxNumberMult, 12));
  const divisorRange = Math.max(2, Math.min(levelConfig.maxNumberDiv, 12));

  const buildAddition = () => randomInt(2, additionRange);
  const buildFactor = () => randomInt(2, factorRange);
  const buildDivisor = () => randomInt(2, divisorRange);

  const templates: Array<() => MixedProblem> = [
    () => {
      const a = buildAddition();
      const b = buildFactor();
      const c = buildFactor();
      const product = b * c;
      const answer = a + product;
      return mk(`${a} + ${b} × ${c}`, [a, '+', b, '×', c], answer,
        `Paso 1: ${b} × ${c} = ${product}.\nPaso 2: ${a} + ${product} = ${answer}.`);
    },
    () => {
      const b = buildFactor();
      const c = buildFactor();
      const product = b * c;
      const a = product + buildAddition();
      const answer = a - product;
      return mk(`${a} - ${b} × ${c}`, [a, '-', b, '×', c], answer,
        `Paso 1: ${b} × ${c} = ${product}.\nPaso 2: ${a} - ${product} = ${answer}.`);
    },
    () => {
      const a = buildAddition();
      const b = buildAddition();
      const c = buildFactor();
      const sum = a + b;
      const answer = sum * c;
      return mk(`(${a} + ${b}) × ${c}`, ['(', a, '+', b, ')', '×', c], answer,
        `Paso 1: ${a} + ${b} = ${sum}.\nPaso 2: ${sum} × ${c} = ${answer}.`);
    },
    () => {
      const a = randomInt(8, additionRange + 5);
      const b = randomInt(2, Math.max(2, Math.min(a - 1, additionRange)));
      const c = buildFactor();
      const difference = a - b;
      const answer = difference * c;
      return mk(`(${a} - ${b}) × ${c}`, ['(', a, '-', b, ')', '×', c], answer,
        `Paso 1: ${a} - ${b} = ${difference}.\nPaso 2: ${difference} × ${c} = ${answer}.`);
    },
    () => {
      const a = buildFactor();
      const b = buildFactor();
      const c = buildAddition();
      const product = a * b;
      const answer = product + c;
      return mk(`${a} × ${b} + ${c}`, [a, '×', b, '+', c], answer,
        `Paso 1: ${a} × ${b} = ${product}.\nPaso 2: ${product} + ${c} = ${answer}.`);
    },
    () => {
      const divisor = buildDivisor();
      const quotient = randomInt(2, Math.max(3, Math.min(level + 3, 12)));
      const dividend = divisor * quotient;
      const c = buildAddition();
      const answer = quotient + c;
      return mk(`${dividend} ÷ ${divisor} + ${c}`, [dividend, '÷', divisor, '+', c], answer,
        `Paso 1: ${dividend} ÷ ${divisor} = ${quotient}.\nPaso 2: ${quotient} + ${c} = ${answer}.`);
    },
    () => {
      const divisor = buildDivisor();
      const quotient = randomInt(2, 10);
      const dividend = divisor * quotient;
      const c = buildAddition();
      const answer = c - quotient;
      return mk(`${c} - ${dividend} ÷ ${divisor}`, [c, '-', dividend, '÷', divisor], answer,
        `Paso 1: ${dividend} ÷ ${divisor} = ${quotient}.\nPaso 2: ${c} - ${quotient} = ${answer}.`);
    },
    () => {
      const divisor = buildDivisor();
      const answer = randomInt(2, 10);
      const sum = divisor * answer;
      const a = randomInt(1, sum - 1);
      const b = sum - a;
      return mk(`(${a} + ${b}) ÷ ${divisor}`, ['(', a, '+', b, ')', '÷', divisor], answer,
        `Paso 1: ${a} + ${b} = ${sum}.\nPaso 2: ${sum} ÷ ${divisor} = ${answer}.`);
    },
    () => {
      const a = buildFactor();
      const b = buildFactor();
      const c = buildAddition();
      const d = buildAddition();
      const answer = a * b + c * d;
      return mk(`${a} × ${b} + ${c} × ${d}`, [a, '×', b, '+', c, '×', d], answer,
        `Paso 1: ${a}×${b}=${a*b} y ${c}×${d}=${c*d}.\nPaso 2: ${a*b}+${c*d}=${answer}.`);
    },
    () => {
      const a = buildFactor();
      const b = buildFactor();
      const c = buildAddition();
      const product = a * b;
      const answer = product - c;
      return mk(`${a} × ${b} - ${c}`, [a, '×', b, '-', c], answer,
        `Paso 1: ${a} × ${b} = ${product}.\nPaso 2: ${product} - ${c} = ${answer}.`);
    },
    () => {
      const divisor = buildDivisor();
      const inner = buildFactor();
      const c = buildAddition();
      const dividend = divisor * inner;
      const answer = inner + c;
      return mk(`${dividend} ÷ ${divisor} + ${c}`, [dividend, '÷', divisor, '+', c], answer,
        `Paso 1: ${dividend} ÷ ${divisor} = ${inner}.\nPaso 2: ${inner} + ${c} = ${answer}.`);
    },
    () => {
      const a = buildAddition();
      const c = buildDivisor();
      const quotient = randomInt(1, 5);
      const b = c * quotient;
      const answer = a + quotient;
      return mk(`${a} + ${b} ÷ ${c}`, [a, '+', b, '÷', c], answer,
        `Paso 1: ${b} ÷ ${c} = ${quotient}.\nPaso 2: ${a} + ${quotient} = ${answer}.`);
    },
  ];

  const templateIndex = randomInt(0, templates.length - 1);
  try {
    const problem = templates[templateIndex]();
    validateMixedProblem(problem, level, templateIndex);
    return problem;
  } catch (error) {
    recordMixedAnomaly('builder-error', {
      level,
      templateIndex,
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
}

function mk(expression: string, tokens: MixedProblem['tokens'], answer: number, explanation: string): MixedProblem {
  return { expression, tokens, operation: 'mixed', answer, explanation };
}

function validateMixedProblem(problem: MixedProblem, level: number, templateIndex: number): void {
  if (!Number.isInteger(problem.answer)) {
    recordMixedAnomaly('non-integer-answer', { level, expression: problem.expression, answer: problem.answer, templateIndex });
    problem.answer = Math.round(problem.answer);
  }
  try {
    const computed = evaluateMathTokens(problem.tokens);
    if (computed !== problem.answer) {
      recordMixedAnomaly('expression-mismatch', { expression: problem.expression, computed, expected: problem.answer, level, templateIndex });
      problem.answer = typeof computed === 'number' ? Math.round(computed) : problem.answer;
    }
  } catch (expressionError) {
    recordMixedAnomaly('expression-mismatch', {
      expression: problem.expression,
      error: expressionError instanceof Error ? expressionError.message : expressionError,
      level,
      templateIndex,
    });
  }
}
