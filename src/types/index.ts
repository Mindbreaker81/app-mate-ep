export const OPERATION_KEYS = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
  'division-remainder',
  'fraction-addition',
  'fraction-subtraction',
  'fraction-multiplication',
  'fraction-division',
  'mixed-number-addition',
  'mixed-number-subtraction',
  'mixed-number-convert',
  'fraction-to-decimal',
  'decimal-to-fraction',
  'compare-fractions',
  'compare-decimals',
  'compare-fraction-decimal',
  'order-values',
  'decimal-addition',
  'decimal-subtraction',
  'decimal-multiplication',
  'decimal-division',
  'mixed',
  'power',
  'square-root',
  'percentage',
  'estimation',
  'factorization',
  'gcd',
  'lcm',
  'word-problem',
  'mean',
  'perimeter-rectangle',
  'perimeter-square',
  'area-rectangle',
  'area-triangle',
  'angle-type',
  'unit-conversion',
  'round-decimal',
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
  'circle-area',
  'circle-circumference',
  'volume-rectangular-prism',
  'triangle-angle-sum',
  'scale-conversion',
  'place-value',
  'sequence',
  'proportionality-check',
  'finance',
  'probability-compare',
  'two-step-equation',
  'inverse-proportion',
] as const;

export type Operation = (typeof OPERATION_KEYS)[number];
export type GradeId = '4t' | '5e' | '6e';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ComparisonOperator = '<' | '>' | '=';
export type AngleType = 'agudo' | 'recto' | 'obtuso';
export type LevelMode = 'auto' | 'manual';

export type Fraction = {
  numerator: number;
  denominator: number;
};

export type MixedNumber = {
  whole: number;
  numerator: number;
  denominator: number;
};

export type RemainderAnswer = {
  quotient: number;
  remainder: number;
};

export type NumericOperation =
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'division'
  | 'division-remainder'
  | 'decimal-addition'
  | 'decimal-subtraction'
  | 'decimal-multiplication'
  | 'decimal-division';

export type FractionOperation =
  | 'fraction-addition'
  | 'fraction-subtraction'
  | 'fraction-multiplication'
  | 'fraction-division';

export interface NumericProblem {
  num1: number;
  num2: number;
  operation: Exclude<NumericOperation, 'division-remainder'>;
  answer: number;
  explanation: string;
}

export interface RemainderProblem {
  num1: number;
  num2: number;
  operation: 'division-remainder';
  answer: RemainderAnswer;
  explanation: string;
}

export interface FractionProblem {
  num1: Fraction;
  num2: Fraction;
  operation: FractionOperation;
  answer: Fraction;
  explanation: string;
}

export interface MixedNumberProblem {
  num1: MixedNumber;
  num2: MixedNumber;
  operation: 'mixed-number-addition' | 'mixed-number-subtraction';
  answer: MixedNumber;
  explanation: string;
}

export interface MixedNumberConvertProblem {
  prompt: string;
  operation: 'mixed-number-convert';
  answer: MixedNumber | Fraction;
  explanation: string;
}

export interface ConversionProblem {
  prompt: string;
  operation: 'fraction-to-decimal' | 'decimal-to-fraction';
  answer: number | Fraction;
  explanation: string;
}

export interface CompareProblem {
  prompt: string;
  operation: 'compare-fractions' | 'compare-decimals' | 'compare-fraction-decimal';
  answer: ComparisonOperator;
  explanation: string;
}

export interface OrderValuesProblem {
  prompt: string;
  values: string[];
  options: string[];
  operation: 'order-values';
  answer: string;
  explanation: string;
}

export type MixedToken = number | '+' | '-' | '×' | '÷' | '(' | ')';

export interface MixedProblem {
  expression: string;
  tokens: MixedToken[];
  operation: 'mixed';
  answer: number;
  explanation: string;
}

export interface PowerProblem {
  base: number;
  exponent: 2 | 3;
  operation: 'power';
  answer: number;
  explanation: string;
}

export interface SquareRootProblem {
  radicand: number;
  operation: 'square-root';
  answer: number;
  explanation: string;
}

