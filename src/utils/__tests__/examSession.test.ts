import { describe, expect, it } from 'vitest';
import type { ExamState, SerializedAnswer, SkillProgress } from '../../types';
import { getSkillById, SKILLS } from '../skillCatalog';
import { recordSkillAttempt } from '../skillProgress';
import {
  accessibleSkills,
  buildExamQuestions,
  buildExamResult,
  collectExamAnswer,
  EXAM_QUESTION_COUNT,
  examResultsStorageKey,
  formatExamAnswer,
  loadExamResults,
  saveExamResult,
} from '../examSession';

const DAY_MS = 24 * 60 * 60 * 1000;

/** `total` aciertos al primer intento repartidos en dos días (dominio real del motor). */
function dominatedProgress(total = 10): SkillProgress {
  let progress: SkillProgress | undefined;
  const today = new Date();
  for (let i = 0; i < total; i += 1) {
    const date = new Date(today.getTime() + (i < 5 ? -1 : 0) * DAY_MS);
    progress = recordSkillAttempt(progress, { isCorrect: true, isFirstTry: true, date });
  }
  return progress!;
}

describe('accessibleSkills', () => {
  it('con progreso vacío solo abre las habilidades T1 (sin prerrequisitos)', () => {
    const skills = accessibleSkills({});
    expect(skills.length).toBeGreaterThan(0);
    expect(skills.every((skill) => skill.prerequisites.length === 0)).toBe(true);
    expect(skills.map((skill) => skill.id)).toContain('sumas-restas');
    // 'decimales' exige 'multiplicacion-division' dominada: bloqueada.
    expect(skills.map((skill) => skill.id)).not.toContain('decimales');
  });

  it('incluye habilidades desbloqueadas cuando sus prerrequisitos están dominados', () => {
    const skills = accessibleSkills({ 'multiplicacion-division': dominatedProgress() });
    expect(skills.map((skill) => skill.id)).toContain('decimales');
  });
});

describe('buildExamQuestions', () => {
  it('genera diez preguntas de habilidades accesibles', () => {
    const questions = buildExamQuestions({});
    expect(questions).toHaveLength(EXAM_QUESTION_COUNT);
    const accessibleIds = new Set(accessibleSkills({}).map((skill) => skill.id));
    for (const question of questions) {
      expect(accessibleIds.has(question.skillId)).toBe(true);
      expect(question.skillName.length).toBeGreaterThan(0);
    }
  });

  it('cada pregunta usa una operación de su habilidad y viene con su respuesta', () => {
    const questions = buildExamQuestions({});
    for (const question of questions) {
      const skill = getSkillById(question.skillId)!;
      expect(skill.operations).toContain(question.problem.operation);
      expect(question.problem.answer).not.toBeUndefined();
    }
  });

  it('con menos habilidades accesibles que preguntas, repite habilidades sin salirse del conjunto', () => {
    // Progreso vacío → solo las 7 habilidades T1 están abiertas para 10 preguntas.
    const questions = buildExamQuestions({});
    const skillIds = questions.map((question) => question.skillId);
    expect(new Set(skillIds).size).toBeLessThan(EXAM_QUESTION_COUNT);
    const accessibleIds = new Set(accessibleSkills({}).map((skill) => skill.id));
    for (const id of skillIds) {
      expect(accessibleIds.has(id)).toBe(true);
    }
  });

  it('no genera preguntas de habilidades bloqueadas aunque existan en el catálogo', () => {
    const questions = buildExamQuestions({});
    const lockedIds = SKILLS.filter((skill) => skill.prerequisites.length > 0).map((skill) => skill.id);
    for (const question of questions) {
      expect(lockedIds).not.toContain(question.skillId);
    }
  });
});

describe('collectExamAnswer', () => {
  const fractionProblem = {
    operation: 'fraction-addition' as const,
    num1: { numerator: 1, denominator: 2 },
    num2: { numerator: 1, denominator: 4 },
    answer: { numerator: 3, denominator: 4 },
    explanation: '',
  };
  const remainderProblem = {
    operation: 'division-remainder' as const,
    num1: 7,
    num2: 2,
    answer: { quotient: 3, remainder: 1 },
    explanation: '',
  };
  const numericProblem = {
    operation: 'addition' as const,
    num1: 2,
    num2: 3,
    answer: 5,
    explanation: '',
  };
  const empty = {
    userAnswer: '',
    fracAnswer: { numerator: '', denominator: '' },
    mixedAnswer: { whole: '', numerator: '', denominator: '' },
    remainderAnswer: { quotient: '', remainder: '' },
  };

  it('rechaza campos vacíos con un mensaje en castellano', () => {
    const result = collectExamAnswer(numericProblem, empty);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('respuesta');
    }
  });

  it('recoge una respuesta numérica', () => {
    const result = collectExamAnswer(numericProblem, { ...empty, userAnswer: '5' });
    expect(result).toEqual({ ok: true, answer: '5' });
  });

  it('recoge una fracción y valida denominador distinto de cero', () => {
    const ok = collectExamAnswer(fractionProblem, {
      ...empty,
      fracAnswer: { numerator: '3', denominator: '4' },
    });
    expect(ok).toEqual({ ok: true, answer: { numerator: 3, denominator: 4 } });

    const bad = collectExamAnswer(fractionProblem, {
      ...empty,
      fracAnswer: { numerator: '3', denominator: '0' },
    });
    expect(bad.ok).toBe(false);
  });

  it('recoge cociente y resto', () => {
    const result = collectExamAnswer(remainderProblem, {
      ...empty,
      remainderAnswer: { quotient: '3', remainder: '1' },
    });
    expect(result).toEqual({ ok: true, answer: { quotient: 3, remainder: 1 } });
  });
});

