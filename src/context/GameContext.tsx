import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import type {
  GameState,
  GameAction,
  Fraction,
  GradeId,
  PracticeMode,
  TimeMode,
  Problem,
  AttemptPayload,
  SerializedAnswer,
  LegacySnapshot,
  DetailedStats,
} from '../types';
import { generateProblem, getDifficulty } from '../utils/problemGenerator';
import { LEVELS, ACHIEVEMENTS, getGradeConfig } from '../utils/gameConfig';
import { initializeStats, updateWeeklyProgress, updateOperationStats, updateDifficultyStats, normalizeStats } from '../utils/statsUtils';
import { getTimeModeConfig } from '../utils/timeConfig';
import { useAuth } from './AuthContext';
import { recordAttemptDirect, flushQueue, migrateLegacyData } from '../services/attemptService';
import { fetchUserStats } from '../services/statsService';
import { simplifyFraction, fractionEquals } from '../utils/fractionUtils';
import { logger } from '../utils/logger';
import { numbersEqual } from '../utils/mathUtils';
import { isFactorizationProblem, isFractionProblem, normalizeFactorizationAnswer } from '../utils/problemUtils';

type CheckAnswerPayload = Extract<GameAction, { type: 'CHECK_ANSWER' }>['payload'];

const STORAGE_KEYS = {
  maxScore: 'maxScore',
  achievements: 'achievements',
  bestStreak: 'bestStreak',
  totalExercises: 'totalExercises',
  correctExercises: 'correctExercises',
  stats: 'stats',
  grade: 'grade',
} as const;

const hasWindow = typeof window !== 'undefined';

