import type {
  ExamQuestion,
  ExamResult,
  ExamResultEntry,
  ExamState,
  Fraction,
  MixedNumber,
  Problem,
  RemainderAnswer,
  SerializedAnswer,
  SkillProgress,
} from '../types';
import { SKILLS, type Skill } from './skillCatalog';
import {
  createSkillProgress,
  deriveSkillState,
  prerequisitesMet,
  SKILL_TO_PROBLEM_LEVEL,
} from './skillProgress';
import { LEVELS } from './gameConfig';
import { generateOperation } from './problemGenerator';
import { formatMathNumber } from './mathUtils';
import {
  answersMatch,
  formatMixedNumber,
  formatProblemAnswer,
  formatRemainderAnswer,
  isConversionProblem,
  isFactorizationProblem,
  isFractionPercentProblem,
  isFractionProblem,
  isMixedNumberConvertProblem,
  isMixedNumberProblem,
  isRemainderProblem,
  normalizeFactorizationAnswer,
  parseFullNumber,
} from './problemUtils';
import { problemSpeechText } from './problemText';
import { logger } from './logger';

/**
 * Repaso de examen (PIT-32): diez preguntas de las habilidades accesibles del
 * camino, sin corrección ni pistas hasta el final. El resultado se guarda solo
 * en localStorage por usuario (MVP sin migración ni envío remoto); el examen
 * nunca pasa por CHECK_ANSWER, así que no toca dominio, logros ni intentos.
 */

export const EXAM_QUESTION_COUNT = 10;

/** Habilidades accesibles hoy (no bloqueadas): las que puede elegir un examen. */
export function accessibleSkills(progress: Record<string, SkillProgress>, today: Date = new Date()): Skill[] {
  return SKILLS.filter(
    (skill) =>
      deriveSkillState(progress[skill.id] ?? createSkillProgress(today), prerequisitesMet(skill, progress), today) !== 'locked',
  );
}

