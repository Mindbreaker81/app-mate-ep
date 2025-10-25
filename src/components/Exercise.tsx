import React, { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { formatTime } from '../utils/timeConfig';
import { getPracticeModeConfig } from '../utils/practiceConfig';
import { CSSConfetti } from './CSSConfetti';
import { Confetti } from './Confetti';
import type { Problem, Fraction, MixedProblem } from '../types';

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

function isFractionProblem(problem: Problem): problem is {
  num1: Fraction;
  num2: Fraction;
  operation: 'fraction-addition' | 'fraction-subtraction';
  answer: Fraction;
  explanation: string;
} {
  return (
    problem.operation === 'fraction-addition' ||
    problem.operation === 'fraction-subtraction'
  );
}

function isMixedProblem(problem: Problem): problem is MixedProblem {
  return problem.operation === 'mixed';
}

// Hook para manejar el confeti
function useConfetti(trigger: boolean) {
  const [showConfetti, setShowConfetti] = React.useState(false);
  
  React.useEffect(() => {
    if (trigger) {
      setShowConfetti(true);
      const timeout = setTimeout(() => setShowConfetti(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [trigger]);
  
  return showConfetti;
}

export function Exercise() {
  const { state, checkAnswer, nextProblem, setAnswer } = useGame();
  const { currentProblem, userAnswer, isCorrect, timeRemaining, isTimerActive, practiceMode, timeMode } = state;
  const practiceConfig = getPracticeModeConfig(practiceMode);
  const showStars = useStarAnimation(isCorrect === true);
  const showConfetti = useConfetti(isCorrect === true);

  // Estado local para respuesta de fracción
  const [fracAnswer, setFracAnswer] = React.useState({ numerator: '', denominator: '' });

  useEffect(() => {
    setFracAnswer({ numerator: '', denominator: '' });
  }, [currentProblem]);

  // Mapping de timeMode a segundos
  const timeModeSeconds: Record<string, number> = { '30s': 30, '1min': 60, '2min': 120 };
  const maxTime = timeMode !== 'no-limit' ? timeModeSeconds[timeMode] || 60 : 60;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentProblem && isFractionProblem(currentProblem)) {
      const num = parseInt(fracAnswer.numerator, 10);
      const den = parseInt(fracAnswer.denominator, 10);
      if (!isNaN(num) && !isNaN(den) && den !== 0) {
        setAnswer({ numerator: num, denominator: den });
        setTimeout(() => checkAnswer(), 0);
      }
    } else {
      setAnswer(userAnswer);
      setTimeout(() => checkAnswer(), 0);
    }
  };

  const getOperationSymbol = (operation: string) => {
    switch (operation) {
      case 'addition': return '+';
      case 'subtraction': return '-';
      case 'multiplication': return '×';
      case 'division': return '÷';
      case 'mixed': return '…';
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
          {currentProblem && isFractionProblem(currentProblem) ? (
            <>
              <span>{currentProblem.num1.numerator}/{currentProblem.num1.denominator}</span>
              <span className="mx-2 text-blue-600 text-3xl">
                {currentProblem.operation === 'fraction-addition' ? '+' : '-'}
              </span>
              <span>{currentProblem.num2.numerator}/{currentProblem.num2.denominator}</span>
              <span className="mx-2">=</span>
              <span>
                <input
                  type="number"
                  className="w-14 border-b-2 border-blue-400 text-center mx-1"
                  placeholder="Num"
                  value={fracAnswer.numerator}
                  onChange={e => setFracAnswer(a => ({ ...a, numerator: e.target.value }))}
                  disabled={isCorrect !== null}
                />
                <span className="text-xl">/</span>
                <input
                  type="number"
                  className="w-14 border-b-2 border-blue-400 text-center mx-1"
                  placeholder="Den"
                  value={fracAnswer.denominator}
                  onChange={e => setFracAnswer(a => ({ ...a, denominator: e.target.value }))}
                  disabled={isCorrect !== null}
                />
              </span>
            </>
          ) : currentProblem && isMixedProblem(currentProblem) ? (
            <div className="space-y-4">
              <div className="text-3xl font-semibold text-gray-800">
                {currentProblem.expression}
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl text-blue-600">=</span>
                <input
                  type="number"
                  className="w-24 border-b-2 border-blue-400 text-center"
                  value={typeof userAnswer === 'string' ? userAnswer : ''}
                  onChange={e => setAnswer(e.target.value)}
                  disabled={isCorrect !== null}
                />
              </div>
            </div>
          ) : currentProblem ? (
            <>
              <span>{currentProblem.num1}</span>
              <span className="mx-2 text-blue-600 text-3xl">
                {getOperationSymbol(currentProblem.operation)}
              </span>
              <span>{currentProblem.num2}</span>
              <span className="mx-2">=</span>
              <input
                type="number"
                className="w-24 border-b-2 border-blue-400 text-center"
                value={typeof userAnswer === 'string' ? userAnswer : ''}
                onChange={e => setAnswer(e.target.value)}
                disabled={isCorrect !== null}
              />
            </>
          ) : null}
        </div>
        
        {/* Temporizador visual */}
        {isTimerActive && (
          <div className="h-4 w-full bg-gray-200 rounded mb-6">
            <div
              className={`h-4 rounded transition-all duration-300 ${
                timeRemaining > 20 ? 'bg-green-400' : timeRemaining > 10 ? 'bg-yellow-400' : 'bg-red-500'
              }`}
              style={{ width: `${(timeRemaining / maxTime) * 100}%` }}
            />
          </div>
        )}
        
        {/* Botón enviar o siguiente */}
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
          {isCorrect === null && (
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-700 transition-colors text-lg"
            >
              Enviar
            </button>
          )}
          {isCorrect !== null && (
            <button
              type="button"
              onClick={nextProblem}
              className="px-6 py-2 bg-green-500 text-white rounded shadow hover:bg-green-700 transition-colors text-lg"
            >
              Siguiente
            </button>
          )}
        </form>
        
        {/* Feedback y explicación */}
        {isCorrect === true && (
          <div className="mt-6 text-green-700 font-bold text-xl text-center">¡Correcto!</div>
        )}
        {isCorrect === false && (
          <div className="mt-6 text-red-700 font-bold text-xl text-center">
            Incorrecto. La respuesta correcta es:{' '}
            {isFractionProblem(currentProblem)
              ? `${currentProblem.answer.numerator}/${currentProblem.answer.denominator}`
              : currentProblem.answer}
            <pre className="bg-gray-100 rounded p-3 mt-4 text-left text-base whitespace-pre-wrap">
              {currentProblem.explanation}
            </pre>
          </div>
        )}
        
        {/* Información adicional */}
        <div className="text-center text-sm text-gray-500">
          <p>Nivel {state.level} • {practiceConfig.description}</p>
          {timeMode !== 'no-limit' && (
            <p>Modo contra reloj: {formatTime(timeRemaining)}</p>
          )}
          
          {/* Opciones de confeti */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localStorage.getItem('confetti-enabled') !== 'false'}
                onChange={(e) => {
                  localStorage.setItem('confetti-enabled', e.target.checked.toString());
                }}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-xs">Mostrar confeti</span>
            </label>
            
            {localStorage.getItem('confetti-enabled') !== 'false' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localStorage.getItem('confetti-type') === 'canvas'}
                  onChange={(e) => {
                    localStorage.setItem('confetti-type', e.target.checked ? 'canvas' : 'css');
                  }}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-xs">Confeti avanzado</span>
              </label>
            )}
          </div>
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
      
      {/* Componente de confeti según preferencia del usuario */}
      {localStorage.getItem('confetti-type') === 'canvas' ? (
        <Confetti trigger={showConfetti} />
      ) : (
        <CSSConfetti trigger={showConfetti} />
      )}
    </div>
  );
} 