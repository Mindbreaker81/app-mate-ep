import React, { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { formatTime, getTimeModeConfig } from '../utils/timeConfig';
import { getPracticeModeConfig } from '../utils/practiceConfig';
import type { Fraction } from '../types';
import {
  allowsDecimalAnswer,
  formatProblemAnswer,
  isEstimationProblem,
  isFactorizationProblem,
  isFractionProblem,
  isMixedProblem,
  isPowerProblem,
  isPromptProblem,
  normalizeFactorizationAnswer,
} from '../utils/problemUtils';
import { formatMathNumber } from '../utils/mathUtils';

export function Exercise() {
  const { state, checkAnswer, nextProblem, setAnswer } = useGame();
  const { currentProblem, userAnswer, isCorrect, timeRemaining, isTimerActive, practiceMode, timeMode, grade } = state;
  const practiceConfig = getPracticeModeConfig(practiceMode, grade);

  const [fracAnswer, setFracAnswer] = React.useState({ numerator: '', denominator: '' });
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  useEffect(() => {
    setFracAnswer({ numerator: '', denominator: '' });
    setValidationError(null);
    setIsSubmitting(false);
  }, [currentProblem]);

  useEffect(() => {
    if (isCorrect !== null) {
      setIsSubmitting(false);
    }
  }, [isCorrect]);

  const maxTime = timeMode !== 'no-limit' ? getTimeModeConfig(timeMode).seconds || 60 : 60;

  const submitAnswer = (answer: string | Fraction) => {
    setValidationError(null);
    setIsSubmitting(true);
    setAnswer(answer);
    checkAnswer(answer);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProblem || isCorrect !== null) {
      return;
    }

    if (isFractionProblem(currentProblem)) {
      const num = parseInt(fracAnswer.numerator, 10);
      const den = parseInt(fracAnswer.denominator, 10);
      if (!isNaN(num) && !isNaN(den) && den !== 0) {
        submitAnswer({ numerator: num, denominator: den });
        return;
      }
      setValidationError('Escribe un numerador y un denominador válidos.');
      return;
    }

    if (typeof userAnswer !== 'string' || userAnswer.trim() === '') {
      setValidationError('Escribe una respuesta antes de enviarla.');
      return;
    }

    if (isFactorizationProblem(currentProblem) && !normalizeFactorizationAnswer(userAnswer)) {
      setValidationError('Escribe los factores como 2 x 2 x 3.');
      return;
    }

    submitAnswer(userAnswer);
  };

  const getOperationSymbol = (operation: string) => {
    switch (operation) {
      case 'addition': return '+';
      case 'subtraction': return '-';
      case 'multiplication': return '×';
      case 'division': return '÷';
      case 'decimal-addition': return '+';
      case 'decimal-subtraction': return '-';
      case 'decimal-multiplication': return '×';
      case 'decimal-division': return '÷';
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
          {isFractionProblem(currentProblem) ? (
            <>
              <span>{currentProblem.num1.numerator}/{currentProblem.num1.denominator}</span>
              <span className="mx-2 text-blue-600 text-3xl">
                {currentProblem.operation === 'fraction-addition'
                  ? '+'
                  : currentProblem.operation === 'fraction-subtraction'
                  ? '-'
                  : currentProblem.operation === 'fraction-multiplication'
                  ? '×'
                  : '÷'}
              </span>
              <span>{currentProblem.num2.numerator}/{currentProblem.num2.denominator}</span>
              <span className="mx-2">=</span>
              <span>
                <input
                  type="number"
                  inputMode="numeric"
                  aria-label="Numerador"
                  className="w-14 border-b-2 border-blue-400 text-center mx-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  placeholder="Num"
                  value={fracAnswer.numerator}
                  onChange={e => {
                    setValidationError(null);
                    setFracAnswer(a => ({ ...a, numerator: e.target.value }));
                  }}
                  disabled={isCorrect !== null}
                />
                <span className="text-xl">/</span>
                <input
                  type="number"
                  inputMode="numeric"
                  aria-label="Denominador"
                  className="w-14 border-b-2 border-blue-400 text-center mx-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  placeholder="Den"
                  value={fracAnswer.denominator}
                  onChange={e => {
                    setValidationError(null);
                    setFracAnswer(a => ({ ...a, denominator: e.target.value }));
                  }}
                  disabled={isCorrect !== null}
                />
              </span>
            </>
          ) : isMixedProblem(currentProblem) ? (
            <div className="space-y-4">
              <div className="text-3xl font-semibold text-gray-800">
                {currentProblem.expression}
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl text-blue-600">=</span>
                <input
                  type="number"
                  inputMode="numeric"
                  aria-label="Tu respuesta"
                  placeholder="Tu respuesta"
                  className="w-24 border-b-2 border-blue-400 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  value={typeof userAnswer === 'string' ? userAnswer : ''}
                  onChange={e => {
                    setValidationError(null);
                    setAnswer(e.target.value);
                  }}
                  disabled={isCorrect !== null}
                />
              </div>
            </div>
          ) : isPowerProblem(currentProblem) ? (
            <div className="space-y-4">
              <div className="text-4xl font-semibold text-gray-800">
                {currentProblem.base}
                <sup className="text-2xl align-super ml-1">{currentProblem.exponent}</sup>
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl text-blue-600">=</span>
                <input
                  type="number"
                  inputMode="numeric"
                  aria-label="Tu respuesta"
                  placeholder="Tu respuesta"
                  className="w-24 border-b-2 border-blue-400 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  value={typeof userAnswer === 'string' ? userAnswer : ''}
                  onChange={e => {
                    setValidationError(null);
                    setAnswer(e.target.value);
                  }}
                  disabled={isCorrect !== null}
                />
              </div>
            </div>
          ) : isEstimationProblem(currentProblem) ? (
            <div className="space-y-6">
              <div className="text-2xl font-semibold text-gray-800">{currentProblem.prompt}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentProblem.options.map((option) => {
                  const isSelected = userAnswer === String(option);

                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => {
                        setValidationError(null);
                        setAnswer(String(option));
                      }}
                      disabled={isCorrect !== null}
                      className={`rounded-lg border-2 px-4 py-3 text-lg font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-800'
                          : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-300'
                      }`}
                    >
                      {formatMathNumber(option)}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : isPromptProblem(currentProblem) ? (
            <div className="space-y-4">
              <div className="text-2xl font-semibold text-gray-800">
                {isFactorizationProblem(currentProblem)
                  ? `Descompón ${currentProblem.target} en factores primos`
                  : currentProblem.prompt}
              </div>
              <div className="flex items-center justify-center gap-3">
                {!isFactorizationProblem(currentProblem) && <span className="text-2xl text-blue-600">=</span>}
                <input
                  type={isFactorizationProblem(currentProblem) || allowsDecimalAnswer(currentProblem) ? 'text' : 'number'}
                  inputMode={
                    isFactorizationProblem(currentProblem)
                      ? undefined
                      : allowsDecimalAnswer(currentProblem)
                      ? 'decimal'
                      : 'numeric'
                  }
                  step={isFactorizationProblem(currentProblem) ? undefined : allowsDecimalAnswer(currentProblem) ? 'any' : '1'}
                  aria-label={isFactorizationProblem(currentProblem) ? 'Factores primos' : 'Tu respuesta'}
                  placeholder={isFactorizationProblem(currentProblem) ? '2 x 2 x 3' : 'Tu respuesta'}
                  className="w-full max-w-xs border-b-2 border-blue-400 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  value={typeof userAnswer === 'string' ? userAnswer : ''}
                  onChange={e => {
                    setValidationError(null);
                    setAnswer(e.target.value);
                  }}
                  disabled={isCorrect !== null}
                />
              </div>
            </div>
          ) : currentProblem ? (
            <>
              <span>{formatMathNumber(currentProblem.num1)}</span>
              <span className="mx-2 text-blue-600 text-3xl">
                {getOperationSymbol(currentProblem.operation)}
              </span>
              <span>{formatMathNumber(currentProblem.num2)}</span>
              <span className="mx-2">=</span>
              <input
                type={allowsDecimalAnswer(currentProblem) ? 'text' : 'number'}
                inputMode={allowsDecimalAnswer(currentProblem) ? 'decimal' : 'numeric'}
                step={allowsDecimalAnswer(currentProblem) ? 'any' : '1'}
                aria-label="Tu respuesta"
                placeholder="Tu respuesta"
                className="w-24 border-b-2 border-blue-400 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                value={typeof userAnswer === 'string' ? userAnswer : ''}
                onChange={e => {
                  setValidationError(null);
                  setAnswer(e.target.value);
                }}
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
          {validationError && (
            <div className="text-sm font-medium text-red-700" role="alert" aria-live="polite">
              {validationError}
            </div>
          )}
          {isCorrect === null && (
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 transition-colors text-lg"
            >
              {isSubmitting ? 'Comprobando...' : 'Enviar'}
            </button>
          )}
          {isCorrect !== null && (
            <button
              type="button"
              onClick={nextProblem}
              className="px-6 py-2 bg-green-500 text-white rounded shadow hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500 transition-colors text-lg"
            >
              Siguiente
            </button>
          )}
        </form>
        
        {/* Feedback y explicación */}
        {isCorrect === true && (
          <div className="mt-6 text-green-700 font-bold text-xl text-center" role="status" aria-live="polite">
            ¡Correcto!
          </div>
        )}
        {isCorrect === false && (
          <div className="mt-6 text-red-700 font-bold text-xl text-center" role="status" aria-live="polite">
            Incorrecto. La respuesta correcta es:{' '}
            {formatProblemAnswer(currentProblem)}
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

        </div>
      </div>
    </div>
  );
} 