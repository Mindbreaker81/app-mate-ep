import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import type {
  GameState,
  GameAction,
  Fraction,
  GradeId,
  LevelMode,
  MixedNumber,
  PracticeMode,
  RemainderAnswer,
  TimeMode,
  Problem,
  AttemptPayload,
  SerializedAnswer,
  LegacySnapshot,
  DetailedStats,
  PersistedGameState,
} from '../types';
import { generateProblem, getDifficulty } from '../utils/problemGenerator';
import { LEVELS, ACHIEVEMENTS, getGradeConfig } from '../utils/gameConfig';
import { initializeStats, updateWeeklyProgress, updateOperationStats, updateDifficultyStats, normalizeStats } from '../utils/statsUtils';
import { getTimeModeConfig } from '../utils/timeConfig';
import { useAuth } from './AuthContext';
import { recordAttemptDirect, flushQueue, migrateLegacyData } from '../services/attemptService';
import { fetchUserStats } from '../services/statsService';
import { loadGameState, saveGameState } from '../services/gameStateService';
import { simplifyFraction } from '../utils/fractionUtils';
import { logger } from '../utils/logger';
import { evaluateAchievements } from '../utils/achievementEngine';
import { updateDailyProgress, updatePracticeDays } from '../utils/dailyGoal';
import {
  answersMatch,
  isFactorizationProblem,
  isFractionProblem,
  isMixedNumberProblem,
  normalizeFactorizationAnswer,
} from '../utils/problemUtils';

type CheckAnswerPayload = Extract<GameAction, { type: 'CHECK_ANSWER' }>['payload'];

const STORAGE_KEYS = {
  maxScore: 'maxScore',
  achievements: 'achievements',
  bestStreak: 'bestStreak',
  totalExercises: 'totalExercises',
  correctExercises: 'correctExercises',
  stats: 'stats',
  grade: 'grade',
  levelMode: 'levelMode',
  manualLevel: 'manualLevel',
  timedCorrectExercises: 'timedCorrectExercises',
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
  if (stored === '6e') return '6e';
  if (stored === '5e') return '5e';
  return '4t';
}

function readStoredLevelMode(): 'auto' | 'manual' {
  if (!hasWindow) {
    return 'auto';
  }
  return window.localStorage.getItem(STORAGE_KEYS.levelMode) === 'manual' ? 'manual' : 'auto';
}

