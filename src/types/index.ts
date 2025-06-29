export type Operation = 'add' | 'sub' | 'mul' | 'div';

export interface Problem {
  question: string;
  answer: number;
  steps: string[];
  operation: Operation;
}

export interface GameState {
  currentProblem: Problem | null;
  score: number;
  maxScore: number;
  isCorrect: boolean | null;
  showSolution: boolean;
  userAnswer: string;
}

export type GameAction =
  | { type: 'GENERATE_PROBLEM'; payload: Problem }
  | { type: 'SUBMIT_ANSWER'; payload: { answer: string; isCorrect: boolean } }
  | { type: 'SHOW_SOLUTION' }
  | { type: 'NEXT_PROBLEM' }
  | { type: 'LOAD_MAX_SCORE'; payload: number }
  | { type: 'RESET_GAME' }; 