describe('formatExamAnswer', () => {
  it('formatea cada forma de respuesta', () => {
    expect(formatExamAnswer('7')).toBe('7');
    expect(formatExamAnswer(7)).toBe('7');
    expect(formatExamAnswer({ numerator: 3, denominator: 4 })).toBe('3/4');
    expect(formatExamAnswer({ whole: 2, numerator: 1, denominator: 3 })).toBe('2 1/3');
    expect(formatExamAnswer({ quotient: 3, remainder: 1 })).toBe('3 resto 1');
    expect(formatExamAnswer(null)).toBe('—');
    expect(formatExamAnswer(undefined)).toBe('—');
  });
});

describe('buildExamResult', () => {
  const exam: ExamState = {
    questions: [
      {
        skillId: 'sumas-restas',
        skillName: 'Sumas y restas',
        problem: { operation: 'addition', num1: 2, num2: 3, answer: 5, explanation: 'Suma' },
      },
      {
        skillId: 'sumas-restas',
        skillName: 'Sumas y restas',
        problem: { operation: 'subtraction', num1: 9, num2: 4, answer: 5, explanation: 'Resta' },
      },
    ],
    index: 1,
    answers: { 0: '5' },
    finished: true,
  };

  it('puntúa solo al final, con aciertos comparados por la regla oficial', () => {
    const result = buildExamResult(exam, { id: 'r1', date: '2026-11-05T10:00:00.000Z' });
    expect(result.id).toBe('r1');
    expect(result.total).toBe(2);
    expect(result.correct).toBe(1);
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0].isCorrect).toBe(true);
    expect(result.entries[0].correctAnswer).toBe('5');
    // Sin responder: cuenta como fallo y muestra «—».
    expect(result.entries[1].isCorrect).toBe(false);
    expect(result.entries[1].userAnswer).toBe('—');
  });

  it('guarda un texto de enunciado por pregunta (sin exponer la solución en ese campo)', () => {
    const result = buildExamResult(exam, { id: 'r1', date: '2026-11-05T10:00:00.000Z' });
    for (const entry of result.entries) {
      expect(entry.question.length).toBeGreaterThan(0);
      expect(entry.question).not.toContain(entry.correctAnswer);
    }
  });
});

describe('almacenamiento local de resultados (solo dispositivo)', () => {
  const sampleResult = {
    id: 'r1',
    date: '2026-11-05T10:00:00.000Z',
    correct: 8,
    total: 10,
    entries: [
      {
        skillId: 'sumas-restas',
        skillName: 'Sumas y restas',
        question: '2 más 3',
        userAnswer: '5',
        correctAnswer: '5',
        isCorrect: true,
      },
    ],
  };

  it('guarda y carga resultados por usuario, sin mezclar cuentas', () => {
    saveExamResult('user-a', sampleResult);
    saveExamResult('user-b', { ...sampleResult, id: 'r2', correct: 3 });

    const a = loadExamResults('user-a');
    const b = loadExamResults('user-b');
    expect(a).toHaveLength(1);
    expect(a[0].correct).toBe(8);
    expect(b).toHaveLength(1);
    expect(b[0].correct).toBe(3);
    expect(examResultsStorageKey('user-a')).not.toBe(examResultsStorageKey('user-b'));
  });

  it('los más recientes van primero y no duplica por id (idempotente)', () => {
    saveExamResult('user-c', sampleResult);
    saveExamResult('user-c', { ...sampleResult, id: 'r2' });
    saveExamResult('user-c', { ...sampleResult, id: 'r2' });
    const results = loadExamResults('user-c');
    expect(results.map((result) => result.id)).toEqual(['r2', 'r1']);
  });

  it('descarta datos corruptos', () => {
    window.localStorage.setItem(examResultsStorageKey('user-d'), '{no-json');
    expect(loadExamResults('user-d')).toEqual([]);
    window.localStorage.setItem(examResultsStorageKey('user-d'), JSON.stringify({ foo: 1 }));
    expect(loadExamResults('user-d')).toEqual([]);
  });
});

describe('answer typing', () => {
  it('SerializedAnswer cubre las formas del examen', () => {
    const answers: SerializedAnswer[] = [
      '5',
      5,
      { numerator: 1, denominator: 2 },
      { whole: 1, numerator: 1, denominator: 2 },
      { quotient: 2, remainder: 1 },
      null,
    ];
    expect(answers.map(formatExamAnswer)).toEqual(['5', '5', '1/2', '1 1/2', '2 resto 1', '—']);
  });
});