/** Baraja una copia de la lista (Fisher-Yates). */
function shuffled<T>(items: T[], random: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function problemForSkill(skill: Skill, progress: Record<string, SkillProgress>): Problem {
  const operation = skill.operations[Math.floor(Math.random() * skill.operations.length)];
  const problemLevel = SKILL_TO_PROBLEM_LEVEL(progress[skill.id]?.level ?? 1);
  const levelConfig = LEVELS.find((entry) => entry.id === problemLevel) ?? LEVELS[0];
  return generateOperation(operation, problemLevel, levelConfig);
}

/**
 * Las diez preguntas del examen: habilidades accesibles barajadas y en
 * round-robin (si hay menos de diez se repiten con problemas nuevos). No muta
 * el progreso: solo lo lee para fijar el nivel de cada problema.
 */
export function buildExamQuestions(
  progress: Record<string, SkillProgress>,
  options: { today?: Date; count?: number; random?: () => number } = {},
): ExamQuestion[] {
  const count = options.count ?? EXAM_QUESTION_COUNT;
  const skills = shuffled(accessibleSkills(progress, options.today ?? new Date()), options.random);
  if (skills.length === 0) {
    return [];
  }
  const questions: ExamQuestion[] = [];
  for (let i = 0; i < count; i += 1) {
    const skill = skills[i % skills.length];
    questions.push({
      skillId: skill.id,
      skillName: skill.name,
      problem: problemForSkill(skill, progress),
    });
  }
  return questions;
}

// — Recogida de la respuesta de una pregunta —

export interface ExamAnswerDraft {
  userAnswer: string;
  fracAnswer: { numerator: string; denominator: string };
  mixedAnswer: { whole: string; numerator: string; denominator: string };
  remainderAnswer: { quotient: string; remainder: string };
}

export type ExamAnswerResult =
  | { ok: true; answer: SerializedAnswer }
  | { ok: false; error: string };

const EMPTY_ANSWER_ERROR = 'Escribe tu respuesta antes de continuar.';

function parseField(value: string): number | null {
  return value.trim() === '' ? null : parseFullNumber(value);
}

function fractionAnswer(draft: ExamAnswerDraft): ExamAnswerResult {
  const numerator = parseField(draft.fracAnswer.numerator);
  const denominator = parseField(draft.fracAnswer.denominator);
  if (numerator === null || denominator === null) {
    return { ok: false, error: EMPTY_ANSWER_ERROR };
  }
  if (denominator === 0) {
    return { ok: false, error: 'El denominador no puede ser 0.' };
  }
  return { ok: true, answer: { numerator, denominator } };
}

function mixedAnswer(draft: ExamAnswerDraft): ExamAnswerResult {
  const whole = parseField(draft.mixedAnswer.whole);
  const numerator = parseField(draft.mixedAnswer.numerator);
  const denominator = parseField(draft.mixedAnswer.denominator);
  if (whole === null || numerator === null || denominator === null) {
    return { ok: false, error: EMPTY_ANSWER_ERROR };
  }
  if (denominator === 0) {
    return { ok: false, error: 'El denominador no puede ser 0.' };
  }
  return { ok: true, answer: { whole, numerator, denominator } };
}

function remainderAnswer(draft: ExamAnswerDraft): ExamAnswerResult {
  const quotient = parseField(draft.remainderAnswer.quotient);
  const remainder = parseField(draft.remainderAnswer.remainder);
  if (quotient === null || remainder === null) {
    return { ok: false, error: EMPTY_ANSWER_ERROR };
  }
  return { ok: true, answer: { quotient, remainder } };
}

function textAnswer(draft: ExamAnswerDraft): ExamAnswerResult {
  const value = draft.userAnswer.trim();
  if (value === '') {
    return { ok: false, error: EMPTY_ANSWER_ERROR };
  }
  return { ok: true, answer: value };
}

/**
 * Convierte los campos de la pregunta actual en la respuesta registrada,
 * con las mismas ramas por tipo de problema que el render compartido
 * (ProblemBody). Devuelve error en castellano si falta o es inválida.
 */
export function collectExamAnswer(problem: Problem, draft: ExamAnswerDraft): ExamAnswerResult {
  if (isMixedNumberProblem(problem)) {
    return mixedAnswer(draft);
  }
  if (isFractionProblem(problem)) {
    return fractionAnswer(draft);
  }
  if (isRemainderProblem(problem)) {
    return remainderAnswer(draft);
  }
  if (isMixedNumberConvertProblem(problem)) {
    return 'whole' in problem.answer ? mixedAnswer(draft) : fractionAnswer(draft);
  }
  if (isConversionProblem(problem)) {
    return problem.operation === 'decimal-to-fraction' ? fractionAnswer(draft) : textAnswer(draft);
  }
  if (isFractionPercentProblem(problem)) {
    return typeof problem.answer === 'number' ? textAnswer(draft) : fractionAnswer(draft);
  }
  if (isFactorizationProblem(problem)) {
    const value = draft.userAnswer.trim();
    if (value === '') {
      return { ok: false, error: EMPTY_ANSWER_ERROR };
    }
    const normalized = normalizeFactorizationAnswer(value);
    return normalized
      ? { ok: true, answer: normalized }
      : { ok: false, error: 'Revisa los factores antes de continuar.' };
  }
  // Numéricos, de enunciado libre y opción múltiple: la respuesta es texto.
  return textAnswer(draft);
}

// — Resultado (solo al terminar) —

/** Formato legible de una respuesta registrada (para el resumen). */
export function formatExamAnswer(answer: SerializedAnswer | undefined): string {
  if (answer === null || answer === undefined) {
    return '—';
  }
  if (typeof answer === 'number') {
    return formatMathNumber(answer);
  }
  if (typeof answer === 'string') {
    return answer.trim() === '' ? '—' : answer;
  }
  if ('quotient' in answer) {
    return formatRemainderAnswer(answer);
  }
  if ('whole' in answer) {
    return formatMixedNumber(answer);
  }
  return `${answer.numerator}/${answer.denominator}`;
}

function isAnswerCorrect(problem: Problem, answer: SerializedAnswer): boolean {
  if (answer === null || answer === undefined) {
    return false;
  }
  const value: string | Fraction | MixedNumber | RemainderAnswer =
    typeof answer === 'number' ? String(answer) : answer;
  return answersMatch(problem, value);
}

/**
 * Calcula el resultado del examen terminado. Se evalúa aquí, no durante la
 * prueba: hasta FINISH_EXAM nada sabe si las respuestas son correctas.
 */
export function buildExamResult(exam: ExamState, options: { id?: string; date?: string } = {}): ExamResult {
  const entries: ExamResultEntry[] = exam.questions.map((question, index) => {
    const userAnswer = exam.answers[index] ?? null;
    return {
      skillId: question.skillId,
      skillName: question.skillName,
      question: problemSpeechText(question.problem),
      userAnswer: formatExamAnswer(userAnswer),
      correctAnswer: formatProblemAnswer(question.problem),
      isCorrect: isAnswerCorrect(question.problem, userAnswer),
    };
  });
  return {
    id: options.id ?? `examen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: options.date ?? new Date().toISOString(),
    correct: entries.filter((entry) => entry.isCorrect).length,
    total: entries.length,
    entries,
  };
}

// — Resultados en local (MVP: solo dispositivo, una clave por usuario) —

const STORAGE_PREFIX = 'pitagoritas.examResults.';
/** Resultados guardados como máximo por usuario. */
export const EXAM_RESULTS_MAX = 20;

const hasWindow = typeof window !== 'undefined';

export function examResultsStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function parseExamResults(raw: unknown): ExamResult[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter(
    (item): item is ExamResult =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as ExamResult).id === 'string' &&
      typeof (item as ExamResult).date === 'string' &&
      typeof (item as ExamResult).correct === 'number' &&
      typeof (item as ExamResult).total === 'number' &&
      Array.isArray((item as ExamResult).entries),
  );
}

export function loadExamResults(userId: string): ExamResult[] {
  if (!hasWindow) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(examResultsStorageKey(userId));
    return raw ? parseExamResults(JSON.parse(raw)) : [];
  } catch (error) {
    logger.error('No se pudieron leer los resultados de examen locales', error);
    return [];
  }
}

/** Guarda el resultado de un examen terminado (local, idempotente por id). */
export function saveExamResult(userId: string, result: ExamResult): void {
  if (!hasWindow) {
    return;
  }
  const results = loadExamResults(userId);
  if (results.some((entry) => entry.id === result.id)) {
    return;
  }
  const next = [result, ...results].slice(0, EXAM_RESULTS_MAX);
  try {
    window.localStorage.setItem(examResultsStorageKey(userId), JSON.stringify(next));
  } catch (error) {
    logger.error('No se pudo guardar el resultado del examen local', error);
  }
}