export interface PercentageProblem {
  prompt: string;
  operation: 'percentage';
  answer: number;
  explanation: string;
}

export interface EstimationProblem {
  prompt: string;
  options: number[];
  operation: 'estimation';
  answer: number;
  explanation: string;
}

export interface FactorizationProblem {
  target: number;
  operation: 'factorization';
  answer: string;
  explanation: string;
}

export interface GcdLcmProblem {
  prompt: string;
  num1: number;
  num2: number;
  operation: 'gcd' | 'lcm';
  answer: number;
  explanation: string;
}

export interface WordProblem {
  prompt: string;
  operation: 'word-problem';
  answer: number;
  explanation: string;
}

export interface MeanProblem {
  prompt: string;
  values: number[];
  operation: 'mean';
  answer: number;
  explanation: string;
}

export interface GeometryProblem {
  prompt: string;
  operation: 'perimeter-rectangle' | 'perimeter-square' | 'area-rectangle' | 'area-triangle';
  answer: number;
  explanation: string;
}

export interface AngleProblem {
  prompt: string;
  degrees: number;
  operation: 'angle-type';
  answer: AngleType;
  options: AngleType[];
  explanation: string;
}

export interface UnitConversionProblem {
  prompt: string;
  operation: 'unit-conversion';
  answer: number;
  explanation: string;
}

export interface RoundDecimalProblem {
  prompt: string;
  value: number;
  precision: 'tenth' | 'hundredth';
  operation: 'round-decimal';
  answer: number;
  explanation: string;
}

export interface IntegerArithmeticProblem {
  display: string;
  num1: number;
  num2: number;
  operation: 'integer-addition' | 'integer-subtraction' | 'integer-multiplication' | 'integer-division';
  answer: number;
  explanation: string;
}

export interface IntegerCompareProblem {
  prompt: string;
  operation: 'integer-compare';
  answer: ComparisonOperator;
  explanation: string;
}

export interface IntegerOrderProblem {
  prompt: string;
  values: string[];
  options: string[];
  operation: 'integer-order';
  answer: string;
  explanation: string;
}

export interface SimpleEquationProblem {
  prompt: string;
  operation: 'simple-equation';
  answer: number;
  explanation: string;
}

export interface RatioProblem {
  prompt: string;
  operation: 'ratio' | 'proportion';
  answer: number;
  explanation: string;
}

export interface MedianProblem {
  prompt: string;
  values: number[];
  operation: 'median';
  answer: number;
  explanation: string;
}

export interface ModeProblem {
  prompt: string;
  values: number[];
  operation: 'mode';
  answer: number;
  explanation: string;
}

export interface RangeProblem {
  prompt: string;
  values: number[];
  operation: 'range';
  answer: number;
  explanation: string;
}

export interface ProbabilityProblem {
  prompt: string;
  options: number[];
  operation: 'probability-simple';
  answer: number;
  /** Casos favorables, para aceptar también la respuesta en forma de fracción. */
  favorable?: number;
  /** Total de casos posibles. */
  total?: number;
  explanation: string;
}

export interface CircleProblem {
  prompt: string;
  radius: number;
  piValue: number;
  operation: 'circle-area' | 'circle-circumference';
  answer: number;
  explanation: string;
}

export interface VolumeProblem {
  prompt: string;
  operation: 'volume-rectangular-prism';
  answer: number;
  explanation: string;
}

export interface TriangleAngleProblem {
  prompt: string;
  operation: 'triangle-angle-sum';
  answer: number;
  explanation: string;
}

export interface ScaleProblem {
  prompt: string;
  operation: 'scale-conversion';
  answer: number;
  explanation: string;
}

/** Valor posicional: ¿cuánto vale la cifra destacada? (hasta milésimas). */
export interface PlaceValueProblem {
  prompt: string;
  operation: 'place-value';
  answer: number;
  explanation: string;
}

/** Secuencias: siguiente término. */
export interface SequenceProblem {
  prompt: string;
  operation: 'sequence';
  answer: number;
  explanation: string;
}