function readStoredNumber(key: string, fallback = 0): number {
  if (!hasWindow) {
    return fallback;
  }

  const value = window.localStorage.getItem(key);
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function readStoredJson<T>(key: string, fallback: T): T {
  if (!hasWindow) {
    return fallback;
  }

  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch (error) {
    logger.warn(`No se pudo leer ${key} desde localStorage.`, error);
    return fallback;
  }
}

function readStoredGrade(): GradeId {
  if (!hasWindow) {
    return '4t';
  }

  const stored = window.localStorage.getItem(STORAGE_KEYS.grade);
  return stored === '5e' ? '5e' : '4t';
}

const loadStats = (): DetailedStats => normalizeStats(readStoredJson(STORAGE_KEYS.stats, initializeStats()));

function getModeSeconds(mode: TimeMode): number {
  return getTimeModeConfig(mode).seconds;
}

function calculateTimeSpent(timeMode: TimeMode, timeRemaining: number): number {
  const totalSeconds = getModeSeconds(timeMode);
  if (!totalSeconds) return 0;
  return Math.max(0, totalSeconds - timeRemaining);
}

function parseNumericAnswer(answer: string | Fraction): number | null {
  if (typeof answer === 'number') {
    return answer;
  }

  if (typeof answer !== 'string') {
    return null;
  }

  const normalized = answer.trim().replace(',', '.');
  if (!normalized) {
    return null;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}

function hasAnswerValue(answer: string | Fraction): boolean {
  if (typeof answer === 'string') {
    return answer.trim().length > 0;
  }

  return true;
}

function buildCheckAnswerPayload(params: {
  currentProblem: GameState['currentProblem'];
  userAnswer: GameState['userAnswer'];
  level: GameState['level'];
  timeMode: GameState['timeMode'];
  timeRemaining: GameState['timeRemaining'];
}): CheckAnswerPayload {
  const { currentProblem, userAnswer: rawUserAnswer, level, timeMode, timeRemaining } = params;

  if (!currentProblem) {
    throw new Error('No hay un problema activo para evaluar.');
  }

  const problem = currentProblem;
  let normalizedAnswer: SerializedAnswer = null;
  let isCorrect = false;

  if (isFactorizationProblem(problem)) {
    if (typeof rawUserAnswer === 'string') {
      normalizedAnswer = normalizeFactorizationAnswer(rawUserAnswer);
      isCorrect = normalizedAnswer === problem.answer;
    }
  } else if (isFractionProblem(problem)) {
    if (typeof rawUserAnswer === 'object') {
      normalizedAnswer = simplifyFraction(rawUserAnswer);
      isCorrect = fractionEquals(problem.answer, rawUserAnswer);
    } else if (typeof rawUserAnswer === 'string' && rawUserAnswer.includes('/')) {
      const [numeratorStr, denominatorStr] = rawUserAnswer.split('/');
      const numerator = Number.parseInt(numeratorStr, 10);
      const denominator = Number.parseInt(denominatorStr, 10);

      if (!Number.isNaN(numerator) && !Number.isNaN(denominator) && denominator !== 0) {
        const parsedFraction = simplifyFraction({ numerator, denominator });
        normalizedAnswer = parsedFraction;
        isCorrect = fractionEquals(problem.answer, parsedFraction);
      }
    }
  } else {
    const numericAnswer = parseNumericAnswer(rawUserAnswer);
    if (numericAnswer !== null) {
      normalizedAnswer = numericAnswer;
      isCorrect = numbersEqual(numericAnswer, problem.answer);
    }
  }

  const timeSpent = calculateTimeSpent(timeMode, timeRemaining);
  const difficulty = getDifficulty(level, problem.operation);

  return {
    isCorrect,
    timeSpent,
    difficulty,
    userAnswer: normalizedAnswer,
    problem,
  };
}

function buildAttemptPayload(level: number, practiceMode: PracticeMode, payload: CheckAnswerPayload): AttemptPayload {
  const correctAnswer: SerializedAnswer = isFractionProblem(payload.problem)
    ? simplifyFraction(payload.problem.answer)
    : payload.problem.answer;

  return {
    operation: payload.problem.operation,
    level,
    practiceMode,
    isCorrect: payload.isCorrect,
    timeSpent: payload.timeSpent,
    userAnswer: payload.userAnswer,
    correctAnswer,
    createdAt: new Date().toISOString(),
  };
}

const initialState: GameState = {
  currentProblem: null,
  userAnswer: '',
  isCorrect: null,
  score: 0,
  maxScore: readStoredNumber(STORAGE_KEYS.maxScore),
  level: 1,
  grade: readStoredGrade(),
  achievements: readStoredJson(STORAGE_KEYS.achievements, []),
  streak: 0,
  bestStreak: readStoredNumber(STORAGE_KEYS.bestStreak),
  totalExercises: readStoredNumber(STORAGE_KEYS.totalExercises),
  correctExercises: readStoredNumber(STORAGE_KEYS.correctExercises),
  stats: loadStats(),
  practiceMode: 'all',
  timeMode: 'no-limit',
  timeRemaining: 0,
  isTimerActive: false,
};

function createProblemForState(state: Pick<GameState, 'level' | 'practiceMode' | 'grade'>): Problem {
  return generateProblem(state.level, state.practiceMode, state.grade);
}

function getResetTimerState(timeMode: TimeMode): Pick<GameState, 'timeRemaining' | 'isTimerActive'> {
  const seconds = getModeSeconds(timeMode);
  return {
    timeRemaining: seconds,
    isTimerActive: timeMode !== 'no-limit',
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_PROBLEM':
      return {
        ...state,
        currentProblem: action.payload,
        userAnswer: '',
        isCorrect: null,
      };

    case 'SET_ANSWER':
      return {
        ...state,
        userAnswer: action.payload,
      };

    case 'CHECK_ANSWER': {
      const { isCorrect, timeSpent, difficulty, problem } = action.payload;
      if (!state.currentProblem) return state;

      const newScore = isCorrect ? state.score + 1 : state.score;
      const newMaxScore = Math.max(newScore, state.maxScore);
      const newStreak = isCorrect ? state.streak + 1 : 0;
      const newBestStreak = Math.max(newStreak, state.bestStreak);
      const newTotalExercises = state.totalExercises + 1;
      const newCorrectExercises = isCorrect ? state.correctExercises + 1 : state.correctExercises;

      let newStats = state.stats;
      newStats = updateWeeklyProgress(newStats, isCorrect, timeSpent);
      newStats = updateOperationStats(newStats, problem.operation, isCorrect, timeSpent, difficulty);
      newStats = updateDifficultyStats(newStats, difficulty, isCorrect);

      const newAchievements = [...state.achievements];
      const unlockedAchievements = ACHIEVEMENTS.filter((achievement) => {
        if (newAchievements.some((item) => item.id === achievement.id)) return false;

        switch (achievement.id) {
          case 'first_correct':
            return isCorrect && newCorrectExercises === 1;
          case 'addition_expert':
            return newStats.operationStats.addition.correct >= 10;
          case 'subtraction_expert':
            return newStats.operationStats.subtraction.correct >= 10;
          case 'multiplication_expert':
            return newStats.operationStats.multiplication.correct >= 10;
          case 'division_expert':
            return newStats.operationStats.division.correct >= 10;
          case 'streak_5':
            return newStreak >= 5;
          case 'streak_10':
            return newStreak >= 10;
          case 'score_50':
            return newScore >= 50;
          case 'perfect_20':
            return newStreak >= 20;
          default:
            return false;
        }
      });

      unlockedAchievements.forEach((achievement) => {
        newAchievements.push({
          ...achievement,
          unlocked: true,
          unlockedAt: new Date(),
        });
      });

      const newLevel =
        [...LEVELS].reverse().find((level) => level.minScore <= newScore)?.id ?? state.level;

      return {
        ...state,
        isCorrect,
        score: newScore,
        maxScore: newMaxScore,
        level: newLevel,
        achievements: newAchievements,
        streak: newStreak,
        bestStreak: newBestStreak,
        totalExercises: newTotalExercises,
        correctExercises: newCorrectExercises,
        stats: newStats,
        isTimerActive: false,
      };
    }

    case 'NEXT_PROBLEM':
      return {
        ...state,
        currentProblem: createProblemForState(state),
        userAnswer: '',
        isCorrect: null,
        ...getResetTimerState(state.timeMode),
      };

    case 'RESET_GAME':
      return {
        ...state,
        score: 0,
        streak: 0,
        currentProblem: createProblemForState(state),
        userAnswer: '',
        isCorrect: null,
        ...getResetTimerState(state.timeMode),
      };

    case 'UNLOCK_ACHIEVEMENT':
      return {
        ...state,
        achievements: [...state.achievements, action.payload],
      };

    case 'UPDATE_STREAK':
      return {
        ...state,
        streak: action.payload,
      };

    case 'UPDATE_STATS':
      return {
        ...state,
        stats: { ...state.stats, ...action.payload },
      };

    case 'SET_STATS':
      return {
        ...state,
        stats: action.payload,
      };

    case 'SET_GRADE': {
      const nextPracticeMode = getGradeConfig(action.payload).availablePracticeModes.includes(state.practiceMode)
        ? state.practiceMode
        : 'all';

      return {
        ...state,
        grade: action.payload,
        practiceMode: nextPracticeMode,
        currentProblem: generateProblem(state.level, nextPracticeMode, action.payload),
        userAnswer: '',
        isCorrect: null,
        ...getResetTimerState(state.timeMode),
      };
    }

    case 'SET_PRACTICE_MODE': {
      const nextPracticeMode = getGradeConfig(state.grade).availablePracticeModes.includes(action.payload)
        ? action.payload
        : 'all';

      return {
        ...state,
        practiceMode: nextPracticeMode,
        currentProblem: generateProblem(state.level, nextPracticeMode, state.grade),
        userAnswer: '',
        isCorrect: null,
        ...getResetTimerState(state.timeMode),
      };
    }

    case 'SET_TIME_MODE':
      return {
        ...state,
        timeMode: action.payload,
        currentProblem: createProblemForState(state),
        userAnswer: '',
        isCorrect: null,
        ...getResetTimerState(action.payload),
      };

    case 'UPDATE_TIMER':
      return {
        ...state,
        timeRemaining: action.payload,
      };

    case 'START_TIMER':
      return {
        ...state,
        isTimerActive: true,
      };

    case 'STOP_TIMER':
      return {
        ...state,
        isTimerActive: false,
      };

    default:
      return state;
  }
}

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  checkAnswer: (overrideAnswer?: string | Fraction) => void;
  nextProblem: () => void;
  resetGame: () => void;
  setAnswer: (answer: string | Fraction) => void;
  setGrade: (grade: GradeId) => void;
  setPracticeMode: (mode: PracticeMode) => void;
  setTimeMode: (mode: TimeMode) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const sessionUserId = session?.user?.id ?? null;
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkAnswerRef = useRef<(overrideAnswer?: string | Fraction) => void>(() => undefined);
  const currentProblemRef = useRef<GameState['currentProblem']>(state.currentProblem);
  const userAnswerRef = useRef<GameState['userAnswer']>(state.userAnswer);
  const syncedRef = useRef(false);
  const legacySnapshotRef = useRef<LegacySnapshot | null>(null);

  legacySnapshotRef.current = {
    stats: state.stats,
    totalExercises: state.totalExercises,
    correctExercises: state.correctExercises,
    level: state.level,
    practiceMode: state.practiceMode,
  };

  const checkAnswer = useCallback(
    (overrideAnswer?: string | Fraction) => {
      if (!state.currentProblem) return;

      const evaluation = buildCheckAnswerPayload({
        currentProblem: state.currentProblem,
        userAnswer: overrideAnswer ?? state.userAnswer,
        level: state.level,
        timeMode: state.timeMode,
        timeRemaining: state.timeRemaining,
      });

      dispatch({ type: 'CHECK_ANSWER', payload: evaluation });

      if (sessionUserId) {
        const attemptPayload = buildAttemptPayload(state.level, state.practiceMode, evaluation);
        void recordAttemptDirect(sessionUserId, attemptPayload);
      }
    },
    [
      state.currentProblem,
      state.userAnswer,
      state.level,
      state.practiceMode,
      state.timeMode,
      state.timeRemaining,
      sessionUserId,
    ],
  );

  useEffect(() => {
    checkAnswerRef.current = checkAnswer;
  }, [checkAnswer]);

  useEffect(() => {
    currentProblemRef.current = state.currentProblem;
    userAnswerRef.current = state.userAnswer;
  }, [state.currentProblem, state.userAnswer]);

  useEffect(() => {
    if (!state.isTimerActive || state.timeRemaining <= 0) {
      return undefined;
    }

    timerRef.current = setTimeout(() => {
      dispatch({ type: 'UPDATE_TIMER', payload: Math.max(0, state.timeRemaining - 1) });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [state.isTimerActive, state.timeRemaining]);

  useEffect(() => {
    if (!state.isTimerActive || state.timeRemaining !== 0) {
      return;
    }

    dispatch({ type: 'STOP_TIMER' });

    const latestAnswer = userAnswerRef.current;
    if (currentProblemRef.current && hasAnswerValue(latestAnswer)) {
      checkAnswerRef.current(latestAnswer);
    }
  }, [state.isTimerActive, state.timeRemaining]);

  useEffect(() => {
    if (!hasWindow) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEYS.maxScore, state.maxScore.toString());
      window.localStorage.setItem(STORAGE_KEYS.bestStreak, state.bestStreak.toString());
      window.localStorage.setItem(STORAGE_KEYS.totalExercises, state.totalExercises.toString());
      window.localStorage.setItem(STORAGE_KEYS.correctExercises, state.correctExercises.toString());
      window.localStorage.setItem(STORAGE_KEYS.achievements, JSON.stringify(state.achievements));
      window.localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(state.stats));
      window.localStorage.setItem(STORAGE_KEYS.grade, state.grade);
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    state.maxScore,
    state.bestStreak,
    state.totalExercises,
    state.correctExercises,
    state.achievements,
    state.stats,
    state.grade,
  ]);

  useEffect(() => {
    if (!state.currentProblem) {
      dispatch({ type: 'SET_PROBLEM', payload: generateProblem(state.level, state.practiceMode, state.grade) });
    }
  }, [state.currentProblem, state.level, state.practiceMode, state.grade]);

  useEffect(() => {
    if (!sessionUserId) {
      syncedRef.current = false;
      return;
    }

    if (syncedRef.current) {
      return;
    }

    syncedRef.current = true;
    const userId = sessionUserId;
    const snapshot = legacySnapshotRef.current;

    const sync = async () => {
      try {
        if (snapshot) {
          await migrateLegacyData(userId, snapshot);
        }
      } catch (error) {
        logger.warn('No se pudieron migrar los datos locales.', error);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      try {
        const remoteStats = await fetchUserStats(userId);
        if (remoteStats) {
          dispatch({ type: 'SET_STATS', payload: remoteStats });
        }
      } catch (error) {
        logger.error('[GameContext] Error al obtener estadísticas remotas.', error);
      }

      await flushQueue(userId);
    };

    void sync();
  }, [sessionUserId]);

  useEffect(() => {
    if (!sessionUserId || !hasWindow) {
      return;
    }

    const userId = sessionUserId;
    const handleOnline = () => {
      void flushQueue(userId);
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [sessionUserId]);

  const nextProblem = () => {
    dispatch({ type: 'NEXT_PROBLEM' });
  };

  const resetGame = () => {
    dispatch({ type: 'RESET_GAME' });
  };

  const setAnswer = (answer: string | Fraction) => {
    dispatch({ type: 'SET_ANSWER', payload: answer });
  };

  const setGrade = (grade: GradeId) => {
    dispatch({ type: 'SET_GRADE', payload: grade });
  };

  const setPracticeMode = (mode: PracticeMode) => {
    dispatch({ type: 'SET_PRACTICE_MODE', payload: mode });
  };

  const setTimeMode = (mode: TimeMode) => {
    dispatch({ type: 'SET_TIME_MODE', payload: mode });
  };

  const value: GameContextType = {
    state,
    dispatch,
    checkAnswer,
    nextProblem,
    resetGame,
    setAnswer,
    setGrade,
    setPracticeMode,
    setTimeMode,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}