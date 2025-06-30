import React, { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import type { GameState, GameAction } from '../types';
import { generateProblem, getDifficulty } from '../utils/problemGenerator';
import { LEVELS, ACHIEVEMENTS } from '../utils/gameConfig';
import { initializeStats, updateWeeklyProgress, updateOperationStats, updateDifficultyStats } from '../utils/statsUtils';
import { TIME_MODES } from '../utils/timeConfig';

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
      if (!state.currentProblem) return state;
      
      const isCorrect = parseInt(state.userAnswer) === state.currentProblem.answer;
      const newScore = isCorrect ? state.score + 1 : state.score;
      const newMaxScore = Math.max(newScore, state.maxScore);
      const newStreak = isCorrect ? state.streak + 1 : 0;
      const newBestStreak = Math.max(newStreak, state.bestStreak);
      const newTotalExercises = state.totalExercises + 1;
      const newCorrectExercises = isCorrect ? state.correctExercises + 1 : state.correctExercises;
      
      // Actualizar estadísticas
      let newStats = { ...state.stats };
      const timeSpent = state.timeMode !== 'no-limit' ? state.timeRemaining : 0;
      const difficulty = getDifficulty(state.level, state.currentProblem.operation);
      
      newStats = updateWeeklyProgress(newStats, isCorrect, timeSpent);
      newStats = updateOperationStats(newStats, state.currentProblem.operation, isCorrect, timeSpent, difficulty);
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
  setAnswer: (answer: string) => void;
  setPracticeMode: (mode: string) => void;
  setTimeMode: (mode: string) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const timerRef = useRef<number | null>(null);
  
  // Efecto para manejar el timer
  useEffect(() => {
    if (state.isTimerActive && state.timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        dispatch({ type: 'UPDATE_TIMER', payload: state.timeRemaining - 1 });
      }, 1000);
    } else if (state.timeRemaining === 0 && state.isTimerActive) {
      dispatch({ type: 'STOP_TIMER' });
      // Auto-check cuando se acaba el tiempo
      if (state.userAnswer) {
        dispatch({ type: 'CHECK_ANSWER' });
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state.isTimerActive, state.timeRemaining, state.userAnswer]);
  
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
  }, [state.level, state.practiceMode]);
  
  const checkAnswer = () => {
    dispatch({ type: 'CHECK_ANSWER' });
  };
  
  const nextProblem = () => {
    dispatch({ type: 'NEXT_PROBLEM' });
  };
  
  const resetGame = () => {
    dispatch({ type: 'RESET_GAME' });
  };
  
  const setAnswer = (answer: string) => {
    dispatch({ type: 'SET_ANSWER', payload: answer });
  };
  
  const setPracticeMode = (mode: string) => {
    dispatch({ type: 'SET_PRACTICE_MODE', payload: mode as any });
  };
  
  const setTimeMode = (mode: string) => {
    dispatch({ type: 'SET_TIME_MODE', payload: mode as any });
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