/** Proporcionalidad: ¿es situación proporcional? (opción múltiple sí/no). */
export interface ProportionalityProblem {
  prompt: string;
  options: string[];
  operation: 'proportionality-check';
  answer: string;
  explanation: string;
}

/** Finanzas: IVA, mejor precio, rebajas e interés simple. */
export interface FinanceProblem {
  prompt: string;
  operation: 'finance';
  answer: number;
  explanation: string;
}

/** Comparación cualitativa de probabilidades (opción múltiple). */
export interface ProbabilityCompareProblem {
  prompt: string;
  options: string[];
  operation: 'probability-compare';
  answer: string;
  explanation: string;
}

/** Puente T3 (Ampliació ESO): ecuaciones de dos pasos. */
export interface TwoStepEquationProblem {
  prompt: string;
  operation: 'two-step-equation';
  answer: number;
  explanation: string;
}

/** Puente T3 (Ampliació ESO): proporcionalidad inversa. */
export interface InverseProportionProblem {
  prompt: string;
  operation: 'inverse-proportion';
  answer: number;
  explanation: string;
}

export type Problem =
  | NumericProblem
  | RemainderProblem
  | FractionProblem
  | MixedNumberProblem
  | MixedNumberConvertProblem
  | ConversionProblem
  | CompareProblem
  | OrderValuesProblem
  | MixedProblem
  | PowerProblem
  | SquareRootProblem
  | PercentageProblem
  | EstimationProblem
  | FactorizationProblem
  | GcdLcmProblem
  | WordProblem
  | MeanProblem
  | GeometryProblem
  | AngleProblem
  | UnitConversionProblem
  | RoundDecimalProblem
  | IntegerArithmeticProblem
  | IntegerCompareProblem
  | IntegerOrderProblem
  | SimpleEquationProblem
  | RatioProblem
  | MedianProblem
  | ModeProblem
  | RangeProblem
  | ProbabilityProblem
  | CircleProblem
  | VolumeProblem
  | TriangleAngleProblem
  | ScaleProblem
  | PlaceValueProblem
  | SequenceProblem
  | ProportionalityProblem
  | FinanceProblem
  | ProbabilityCompareProblem
  | TwoStepEquationProblem
  | InverseProportionProblem;

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface Level {
  id: number;
  name: string;
  minScore: number;
  operations: Operation[];
  maxNumber: number;
  maxNumberMult: number;
  maxNumberDiv: number;
  maxDenominator: number;
  maxDecimalWhole: number;
  maxDecimalPlaces: number;
  maxPowerBase: number;
  maxPercentageBase: number;
  maxEstimationValue: number;
  maxFactorizationNumber: number;
  maxMixedFractionWhole?: number;
  maxGeometrySide?: number;
  maxUnitValue?: number;
  meanDataPoints?: number;
  maxIntegerAbsolute?: number;
  maxCircleRadius?: number;
  maxEquationValue?: number;
  unlocked?: boolean;
}

export interface GradeConfig {
  id: GradeId;
  name: string;
  description: string;
  availableOperations: Operation[];
  availablePracticeModes: PracticeMode[];
}

export interface UserProfile {
  id: string;
  username: string;
  avatar: string | null;
  created_at: string;
}

export interface GameState {
  currentProblem: Problem | null;
  userAnswer: string | Fraction | MixedNumber | RemainderAnswer;
  isCorrect: boolean | null;
  score: number;
  maxScore: number;
  level: number;
  levelMode: LevelMode;
  manualLevel: number;
  grade: GradeId;
  achievements: Achievement[];
  streak: number;
  bestStreak: number;
  totalExercises: number;
  correctExercises: number;
  stats: DetailedStats;
  practiceMode: PracticeMode;
  timeMode: TimeMode;
  timeRemaining: number;
  isTimerActive: boolean;
  timedCorrectExercises: number;
  /** Logro desbloqueado en la última respuesta, para mostrarlo como toast. */
  recentAchievement: Achievement | null;
  /** Ejercicios hechos hoy (meta diaria). */
  daily: DailyProgress | null;
  /** Días (YYYY-MM-DD) con al menos un ejercicio, para la racha de días. */
  practiceDays: string[];
  /** Progreso por habilidad del camino de aprendizaje. */
  skillProgress: Record<string, SkillProgress>;
  /** Sesión diaria en curso: ids de habilidad pendientes tras la actual ([] = agotada). */
  dailySession: string[] | null;
  /** Ejercicios respondidos dentro de la sesión diaria en curso. */
  sessionDone: number;
  /** Día local (YYYY-MM-DD) al que pertenece la sesión; se reinicia al cambiar de día. */
  sessionDate: string | null;
  /** Habilidad que se está practicando desde «Mi camino» (para mostrarla en el ejercicio). */
  pathSkillId: string | null;
}

