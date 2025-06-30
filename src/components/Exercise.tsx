import React, { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { formatTime } from '../utils/timeConfig';
import { getPracticeModeConfig } from '../utils/practiceConfig';
import confetti from 'canvas-confetti';

const correctSound = new Audio('/sounds/correct.mp3');
const wrongSound = new Audio('/sounds/wrong.mp3');
let backgroundMusic: HTMLAudioElement | null = null;

// Hook para animar estrellas
function useStarAnimation(trigger: boolean) {
  const [showStars, setShowStars] = React.useState(false);
  React.useEffect(() => {
    if (trigger) {
      setShowStars(true);
      const timeout = setTimeout(() => setShowStars(false), 1200);
      return () => clearTimeout(timeout);
    }
  }, [trigger]);
  return showStars;
}

export function Exercise() {
  const { state, checkAnswer, nextProblem, setAnswer } = useGame();
  
  const { currentProblem, userAnswer, isCorrect, timeRemaining, isTimerActive, practiceMode, timeMode } = state;
  
  const practiceConfig = getPracticeModeConfig(practiceMode);
  
  const showStars = useStarAnimation(isCorrect === true);
  
  useEffect(() => {
    if (isCorrect === true) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [isCorrect]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userAnswer.trim()) {
      checkAnswer();
    }
  };
  
  const handleNext = () => {
    nextProblem();
  };
  
  const getOperationSymbol = (operation: string) => {
    switch (operation) {
      case 'addition': return '+';
      case 'subtraction': return '-';
      case 'multiplication': return '×';
      case 'division': return '÷';
      default: return '+';
    }
  };
  
  const getTimerColor = () => {
    if (timeMode === 'no-limit') return 'text-gray-500';
    if (timeRemaining > 30) return 'text-green-600';
    if (timeRemaining > 10) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  if (!currentProblem) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando ejercicio...</p>
      </div>
    );
  }
  
  return (
    <div className="relative">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Información del modo activo */}
        <div className="mb-6 flex flex-wrap gap-2 justify-center">
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            <span>{practiceConfig.icon}</span>
            <span>{practiceConfig.label}</span>
          </div>
          {timeMode !== 'no-limit' && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              <span>⏰</span>
              <span>Modo Tiempo</span>
            </div>
          )}
        </div>
        
        {/* Timer */}
        {timeMode !== 'no-limit' && (
          <div className="text-center mb-6">
            <div className={`text-3xl font-bold ${getTimerColor()} ${isTimerActive ? 'animate-pulse' : ''}`}>
              {formatTime(timeRemaining)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Tiempo restante
            </div>
          </div>
        )}
        
        {/* Problema */}
        <div className="text-center mb-8">
          <div className="text-6xl font-bold text-gray-800 mb-4">
            {currentProblem.num1} {getOperationSymbol(currentProblem.operation)} {currentProblem.num2} = ?
          </div>
          
          <form onSubmit={handleSubmit} className="max-w-xs mx-auto">
            <input
              type="number"
              value={userAnswer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Tu respuesta"
              className="w-full px-4 py-3 text-2xl text-center border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              autoFocus
              disabled={isCorrect !== null}
            />
            
            {isCorrect === null && (
              <button
                type="submit"
                className="w-full mt-4 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Comprobar
              </button>
            )}
          </form>
        </div>
        
        {/* Resultado */}
        {isCorrect !== null && (
          <div className="text-center mb-6">
            {isCorrect ? (
              <div className="text-green-600">
                <div className="text-4xl mb-2">🎉 ¡Correcto!</div>
                <p className="text-lg">¡Excelente trabajo!</p>
              </div>
            ) : (
              <div className="text-red-600">
                <div className="text-4xl mb-2">❌ Incorrecto</div>
                <p className="text-lg">La respuesta correcta es: <span className="font-bold">{currentProblem.answer}</span></p>
              </div>
            )}
            
            {/* Explicación */}
            {!isCorrect && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
                <h4 className="font-semibold text-gray-800 mb-2">📝 Explicación:</h4>
                <div className="text-gray-700 whitespace-pre-line">
                  {currentProblem.explanation}
                </div>
              </div>
            )}
            
            <button
              onClick={handleNext}
              className="mt-4 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              Siguiente Ejercicio
            </button>
          </div>
        )}
        
        {/* Información adicional */}
        <div className="text-center text-sm text-gray-500">
          <p>Nivel {state.level} • {practiceConfig.description}</p>
          {timeMode !== 'no-limit' && (
            <p>Modo contra reloj: {formatTime(timeRemaining)}</p>
          )}
        </div>
      </div>
      {showStars && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="animate-star-burst">
            <span className="text-yellow-400 text-6xl drop-shadow-lg">★</span>
            <span className="text-yellow-300 text-4xl ml-2">★</span>
            <span className="text-yellow-200 text-3xl ml-2">★</span>
          </div>
        </div>
      )}
    </div>
  );
} 