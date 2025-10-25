import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import type {
  GameState,
  GameAction,
  Fraction,
  PracticeMode,
  TimeMode,
  Problem,
  AttemptPayload,
  SerializedAnswer,
  LegacySnapshot,
} from '../types';
import { generateProblem, getDifficulty } from '../utils/problemGenerator';
import { LEVELS, ACHIEVEMENTS } from '../utils/gameConfig';
import { initializeStats, updateWeeklyProgress, updateOperationStats, updateDifficultyStats } from '../utils/statsUtils';
import { TIME_MODES } from '../utils/timeConfig';
import { useAuth } from './AuthContext';
import { recordAttempt, flushQueue, migrateLegacyData } from '../services/attemptService';
import { fetchUserStats } from '../services/statsService';

const initialState: GameState = {
  currentProblem: null,
  userAnswer: '',
  isCorrect: null,
  score: 0,
  maxScore: parseInt(localStorage.getItem('maxScore') || '0'),
  level: 1,
  achievements: JSON.parse(localStorage.getItem('achievements') || '[]'),
  streak: 0,
  bestStreak: parseInt(localStorage.getItem('bestStreak') || '0'),
  totalExercises: parseInt(localStorage.getItem('totalExercises') || '0'),
  correctExercises: parseInt(localStorage.getItem('correctExercises') || '0'),
  stats: JSON.parse(localStorage.getItem('stats') || 'null') || initializeStats(),
  practiceMode: 'all',
  timeMode: 'no-limit',
  timeRemaining: 0,
  isTimerActive: false
};

function simplifyFraction(frac: Fraction): Fraction {
  const numerator = Math.abs(frac.numerator);
  const denominator = Math.abs(frac.denominator);
  if (denominator === 0) return { numerator: 0, denominator: 1 };
  function gcd(a: number, b: number): number {
    a = Math.abs(a);
    b = Math.abs(b);
    if (b === 0) return a;
    return gcd(b, a % b);
  }
  const divisor = gcd(numerator, denominator);
  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor,
  };
}

function fractionEquals(a: Fraction, b: Fraction): boolean {
  const sa = simplifyFraction(a);
  const sb = simplifyFraction(b);
  return sa.numerator === sb.numerator && sa.denominator === sb.denominator;
}

type FractionAnswerProblem = Extract<Problem, { answer: Fraction }>;

function isFractionProblem(problem: Problem | null): problem is FractionAnswerProblem {
  return (
    !!problem &&
    typeof problem === 'object' &&
    typeof (problem as FractionAnswerProblem).answer === 'object' &&
    (problem as FractionAnswerProblem).answer !== null &&
    'numerator' in (problem as FractionAnswerProblem).answer &&
    'denominator' in (problem as FractionAnswerProblem).answer
  );
}

type CheckAnswerPayload = Extract<GameAction, { type: 'CHECK_ANSWER' }>['payload'];

function getModeSeconds(mode: TimeMode): number {
  if (mode === 'no-limit') return 0;
  return TIME_MODES.find(t => t.mode === mode)?.seconds ?? 0;
}

