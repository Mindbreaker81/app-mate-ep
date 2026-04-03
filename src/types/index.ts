export const OPERATION_KEYS = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
  'fraction-addition',
  'fraction-subtraction',
  'fraction-multiplication',
  'fraction-division',
  'decimal-addition',
  'decimal-subtraction',
  'decimal-multiplication',
  'decimal-division',
  'mixed',
  'power',
  'percentage',
  'estimation',
  'factorization',
] as const;

export type Operation = (typeof OPERATION_KEYS)[number];
export type GradeId = '4t' | '5e';
export type Difficulty = 'easy' | 'medium' | 'hard';

export type Fraction = {
  numerator: number;
  denominator: number;
};

export type NumericOperation =
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'division'
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
  operation: NumericOperation;
  answer: number;
  explanation: string;
}

export interface FractionProblem {
  num1: Fraction;
  num2: Fraction;
  operation: FractionOperation;
  answer: Fraction;
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

export type Problem =
  | NumericProblem
  | FractionProblem
  | MixedProblem
  | PowerProblem
  | PercentageProblem
  | EstimationProblem
  | FactorizationProblem;

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
  userAnswer: string | Fraction;
  isCorrect: boolean | null;
  score: number;
  maxScore: number;
  level: number;
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
}

export type SerializedAnswer = number | string | Fraction | null;

export interface AttemptPayload {
  operation: Operation;
  level: number;
  practiceMode: PracticeMode;
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
  | 'factorization';

export interface PracticeModeConfig {
  mode: PracticeMode;
  label: string;
  icon: string;
  description: string;
}

export type TimeMode = 'no-limit' | '30s' | '1min' | '2min';

export interface TimeModeConfig {
  mode: TimeMode;
  label: string;
  seconds: number;
  description: string;
}

export type GameAction =
  | { type: 'SET_PROBLEM'; payload: Problem }
  | { type: 'SET_ANSWER'; payload: string | Fraction }
  | {
      type: 'CHECK_ANSWER';
      payload: {
        isCorrect: boolean;
        timeSpent: number;
        difficulty: Difficulty;
        userAnswer: SerializedAnswer;
        problem: Problem;
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
  | { type: 'UPDATE_TIMER'; payload: number }
  | { type: 'START_TIMER' }
  | { type: 'STOP_TIMER' };