function readStoredManualLevel(): number {
  if (!hasWindow) {
    return 1;
  }
  const parsed = Number.parseInt(window.localStorage.getItem(STORAGE_KEYS.manualLevel) ?? '1', 10);
  if (Number.isNaN(parsed)) {
    return 1;
  }
  return Math.min(10, Math.max(1, parsed));
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

function hasAnswerValue(answer: string | Fraction | MixedNumber | RemainderAnswer): boolean {
  if (typeof answer === 'string') {
    return answer.trim().length > 0;
  }

  if ('quotient' in answer || 'whole' in answer || 'numerator' in answer) {
    return true;
  }

  return false;
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

  if (isFactorizationProblem(problem) && typeof rawUserAnswer === 'string') {
    normalizedAnswer = normalizeFactorizationAnswer(rawUserAnswer);
    isCorrect = normalizedAnswer === problem.answer;
  } else if (isFractionProblem(problem) && typeof rawUserAnswer === 'object' && 'numerator' in rawUserAnswer) {
    normalizedAnswer = simplifyFraction(rawUserAnswer);
    isCorrect = answersMatch(problem, rawUserAnswer);
  } else if (typeof rawUserAnswer === 'string' && rawUserAnswer.includes('/') && isFractionProblem(problem)) {
    const [numeratorStr, denominatorStr] = rawUserAnswer.split('/');
    const numerator = Number.parseInt(numeratorStr, 10);
    const denominator = Number.parseInt(denominatorStr, 10);
    if (!Number.isNaN(numerator) && !Number.isNaN(denominator) && denominator !== 0) {
      const parsedFraction = simplifyFraction({ numerator, denominator });
      normalizedAnswer = parsedFraction;
      isCorrect = answersMatch(problem, parsedFraction);
    }
  } else if (typeof rawUserAnswer === 'object' && rawUserAnswer !== null) {
    normalizedAnswer = rawUserAnswer;
    isCorrect = answersMatch(problem, rawUserAnswer);
  } else if (typeof rawUserAnswer === 'string') {
    normalizedAnswer = rawUserAnswer.trim();
    isCorrect = answersMatch(problem, rawUserAnswer);
    const numericAnswer = parseNumericAnswer(rawUserAnswer);
    if (numericAnswer !== null && getNumericLikeAnswer(problem) !== null) {
      normalizedAnswer = numericAnswer;
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

function getNumericLikeAnswer(problem: Problem): number | null {
  if ('answer' in problem && typeof problem.answer === 'number') {
    return problem.answer;
  }
  return null;
}

function buildAttemptPayload(
  level: number,
  practiceMode: PracticeMode,
  grade: GradeId,
  payload: CheckAnswerPayload,
): AttemptPayload {
  const correctAnswer: SerializedAnswer = isFractionProblem(payload.problem)
    ? simplifyFraction(payload.problem.answer)
    : isMixedNumberProblem(payload.problem)
      ? payload.problem.answer
      : payload.problem.answer;

  return {
    operation: payload.problem.operation,
    level,
    practiceMode,
    grade,
    isCorrect: payload.isCorrect,
    timeSpent: payload.timeSpent,
    userAnswer: payload.userAnswer,
    correctAnswer,
    createdAt: new Date().toISOString(),
  };
}

function getEffectiveLevel(state: Pick<GameState, 'level' | 'levelMode' | 'manualLevel'>): number {
  return state.levelMode === 'manual' ? state.manualLevel : state.level;
}

export function toPersistedGameState(state: GameState): PersistedGameState {
  return {
    maxScore: state.maxScore,
    bestStreak: state.bestStreak,
    totalExercises: state.totalExercises,
    correctExercises: state.correctExercises,
    timedCorrectExercises: state.timedCorrectExercises,
    achievements: state.achievements,
    daily: state.daily,
    practiceDays: state.practiceDays,
  };
}

const createInitialState = (): GameState => ({
  currentProblem: null,
  userAnswer: '',
  isCorrect: null,
  score: 0,
  maxScore: readStoredNumber(STORAGE_KEYS.maxScore),
  level: 1,
  levelMode: readStoredLevelMode(),
  manualLevel: readStoredManualLevel(),
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
  timedCorrectExercises: readStoredNumber(STORAGE_KEYS.timedCorrectExercises),
  recentAchievement: null,
  daily: null,
  practiceDays: [],
});

function createProblemForState(state: Pick<GameState, 'level' | 'levelMode' | 'manualLevel' | 'practiceMode' | 'grade'>): Problem {
  const effectiveLevel = getEffectiveLevel(state);
  return generateProblem(effectiveLevel, state.practiceMode, state.grade);
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
      const timedCorrectExercises =
        isCorrect && state.timeMode !== 'no-limit'
          ? state.timedCorrectExercises + 1
          : state.timedCorrectExercises;

      const unlockedAchievements = ACHIEVEMENTS.filter((achievement) => {
        if (newAchievements.some((item) => item.id === achievement.id)) return false;

        return evaluateAchievements({
          achievement,
          isCorrect,
          newCorrectExercises,
          newScore,
          newStreak,
          newLevel:
            [...LEVELS].reverse().find((level) => level.minScore <= newScore)?.id ?? state.level,
          stats: newStats,
          timeMode: state.timeMode,
          timedCorrectExercises,
        });
      });

      const enrichedUnlocked = unlockedAchievements.map((achievement) => ({
        ...achievement,
        unlocked: true,
        unlockedAt: new Date(),
      }));
      newAchievements.push(...enrichedUnlocked);

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
        timedCorrectExercises,
        recentAchievement: enrichedUnlocked[0] ?? null,
        daily: updateDailyProgress(state.daily, new Date()),
        practiceDays: updatePracticeDays(state.practiceDays, new Date()),
      };
    }

    case 'NEXT_PROBLEM':
      return {
        ...state,
        currentProblem: createProblemForState(state),
        userAnswer: '',
        isCorrect: null,
        recentAchievement: null,
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
        recentAchievement: null,
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
        currentProblem: generateProblem(getEffectiveLevel(state), nextPracticeMode, action.payload),
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
        currentProblem: generateProblem(getEffectiveLevel(state), nextPracticeMode, state.grade),
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

    case 'SET_LEVEL_MODE':
      return {
        ...state,
        levelMode: action.payload,
        currentProblem: createProblemForState({ ...state, levelMode: action.payload }),
        userAnswer: '',
        isCorrect: null,
        ...getResetTimerState(state.timeMode),
      };

    case 'SET_MANUAL_LEVEL':
      return {
        ...state,
        manualLevel: action.payload,
        currentProblem: createProblemForState({ ...state, manualLevel: action.payload }),
        userAnswer: '',
        isCorrect: null,
        ...getResetTimerState(state.timeMode),
      };

    case 'HYDRATE_PERSISTED': {
      // Fusión conservadora: nunca perder progreso local aún no sincronizado.
      const p = action.payload;
      const mergedAchievements = [...state.achievements];
      for (const remote of p.achievements ?? []) {
        if (!mergedAchievements.some((a) => a.id === remote.id)) {
          mergedAchievements.push(remote);
        }
      }
      const remoteDaily = p.daily ?? null;
      const mergedDaily = !state.daily
        ? remoteDaily
        : !remoteDaily
          ? state.daily
          : state.daily.date === remoteDaily.date
            ? { date: state.daily.date, count: Math.max(state.daily.count, remoteDaily.count) }
            : state.daily.date > remoteDaily.date
              ? state.daily
              : remoteDaily;
      const mergedPracticeDays = [...new Set([...state.practiceDays, ...(p.practiceDays ?? [])])]
        .sort()
        .slice(-60);

      return {
        ...state,
        maxScore: Math.max(state.maxScore, p.maxScore ?? 0),
        bestStreak: Math.max(state.bestStreak, p.bestStreak ?? 0),
        totalExercises: Math.max(state.totalExercises, p.totalExercises ?? 0),
        correctExercises: Math.max(state.correctExercises, p.correctExercises ?? 0),
        timedCorrectExercises: Math.max(state.timedCorrectExercises, p.timedCorrectExercises ?? 0),
        achievements: mergedAchievements,
        daily: mergedDaily,
        practiceDays: mergedPracticeDays,
      };
    }

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
  checkAnswer: (overrideAnswer?: string | Fraction | MixedNumber | RemainderAnswer) => void;
  nextProblem: () => void;
  resetGame: () => void;
  setAnswer: (answer: string | Fraction | MixedNumber | RemainderAnswer) => void;
  setGrade: (grade: GradeId) => void;
  setPracticeMode: (mode: PracticeMode) => void;
  setTimeMode: (mode: TimeMode) => void;
  setLevelMode: (mode: LevelMode) => void;
  setManualLevel: (level: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const sessionUserId = session?.user?.id ?? null;
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkAnswerRef = useRef<(overrideAnswer?: string | Fraction | MixedNumber | RemainderAnswer) => void>(() => undefined);
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

  const persistedSnapshotRef = useRef<PersistedGameState>(toPersistedGameState(state));
  persistedSnapshotRef.current = toPersistedGameState(state);

  const checkAnswer = useCallback(
    (overrideAnswer?: string | Fraction | MixedNumber | RemainderAnswer) => {
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
        const attemptPayload = buildAttemptPayload(
          getEffectiveLevel(state),
          state.practiceMode,
          state.grade,
          evaluation,
        );
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
      window.localStorage.setItem(STORAGE_KEYS.levelMode, state.levelMode);
      window.localStorage.setItem(STORAGE_KEYS.manualLevel, state.manualLevel.toString());
      window.localStorage.setItem(STORAGE_KEYS.timedCorrectExercises, state.timedCorrectExercises.toString());
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
    state.levelMode,
    state.manualLevel,
    state.timedCorrectExercises,
  ]);

  useEffect(() => {
    if (!state.currentProblem) {
      dispatch({ type: 'SET_PROBLEM', payload: generateProblem(getEffectiveLevel(state), state.practiceMode, state.grade) });
    }
  }, [state.currentProblem, state.level, state.levelMode, state.manualLevel, state.practiceMode, state.grade]);

  useEffect(() => {
    if (!sessionUserId) {
      return undefined;
    }

    const userId = sessionUserId;
    const timeoutId = setTimeout(() => {
      const snapshot = persistedSnapshotRef.current;
      if (hasWindow) {
        window.localStorage.setItem(`pitagoritas:gameState:${userId}`, JSON.stringify(snapshot));
      }
      void saveGameState(userId, snapshot);
    }, 2000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    sessionUserId,
    state.maxScore,
    state.bestStreak,
    state.totalExercises,
    state.correctExercises,
    state.timedCorrectExercises,
    state.achievements,
    state.daily,
    state.practiceDays,
  ]);

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

      try {
        const remoteGameState = await loadGameState(userId);
        if (remoteGameState) {
          dispatch({ type: 'HYDRATE_PERSISTED', payload: remoteGameState });
        } else {
          // Primera sesión de este usuario en la nube: sembrar con lo local.
          await saveGameState(userId, persistedSnapshotRef.current);
        }
      } catch (error) {
        logger.error('[GameContext] Error al sincronizar el estado de juego.', error);
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

  const setAnswer = (answer: string | Fraction | MixedNumber | RemainderAnswer) => {
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

  const setLevelMode = (mode: LevelMode) => {
    dispatch({ type: 'SET_LEVEL_MODE', payload: mode });
  };

  const setManualLevel = (level: number) => {
    dispatch({ type: 'SET_MANUAL_LEVEL', payload: Math.min(10, Math.max(1, level)) });
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
    setLevelMode,
    setManualLevel,
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