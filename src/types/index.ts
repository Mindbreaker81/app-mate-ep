export type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division' | 'fraction-addition' | 'fraction-subtraction';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type Fraction = {
  numerator: number;
  denominator: number;
};

export type FractionProblem = {
  num1: Fraction;
  num2: Fraction;
  operation: 'fraction-addition' | 'fraction-subtraction';
  answer: Fraction;
  explanation: string;
};

export type Problem =
  | {
      num1: number;
      num2: number;
      operation: 'addition' | 'subtraction' | 'multiplication' | 'division';
      answer: number;
      explanation: string;
    }
  | {
      num1: Fraction;
      num2: Fraction;
      operation: 'fraction-addition' | 'fraction-subtraction';
      answer: Fraction;
      explanation: string;
    };

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
  operations: string[];
  maxNumber: number;
  unlocked: boolean;
}

export interface GameState {
  currentProblem: Problem | null;
  userAnswer: string | Fraction;
  isCorrect: boolean | null;
  score: number;
  maxScore: number;
  level: number;
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

export interface OperationStats {
  addition: OperationDetail;
  subtraction: OperationDetail;
  multiplication: OperationDetail;
  division: OperationDetail;
}

export interface OperationDetail {
  total: number;
  correct: number;
  averageTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface DifficultyStats {
  easy: { total: number; correct: number; };
  medium: { total: number; correct: number; };
  hard: { total: number; correct: number; };
}

export interface SessionRecord {
  date: Date;
  score: number;
  totalExercises: number;
  correctExercises: number;
  averageTime: number;
  operations: string[];
}

export type PracticeMode = 'all' | 'addition' | 'subtraction' | 'multiplication' | 'division' | 'fractions';

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
  | { type: 'CHECK_ANSWER' }
  | { type: 'NEXT_PROBLEM' }
  | { type: 'RESET_GAME' }
  | { type: 'UNLOCK_ACHIEVEMENT'; payload: Achievement }
  | { type: 'UPDATE_STREAK'; payload: number }
  | { type: 'UPDATE_STATS'; payload: Partial<DetailedStats> }
  | { type: 'SET_PRACTICE_MODE'; payload: PracticeMode }
  | { type: 'SET_TIME_MODE'; payload: TimeMode }
  | { type: 'UPDATE_TIMER'; payload: number }
  | { type: 'START_TIMER' }
  | { type: 'STOP_TIMER' }; 