import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { GameState, GameAction } from '../types';
import { generateProblem, getRandomOperation } from '../utils/problemGenerator';

const initialState: GameState = {
  currentProblem: null,
  score: 0,
  maxScore: 0,
  isCorrect: null,
  showSolution: false,
  userAnswer: ''
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'GENERATE_PROBLEM':
      return {
        ...state,
        currentProblem: action.payload,
        isCorrect: null,
        showSolution: false,
        userAnswer: ''
      };

    case 'SUBMIT_ANSWER':
      const newScore = action.payload.isCorrect ? state.score + 1 : state.score;
      const newMaxScore = Math.max(newScore, state.maxScore);
      
      // Guardar puntuación máxima en localStorage
      localStorage.setItem('mathGameMaxScore', newMaxScore.toString());
      
      return {
        ...state,
        score: newScore,
        maxScore: newMaxScore,
        isCorrect: action.payload.isCorrect,
        userAnswer: action.payload.answer
      };

    case 'SHOW_SOLUTION':
      return {
        ...state,
        showSolution: true
      };

    case 'NEXT_PROBLEM':
      const newProblem = generateProblem(getRandomOperation());
      return {
        ...state,
        currentProblem: newProblem,
        isCorrect: null,
        showSolution: false,
        userAnswer: ''
      };

    case 'LOAD_MAX_SCORE':
      return {
        ...state,
        maxScore: action.payload
      };

    case 'RESET_GAME':
      return {
        ...initialState,
        maxScore: state.maxScore
      };

    default:
      return state;
  }
}

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  useEffect(() => {
    // Cargar puntuación máxima desde localStorage
    const savedMaxScore = localStorage.getItem('mathGameMaxScore');
    if (savedMaxScore) {
      dispatch({ type: 'LOAD_MAX_SCORE', payload: parseInt(savedMaxScore) });
    }

    // Generar primer problema
    const firstProblem = generateProblem(getRandomOperation());
    dispatch({ type: 'GENERATE_PROBLEM', payload: firstProblem });
  }, []);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
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