export type SerializedAnswer =
  | number
  | string
  | Fraction
  | MixedNumber
  | RemainderAnswer
  | null;

export interface AttemptPayload {
  operation: Operation;
  level: number;
  practiceMode: PracticeMode;
  grade: GradeId;
  isCorrect: boolean;
  timeSpent: number;
  userAnswer: SerializedAnswer;
  correctAnswer: SerializedAnswer;
  createdAt: string;
}

export interface PendingAttempt extends AttemptPayload {
  id: string;
  retryCount: number;
}

export interface LegacySnapshot {
  stats: DetailedStats;
  totalExercises: number;
  correctExercises: number;
  level: number;
  practiceMode: PracticeMode;
  grade?: GradeId;
}

export interface DetailedStats {
  weeklyProgress: WeeklyProgress[];
  averageTime: number;
  operationStats: OperationStats;
  difficultyStats: DifficultyStats;
  sessionHistory: SessionRecord[];
}

export interface WeeklyProgress {
  week: string;
  correctAnswers: number;
  totalAnswers: number;
  averageTime: number;
}

export type OperationKey = Operation;

/** Estado de una habilidad en el camino de aprendizaje. */
export type SkillState = 'locked' | 'practicing' | 'dominated' | 'review';

/** Progreso de una habilidad (persistido dentro de game_state.data, sin migración). */
export interface SkillProgress {
  /** Estado guardado ('practicing' | 'dominated' | 'review'); 'locked' se deriva. */
  state: Exclude<SkillState, 'locked'>;
  /** Resultados de la ventana reciente (máx. 12), del más antiguo al más nuevo. */
  recentResults: boolean[];
  /** Aciertos seguidos al primer intento (para subir de nivel). */
  streakCorrect: number;
  /** Fallos seguidos (para bajar de nivel). */
  streakWrong: number;
  /** Días (YYYY-MM-DD) con actividad en esta habilidad. */
  activeDays: string[];
  /** Fecha (YYYY-MM-DD) en la que toca repaso, si la habilidad está dominada. */
  reviewDueDate: string | null;
  /** Repasos completados (índice dentro de los intervalos de repaso). */
  reviewCount: number;
  /** Nivel 1–3 dentro de la habilidad. */
  level: number;
  /** Sello temporal del último cambio, para fusionar local y remoto. */
  updatedAt: string;
}

export type OperationStats = Record<OperationKey, OperationDetail>;

export interface OperationDetail {
  total: number;
  correct: number;
  averageTime: number;
  difficulty: Difficulty;
}

export interface DifficultyStats {
  easy: { total: number; correct: number };
  medium: { total: number; correct: number };
  hard: { total: number; correct: number };
}

export interface SessionRecord {
  date: Date;
  score: number;
  totalExercises: number;
  correctExercises: number;
  averageTime: number;
  operations: string[];
}

export type PracticeMode =
  | 'all'
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'division'
  | 'fractions'
  | 'mixed'
  | 'decimals'
  | 'powers'
  | 'percentages'
  | 'estimation'
  | 'factorization'
  | 'word-problems'
  | 'comparison'
  | 'conversions'
  | 'number-theory'
  | 'geometry'
  | 'units'
  | 'statistics'
  | 'rounding'
  | 'integers'
  | 'equations'
  | 'ratios'
  | 'probability'
  | 'geometry-advanced'
  | 'scales'
  | 'number-sense'
  | 'finance';

