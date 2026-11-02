import { describe, expect, it } from 'vitest';
import type { Fraction, GradeId, MixedNumber, Operation, Problem, RemainderAnswer } from '../../types';
import { GRADE_CONFIGS, LEVELS } from '../gameConfig';
import { generateOperationForTest, generateProblem } from '../generators';
import { __templates } from '../generators/wordProblems';
import { generateGcdProblem } from '../generators/numberTheory';
import { formatMathNumber } from '../mathUtils';
import { answersMatch, formatProblemAnswer } from '../problemUtils';

/** Entrada canónica que escribiría un usuario para la respuesta correcta. */
function correctInput(problem: Problem): string | Fraction | MixedNumber | RemainderAnswer {
  const answer = (problem as { answer: unknown }).answer;

  if (answer !== null && typeof answer === 'object') {
    return answer as Fraction | MixedNumber | RemainderAnswer;
  }
  // En opción múltiple numérica el valor clicado es la cadena cruda de la opción.
  if (typeof answer === 'number') {
    return problem.operation === 'probability-simple' || problem.operation === 'estimation'
      ? String(answer)
      : formatMathNumber(answer);
  }
  return String(answer);
}

function expectValidText(problem: Problem) {
  const prompt = 'prompt' in problem ? problem.prompt : '';
  for (const text of [prompt ?? '', problem.explanation]) {
    expect(text, `prompt/explicación con NaN/undefined: ${text}`).toMatch(/^(?![\s\S]*(?:NaN|undefined|Infinity))/);
  }
}

function expectOptionsValid(problem: Problem) {
  const options = (problem as { options?: unknown[] }).options;
  if (!Array.isArray(options)) {
    return;
  }
  // Las opciones numéricas se renderizan con formatMathNumber: comparamos etiquetas.
  const labelFor = (value: unknown) => (typeof value === 'number' ? formatMathNumber(value) : String(value));
  expect(options.length, `opciones insuficientes: ${problem.operation}`).toBeGreaterThanOrEqual(2);
  const labels = options.map(labelFor);
  const unique = new Set(labels);
  expect(unique.size, `opciones duplicadas en ${problem.operation}: ${labels.join(' | ')}`).toBe(labels.length);
  expect(
    unique.has(labelFor((problem as { answer: unknown }).answer)),
    `respuesta correcta no incluida en opciones de ${problem.operation}`,
  ).toBe(true);
}

function expectNonNegative(problem: Problem, grade: GradeId) {
  const answer = (problem as { answer?: unknown }).answer;
  const numerics: number[] = [];
  if (typeof answer === 'number') numerics.push(answer);
  if (answer && typeof answer === 'object') {
    for (const value of Object.values(answer as Record<string, unknown>)) {
      if (typeof value === 'number') numerics.push(value);
    }
  }
  for (const value of numerics) {
    expect(value, `respuesta negativa ${value} en ${problem.operation} (${grade})`).toBeGreaterThanOrEqual(0);
  }
}