function calculateTimeSpent(timeMode: TimeMode, timeRemaining: number): number {
  const totalSeconds = getModeSeconds(timeMode);
  if (!totalSeconds) return 0;
  return Math.max(0, totalSeconds - timeRemaining);
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

  if (isFractionProblem(problem)) {
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
    const numericAnswer =
      typeof rawUserAnswer === 'string'
        ? Number.parseFloat(rawUserAnswer)
        : typeof rawUserAnswer === 'number'
        ? rawUserAnswer
        : Number.NaN;
    if (!Number.isNaN(numericAnswer)) {
      normalizedAnswer = numericAnswer;
      isCorrect = numericAnswer === problem.answer;
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
  const problemIsFraction = isFractionProblem(payload.problem);
  let correctAnswer: SerializedAnswer;
  if (problemIsFraction) {
    correctAnswer = simplifyFraction(payload.problem.answer as Fraction);
  } else {
    correctAnswer = payload.problem.answer;
  }

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

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_PROBLEM':
      return {
        ...state,
        currentProblem: action.payload,
        userAnswer: '',
        isCorrect: null
      };
      
    case 'SET_ANSWER':
      return {
        ...state,
        userAnswer: action.payload
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
      
      // Actualizar estadísticas
      let newStats = { ...state.stats };
      newStats = updateWeeklyProgress(newStats, isCorrect, timeSpent);
      newStats = updateOperationStats(newStats, problem.operation, isCorrect, timeSpent, difficulty);
      newStats = updateDifficultyStats(newStats, difficulty, isCorrect);
      
      // Verificar logros
      const newAchievements = [...state.achievements];
      const unlockedAchievements = ACHIEVEMENTS.filter(achievement => {
        if (newAchievements.some(a => a.id === achievement.id)) return false;
        
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
      
      unlockedAchievements.forEach(achievement => {
        newAchievements.push({
          ...achievement,
          unlocked: true,
          unlockedAt: new Date()
        });
      });
      
      // Verificar desbloqueo de niveles
      const newLevel = LEVELS.find(level => level.minScore <= newScore && level.id > state.level)?.id || state.level;
      
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
        isTimerActive: false
      };
    }
    
    case 'NEXT_PROBLEM': {
      const newProblem = generateProblem(state.level, state.practiceMode);
      return {
        ...state,
        currentProblem: newProblem,
        userAnswer: '',
        isCorrect: null,
        timeRemaining: state.timeMode !== 'no-limit' ? TIME_MODES.find(t => t.mode === state.timeMode)?.seconds || 0 : 0,
        isTimerActive: state.timeMode !== 'no-limit'
      };
    }
    
    case 'RESET_GAME': {
      const newProblem = generateProblem(state.level, state.practiceMode);
      return {
        ...state,
        score: 0,
        streak: 0,
        currentProblem: newProblem,
        userAnswer: '',
        isCorrect: null,
        timeRemaining: state.timeMode !== 'no-limit' ? TIME_MODES.find(t => t.mode === state.timeMode)?.seconds || 0 : 0,
        isTimerActive: state.timeMode !== 'no-limit'
      };
    }
    
    case 'UNLOCK_ACHIEVEMENT':
      return {
        ...state,
        achievements: [...state.achievements, action.payload]
      };
      
    case 'UPDATE_STREAK':
      return {
        ...state,
        streak: action.payload
      };
      
    case 'UPDATE_STATS':
      return {
        ...state,
        stats: { ...state.stats, ...action.payload }
      };

    case 'SET_STATS':
      return {
        ...state,
        stats: action.payload
      };
      
    case 'SET_PRACTICE_MODE': {
      const newProblem = generateProblem(state.level, action.payload);
      return {
        ...state,
        practiceMode: action.payload,
        currentProblem: newProblem,
        userAnswer: '',
        isCorrect: null,
        timeRemaining: state.timeMode !== 'no-limit' ? TIME_MODES.find(t => t.mode === state.timeMode)?.seconds || 0 : 0,
        isTimerActive: state.timeMode !== 'no-limit'
      };
    }
    
    case 'SET_TIME_MODE': {
      const newProblem = generateProblem(state.level, state.practiceMode);
      return {
        ...state,
        timeMode: action.payload,
        currentProblem: newProblem,
        userAnswer: '',
        isCorrect: null,
        timeRemaining: action.payload !== 'no-limit' ? TIME_MODES.find(t => t.mode === action.payload)?.seconds || 0 : 0,
        isTimerActive: action.payload !== 'no-limit'
      };
    }
    
    case 'UPDATE_TIMER':
      return {
        ...state,
        timeRemaining: action.payload
      };
      
    case 'START_TIMER':
      return {
        ...state,
        isTimerActive: true
      };
      
    case 'STOP_TIMER':
      return {
        ...state,
        isTimerActive: false
      };
      
    default:
      return state;
  }
}

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  checkAnswer: () => void;
  nextProblem: () => void;
  resetGame: () => void;
  setAnswer: (answer: string | Fraction) => void;
  setPracticeMode: (mode: PracticeMode) => void;
  setTimeMode: (mode: TimeMode) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const sessionUserId = session?.user?.id ?? null;
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const syncedRef = useRef(false);
  const legacySnapshotRef = useRef<LegacySnapshot | null>(null);

  legacySnapshotRef.current = {
    stats: state.stats,
    totalExercises: state.totalExercises,
    correctExercises: state.correctExercises,
    level: state.level,
    practiceMode: state.practiceMode,
  };

  const checkAnswer = useCallback(() => {
    if (!state.currentProblem) return;
    const evaluation = buildCheckAnswerPayload({
      currentProblem: state.currentProblem,
      userAnswer: state.userAnswer,
      level: state.level,
      timeMode: state.timeMode,
      timeRemaining: state.timeRemaining,
    });
    dispatch({ type: 'CHECK_ANSWER', payload: evaluation });
    if (sessionUserId) {
      const attemptPayload = buildAttemptPayload(state.level, state.practiceMode, evaluation);
      recordAttempt(sessionUserId, attemptPayload);
    }
  }, [
    state.currentProblem,
    state.userAnswer,
    state.level,
    state.practiceMode,
    state.timeMode,
    state.timeRemaining,
    sessionUserId,
    dispatch,
  ]);
  
  // Efecto para manejar el timer
  useEffect(() => {
    if (state.isTimerActive && state.timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        dispatch({ type: 'UPDATE_TIMER', payload: state.timeRemaining - 1 });
      }, 1000);
    } else if (state.timeRemaining === 0 && state.isTimerActive) {
      dispatch({ type: 'STOP_TIMER' });
      if (state.userAnswer && state.currentProblem) {
        checkAnswer();
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [state.isTimerActive, state.timeRemaining, state.userAnswer, state.currentProblem, checkAnswer]);
  
  // Efecto para guardar datos en localStorage
  useEffect(() => {
    localStorage.setItem('maxScore', state.maxScore.toString());
    localStorage.setItem('bestStreak', state.bestStreak.toString());
    localStorage.setItem('totalExercises', state.totalExercises.toString());
    localStorage.setItem('correctExercises', state.correctExercises.toString());
    localStorage.setItem('achievements', JSON.stringify(state.achievements));
    localStorage.setItem('stats', JSON.stringify(state.stats));
  }, [state.maxScore, state.bestStreak, state.totalExercises, state.correctExercises, state.achievements, state.stats]);
  
  // Efecto para generar problema inicial
  useEffect(() => {
    if (!state.currentProblem) {
      dispatch({ type: 'SET_PROBLEM', payload: generateProblem(state.level, state.practiceMode) });
    }
  }, [state.currentProblem, state.level, state.practiceMode]);

  // Sincronización con Supabase al iniciar sesión
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
        console.warn('No se pudieron migrar los datos locales:', error);
      }

      try {
        const remoteStats = await fetchUserStats(userId);
        if (remoteStats) {
          dispatch({ type: 'SET_STATS', payload: remoteStats });
        }
      } catch (error) {
        console.warn('No se pudieron obtener estadísticas remotas:', error);
      }

      await flushQueue(userId);
    };

    void sync();
  }, [sessionUserId]);

  // Intentar enviar cola al recuperar conexión
  useEffect(() => {
    if (!sessionUserId) {
      return;
    }

    if (typeof window === 'undefined') {
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
    setPracticeMode,
    setTimeMode
  };
  
  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
} 