export interface PracticeModeConfig {
  mode: PracticeMode;
  label: string;
  icon: string;
  description: string;
  category?: PracticeModeCategory;
}

export type PracticeModeCategory =
  | 'basic'
  | 'fractions-decimals'
  | 'advanced'
  | 'application'
  | 'sixth-grade-core'
  | 'sixth-grade-applied';

export type TimeMode = 'no-limit' | '30s' | '1min' | '2min';

export interface TimeModeConfig {
  mode: TimeMode;
  label: string;
  seconds: number;
  description: string;
}

/** Contador de ejercicios del día (fecha local YYYY-MM-DD). */
export interface DailyProgress {
  date: string;
  count: number;
}

/** Estado de juego que viaja a Supabase (tabla game_state) para seguir al usuario entre dispositivos. */
export interface PersistedGameState {
  maxScore: number;
  bestStreak: number;
  totalExercises: number;
  correctExercises: number;
  timedCorrectExercises: number;
  achievements: Achievement[];
  daily?: DailyProgress | null;
  practiceDays?: string[];
  /** Progreso por habilidad del camino de aprendizaje (game_state.data, sin migración). */
  skills?: Record<string, SkillProgress>;
}

/**
 * Sesión diaria reanudable de «Mi camino». Es efímera y propia del dispositivo:
 * se guarda en localStorage por usuario (no viaja a Supabase ni a otros
 * dispositivos) y solo se restaura el mismo día local.
 */
export interface DailySessionSnapshot {
  /** Día local (YYYY-MM-DD) al que pertenece la sesión. */
  date: string;
  /** Habilidad del camino en curso. */
  skillId: string | null;
  /** Habilidades pendientes tras la actual ([] = cola agotada). */
  queue: string[];
  /** Ejercicios respondidos dentro de la sesión. */
  done: number;
}

export type GameAction =
  | { type: 'SET_PROBLEM'; payload: Problem }
  | { type: 'SET_ANSWER'; payload: string | Fraction | MixedNumber | RemainderAnswer }
  | {
      type: 'CHECK_ANSWER';
      payload: {
        isCorrect: boolean;
        timeSpent: number;
        difficulty: Difficulty;
        userAnswer: SerializedAnswer;
        problem: Problem;
        /** true si es el primer intento de este ejercicio (evidencia de dominio). */
        isFirstTry?: boolean;
      };
    }
  | { type: 'NEXT_PROBLEM' }
  | { type: 'RESET_GAME' }
  | { type: 'UNLOCK_ACHIEVEMENT'; payload: Achievement }
  | { type: 'UPDATE_STREAK'; payload: number }
  | { type: 'UPDATE_STATS'; payload: Partial<DetailedStats> }
  | { type: 'SET_STATS'; payload: DetailedStats }
  | { type: 'SET_GRADE'; payload: GradeId }
  | { type: 'SET_PRACTICE_MODE'; payload: PracticeMode }
  | { type: 'SET_TIME_MODE'; payload: TimeMode }
  | { type: 'SET_LEVEL_MODE'; payload: LevelMode }
  | { type: 'SET_MANUAL_LEVEL'; payload: number }
  | { type: 'INIT_SKILL_PROGRESS'; payload: Record<string, SkillProgress> }
  | { type: 'MERGE_SKILL_PROGRESS'; payload: Record<string, SkillProgress> }
  | { type: 'START_DAILY_SESSION'; payload: string[] }
  | { type: 'CANCEL_DAILY_SESSION' }
  | { type: 'RESTORE_DAILY_SESSION'; payload: DailySessionSnapshot | null }
  | { type: 'CHECK_SESSION_DAY' }
  | { type: 'SET_PATH_SKILL'; payload: string | null }
  | { type: 'UPDATE_TIMER'; payload: number }
  | { type: 'START_TIMER' }
  | { type: 'STOP_TIMER' }
  | { type: 'HYDRATE_PERSISTED'; payload: PersistedGameState };