describe('Invariantes de generadores por curso y nivel', () => {
  const grades: GradeId[] = ['4t', '5e', '6e'];

  for (const grade of grades) {
    const operations = GRADE_CONFIGS[grade].availableOperations;

    it(`${grade}: modo mixto produce problemas válidos en todos los niveles`, () => {
      for (const level of LEVELS) {
        for (let i = 0; i < 30; i += 1) {
          const problem = generateProblem(level.id, 'all', grade);
          expect(problem).toBeTruthy();
          expectValidText(problem);
          expectOptionsValid(problem);
          if (grade !== '6e') {
            expectNonNegative(problem, grade);
          }
          expect(answersMatch(problem, correctInput(problem)), `respuesta correcta rechazada en ${problem.operation} (${grade} nivel ${level.id})`).toBe(true);
        }
      }
    });

    it(`${grade}: cada operación disponible genera problemas válidos`, () => {
      for (const operation of operations) {
        for (const level of [1, LEVELS[Math.floor(LEVELS.length / 2)].id, LEVELS.length]) {
          for (let i = 0; i < 12; i += 1) {
            const problem = generateProblem(level, 'all', grade);
            const levelConfig = LEVELS.find((entry) => entry.id === level)!;
            const specific = generateOperationForTest(operation as Operation, level, levelConfig);
            const target = specific ?? problem;
            expectValidText(target);
            expectOptionsValid(target);
            if (grade !== '6e') {
              expectNonNegative(target, grade);
            }
            expect(answersMatch(target, correctInput(target)), `respuesta correcta rechazada en ${target.operation} (${grade} nivel ${level})`).toBe(true);
          }
        }
      }
    });
  }

  it('los problemas de ordenar no tienen valores repetidos ni equivalentes', () => {
    for (const grade of ['4t', '5e', '6e'] as GradeId[]) {
      for (const level of [1, 5, 10]) {
        for (let i = 0; i < 40; i += 1) {
          const problem = generateProblem(level, 'comparison', grade);
          if (problem.operation !== 'order-values') {
            continue;
          }
          const labels = problem.values;
          expect(new Set(labels).size, `valores duplicados (etiqueta): ${labels.join(', ')}`).toBe(labels.length);
          expect(new Set(problem.answer.split(', ')).size).toBe(4);
        }
      }
    }
  });

  it('las plantillas "por igual" y "mitad" dan resultado exacto', () => {
    const porIgual = __templates[0];
    const mitad = __templates[11];
    const config = LEVELS[3];

    for (let i = 0; i < 30; i += 1) {
      const reparto = porIgual(config);
      const matchReparto = reparto.prompt.match(/Tienes (\d+) caramelos y los repartes entre (\d+) amigos/);
      expect(matchReparto, `prompt inesperado: ${reparto.prompt}`).toBeTruthy();
      const total = Number(matchReparto![1]);
      const amigos = Number(matchReparto![2]);
      expect(total % amigos, `reparto no exacto: ${reparto.prompt}`).toBe(0);
      expect(reparto.answer).toBe(total / amigos);

      const fiesta = mitad(config);
      const matchMitad = fiesta.prompt.match(/hay (\d+) invitados/);
      expect(matchMitad, `prompt inesperado: ${fiesta.prompt}`).toBeTruthy();
      const invitados = Number(matchMitad![1]);
      expect(invitados % 2, `mitad no exacta: ${fiesta.prompt}`).toBe(0);
      expect(fiesta.answer).toBe(invitados / 2);
    }
  });

  it('el MCD no es trivial con frecuencia', () => {
    const config = LEVELS[4];
    let nonTrivial = 0;
    const samples = 30;
    for (let i = 0; i < samples; i += 1) {
      const problem = generateGcdProblem(config);
      expectValidText(problem);
      if (problem.answer > 1) {
        nonTrivial += 1;
      }
    }
    expect(nonTrivial / samples, `MCD trivial en demasiados casos (${samples - nonTrivial}/${samples})`).toBeGreaterThanOrEqual(0.8);
  });

  it('la validación numérica rechaza entradas con texto pegado (77abc)', () => {
    const problem = generateProblem(2, 'addition', '4t');
    if (problem.operation !== 'addition') {
      return;
    }
    expect(answersMatch(problem, `${problem.answer}abc`)).toBe(false);
    expect(answersMatch(problem, `77abc`)).toBe(false);
  });

  it('la media y la mediana son resultados exactos', () => {
    const config = LEVELS[4];
    for (let i = 0; i < 40; i += 1) {
      const mean = generateOperationForTest('mean', 4, config);
      if (mean.operation !== 'mean') {
        continue;
      }
      const values = mean.values;
      const sum = values.reduce((total, value) => total + value, 0);
      expect(sum % values.length, `media inexacta con datos ${values.join(', ')}`).toBe(0);
      expect(mean.answer).toBe(sum / values.length);

      const median = generateOperationForTest('median', 4, config);
      if (median.operation !== 'median') {
        continue;
      }
      const sorted = [...median.values].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const expected = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
      expect(median.answer).toBe(expected);
    }
  });

  it('la multiplicación decimal es exacta', () => {
    const config = LEVELS[6];
    for (let i = 0; i < 40; i += 1) {
      const problem = generateOperationForTest('decimal-multiplication', 6, config);
      if (problem.operation !== 'decimal-multiplication') {
        continue;
      }
      expect(
        Math.abs(problem.answer - problem.num1 * problem.num2),
        `producto inexacto: ${problem.num1} × ${problem.num2} ≠ ${problem.answer}`,
      ).toBeLessThan(1e-9);
    }
  });

  it('la estimación tiene la opción correcta inequívocamente más cercana al valor exacto', () => {
    const config = LEVELS[4];
    for (let i = 0; i < 40; i += 1) {
      const problem = generateOperationForTest('estimation', 4, config);
      if (problem.operation !== 'estimation') {
        continue;
      }
      const match = problem.prompt.match(/estimación de (\d+) ([+×÷-]) (\d+)/);
      expect(match, `prompt sin operandos claros: ${problem.prompt}`).toBeTruthy();
      const a = Number(match![1]);
      const b = Number(match![3]);
      const exact = match![2] === '+' ? a + b : match![2] === '-' ? a - b : match![2] === '×' ? a * b : a / b;
      const others = problem.options.filter((option) => option !== problem.answer);
      const distance = Math.abs(exact - problem.answer);
      for (const other of others) {
        expect(
          Math.abs(exact - other),
          `la opción ${other} compite con la correcta para ${exact} (prompt: ${problem.prompt})`,
        ).toBeGreaterThan(distance);
      }
    }
  });

  it('el círculo calcula área y longitud según el π indicado', () => {
    const config = LEVELS[5];
    for (let i = 0; i < 30; i += 1) {
      const area = generateOperationForTest('circle-area', 5, config);
      if (area.operation !== 'circle-area') {
        continue;
      }
      expect(Math.abs(area.answer - area.piValue * area.radius * area.radius)).toBeLessThan(0.01);

      const length = generateOperationForTest('circle-circumference', 5, config);
      if (length.operation !== 'circle-circumference') {
        continue;
      }
      expect(length.prompt).toMatch(/circunferencia/);
      expect(Math.abs(length.answer - 2 * length.piValue * length.radius)).toBeLessThan(0.01);
    }
  });

  it('power-general es exacto, entero seguro y nunca genera 0^0', () => {
    for (const levelConfig of LEVELS) {
      for (let i = 0; i < 40; i += 1) {
        const problem = generateOperationForTest('power-general', levelConfig.id, levelConfig);
        if (problem.operation !== 'power-general') {
          continue;
        }
        expect(problem.base).toBeGreaterThanOrEqual(0);
        expect(problem.exponent).toBeGreaterThanOrEqual(0);
        expect(problem.exponent).toBeLessThanOrEqual(5);
        expect(problem.base === 0 && problem.exponent === 0, `0^0 generado en nivel ${levelConfig.id}`).toBe(false);
        expect(problem.answer).toBe(problem.base ** problem.exponent);
        expect(Number.isSafeInteger(problem.answer)).toBe(true);
      }
    }
  });

  it('la probabilidad da resultados exactos y acepta fracción equivalente', () => {
    const config = LEVELS[5];
    for (let i = 0; i < 40; i += 1) {
      const problem = generateOperationForTest('probability-simple', 5, config);
      if (problem.operation !== 'probability-simple') {
        continue;
      }
      if (typeof problem.favorable === 'number' && typeof problem.total === 'number') {
        expect(problem.answer, `probabilidad inexacta para ${problem.favorable}/${problem.total}`).toBe(problem.favorable / problem.total);
        expect(answersMatch(problem, `${problem.favorable}/${problem.total}`)).toBe(true);
        expect(answersMatch(problem, `${problem.favorable * 2}/${problem.total * 2}`)).toBe(true);
      }
    }
  });

  it('acepta fracciones equivalentes no simplificadas', () => {
    const config = LEVELS[2];
    for (let i = 0; i < 30; i += 1) {
      const problem = generateOperationForTest('fraction-addition', 2, config);
      if (problem.operation !== 'fraction-addition') {
        continue;
      }
      const doubled = {
        numerator: problem.answer.numerator * 2,
        denominator: problem.answer.denominator * 2,
      };
      expect(answersMatch(problem, doubled), `equivalente ${doubled.numerator}/${doubled.denominator} rechazada`).toBe(true);
    }
  });

  it('la respuesta formateada que se muestra al fallar se acepta como válida', () => {
    for (const grade of grades) {
      for (let i = 0; i < 60; i += 1) {
        const problem = generateProblem(4, 'all', grade);
        const formatted = formatProblemAnswer(problem);
        const answer = (problem as { answer: unknown }).answer;
        if (typeof answer === 'object' && answer !== null) {
          continue; // fracciones y números mixtos se validan por estructura en Exercise
        }
        if (problem.operation.startsWith('compare-') || problem.operation === 'angle-type') {
          continue; // se responden por opciones con valores crudos
        }
        if (formatted === '—') {
          continue;
        }
        expect(answersMatch(problem, formatted), `respuesta mostrada "${formatted}" rechazada en ${problem.operation}`).toBe(true);
      }
    }
  });
});
