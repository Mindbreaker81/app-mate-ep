import React, { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { formatTime, getTimeModeConfig } from '../utils/timeConfig';
import { getPracticeModeConfig } from '../utils/practiceConfig';
import type { Fraction, MixedNumber, RemainderAnswer } from '../types';
import {
  allowsDecimalAnswer,
  angleTypeLabel,
  compareOperatorLabel,
  formatMixedNumber,
  formatProblemAnswer,
  isAngleProblem,
  isCompareProblem,
  isConversionProblem,
  isEstimationProblem,
  isFactorizationProblem,
  isFractionProblem,
  isIntegerArithmeticProblem,
  isIntegerCompareProblem,
  isIntegerOrderProblem,
  isMixedNumberConvertProblem,
  isMixedNumberProblem,
  isMixedProblem,
  isMultipleChoiceProblem,
  isOrderValuesProblem,
  isPowerProblem,
  isProbabilityProblem,
  isPromptProblem,
  isRemainderProblem,
  isSquareRootProblem,
  normalizeFactorizationAnswer,
} from '../utils/problemUtils';
import { formatMathNumber } from '../utils/mathUtils';

export function Exercise() {
  const { state, checkAnswer, nextProblem, setAnswer } = useGame();
  const { currentProblem, userAnswer, isCorrect, timeRemaining, isTimerActive, practiceMode, timeMode, grade, levelMode, manualLevel, level } = state;
  const practiceConfig = getPracticeModeConfig(practiceMode, grade);
  const effectiveLevel = levelMode === 'manual' ? manualLevel : level;

  const [fracAnswer, setFracAnswer] = React.useState({ numerator: '', denominator: '' });
  const [mixedAnswer, setMixedAnswer] = React.useState({ whole: '', numerator: '', denominator: '' });
  const [remainderAnswer, setRemainderAnswer] = React.useState({ quotient: '', remainder: '' });
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  useEffect(() => {
    setFracAnswer({ numerator: '', denominator: '' });
    setMixedAnswer({ whole: '', numerator: '', denominator: '' });
    setRemainderAnswer({ quotient: '', remainder: '' });
    setValidationError(null);
    setIsSubmitting(false);
  }, [currentProblem]);

  useEffect(() => {
    if (isCorrect !== null) {
      setIsSubmitting(false);
    }
  }, [isCorrect]);

  const maxTime = timeMode !== 'no-limit' ? getTimeModeConfig(timeMode).seconds || 60 : 60;

  const submitAnswer = (answer: string | Fraction | MixedNumber | RemainderAnswer) => {
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

    if (isMixedNumberProblem(currentProblem)) {
      const whole = parseInt(mixedAnswer.whole, 10);
      const num = parseInt(mixedAnswer.numerator, 10);
      const den = parseInt(mixedAnswer.denominator, 10);
      if (!isNaN(whole) && !isNaN(num) && !isNaN(den) && den !== 0) {
        submitAnswer({ whole, numerator: num, denominator: den });
        return;
      }
      setValidationError('Escribe un número mixto válido.');
      return;
    }

    if (isFractionProblem(currentProblem) || (isMixedNumberConvertProblem(currentProblem) && 'numerator' in currentProblem.answer)) {
      const num = parseInt(fracAnswer.numerator, 10);
      const den = parseInt(fracAnswer.denominator, 10);
      if (!isNaN(num) && !isNaN(den) && den !== 0) {
        submitAnswer({ numerator: num, denominator: den });
        return;
      }
      setValidationError('Escribe un numerador y un denominador válidos.');
      return;
    }

    if (isMixedNumberConvertProblem(currentProblem) && 'whole' in currentProblem.answer) {
      const whole = parseInt(mixedAnswer.whole, 10);
      const num = parseInt(mixedAnswer.numerator, 10);
      const den = parseInt(mixedAnswer.denominator, 10);
      if (!isNaN(whole) && !isNaN(num) && !isNaN(den) && den !== 0) {
        submitAnswer({ whole, numerator: num, denominator: den });
        return;
      }
      setValidationError('Escribe un número mixto válido.');
      return;
    }

    if (isRemainderProblem(currentProblem)) {
      const quotient = parseInt(remainderAnswer.quotient, 10);
      const remainder = parseInt(remainderAnswer.remainder, 10);
      if (!isNaN(quotient) && !isNaN(remainder)) {
        submitAnswer({ quotient, remainder });
        return;
      }
      setValidationError('Escribe cociente y resto.');
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
      case 'addition':
      case 'decimal-addition':
        return '+';
      case 'subtraction':
      case 'decimal-subtraction':
        return '-';
      case 'multiplication':
      case 'decimal-multiplication':
        return '×';
      case 'division':
      case 'decimal-division':
        return '÷';
      case 'integer-addition':
        return '+';
      case 'integer-subtraction':
        return '-';
      case 'integer-multiplication':
        return '×';
      case 'integer-division':
        return '÷';
      case 'mixed':
        return '…';
      default:
        return '+';
    }
  };

  const getTimerColor = () => {
    if (timeMode === 'no-limit') return 'text-gray-500';
    if (timeRemaining > 30) return 'text-green-600';
    if (timeRemaining > 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderMultipleChoice = (
    prompt: string,
    options: Array<{ key: string; label: string; value: string }>,
  ) => (
    <div className="space-y-6">
      <div className="text-2xl font-semibold text-gray-800">{prompt}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((option) => {
          const isSelected = userAnswer === option.value;
          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={isSelected}
              onClick={() => {
                setValidationError(null);
                setAnswer(option.value);
              }}
              disabled={isCorrect !== null}
              className={`rounded-lg border-2 px-4 py-3 text-lg font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-300'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (!currentProblem) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Cargando ejercicio...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="bg-white rounded-lg shadow-lg p-8">
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

        {timeMode !== 'no-limit' && (
          <div className="text-center mb-6">
            <div className={`text-3xl font-bold ${getTimerColor()} ${isTimerActive ? 'animate-pulse' : ''}`}>
              {formatTime(timeRemaining)}
            </div>
            <div className="text-sm text-gray-500 mt-1">Tiempo restante</div>
          </div>
        )}

        <div className="text-center mb-8">
          {isMixedNumberProblem(currentProblem) ? (
            <div className="space-y-4">
              <div className="text-3xl font-semibold text-gray-800">
                {formatMixedNumber(currentProblem.num1)}{' '}
                {currentProblem.operation === 'mixed-number-addition' ? '+' : '-'}{' '}
                {formatMixedNumber(currentProblem.num2)}
              </div>
              <MixedNumberInputs value={mixedAnswer} onChange={setMixedAnswer} disabled={isCorrect !== null} />
            </div>
          ) : isFractionProblem(currentProblem) ? (
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
              <FractionInputs value={fracAnswer} onChange={setFracAnswer} disabled={isCorrect !== null} />
            </>
          ) : isRemainderProblem(currentProblem) ? (
            <div className="space-y-4">
              <div className="text-3xl font-semibold text-gray-800">
                {currentProblem.num1} ÷ {currentProblem.num2} = ? resto ?
              </div>
              <div className="flex items-center justify-center gap-2">
                <input
                  type="number"
                  aria-label="Cociente"
                  className="w-16 border-b-2 border-blue-400 text-center"
                  value={remainderAnswer.quotient}
                  onChange={(e) => setRemainderAnswer((prev) => ({ ...prev, quotient: e.target.value }))}
                  disabled={isCorrect !== null}
                />
                <span>resto</span>
                <input
                  type="number"
                  aria-label="Resto"
                  className="w-16 border-b-2 border-blue-400 text-center"
                  value={remainderAnswer.remainder}
                  onChange={(e) => setRemainderAnswer((prev) => ({ ...prev, remainder: e.target.value }))}
                  disabled={isCorrect !== null}
                />
              </div>
            </div>
          ) : isIntegerCompareProblem(currentProblem) ? (
            renderMultipleChoice(currentProblem.prompt, [
              { key: 'lt', label: compareOperatorLabel('<'), value: '<' },
              { key: 'gt', label: compareOperatorLabel('>'), value: '>' },
            ])
          ) : isIntegerOrderProblem(currentProblem) ? (
            renderMultipleChoice(
              `${currentProblem.prompt} (${currentProblem.values.join(', ')})`,
              currentProblem.options.map((option, index) => ({ key: `${index}`, label: option, value: option })),
            )
          ) : isIntegerArithmeticProblem(currentProblem) ? (
            <div className="space-y-4">
              <div className="text-3xl font-semibold text-gray-800">{currentProblem.display}</div>
              <PromptInput
                userAnswer={userAnswer}
                setAnswer={setAnswer}
                disabled={isCorrect !== null}
                setValidationError={setValidationError}
              />
            </div>
          ) : isProbabilityProblem(currentProblem) ? (
            renderMultipleChoice(
              currentProblem.prompt,
              currentProblem.options.map((option) => ({
                key: String(option),
                label: formatMathNumber(option),
                value: String(option),
              })),
            )
          ) : isCompareProblem(currentProblem) ? (
            renderMultipleChoice(currentProblem.prompt, [
              { key: 'lt', label: compareOperatorLabel('<'), value: '<' },
              { key: 'gt', label: compareOperatorLabel('>'), value: '>' },
              { key: 'eq', label: compareOperatorLabel('='), value: '=' },
            ])
          ) : isOrderValuesProblem(currentProblem) ? (
            renderMultipleChoice(
              `${currentProblem.prompt} (${currentProblem.values.join(', ')})`,
              currentProblem.options.map((option, index) => ({ key: `${index}`, label: option, value: option })),
            )
          ) : isMixedProblem(currentProblem) ? (
            <div className="space-y-4">
              <div className="text-3xl font-semibold text-gray-800">{currentProblem.expression}</div>
              <NumericInput userAnswer={userAnswer} setAnswer={setAnswer} disabled={isCorrect !== null} setValidationError={setValidationError} />
            </div>
          ) : isPowerProblem(currentProblem) ? (
            <div className="space-y-4">
              <div className="text-4xl font-semibold text-gray-800">
                {currentProblem.base}
                <sup className="text-2xl align-super ml-1">{currentProblem.exponent}</sup>
              </div>
              <NumericInput userAnswer={userAnswer} setAnswer={setAnswer} disabled={isCorrect !== null} setValidationError={setValidationError} />
            </div>
          ) : isSquareRootProblem(currentProblem) ? (
            <div className="space-y-4">
              <div className="text-4xl font-semibold text-gray-800">√{currentProblem.radicand}</div>
              <NumericInput userAnswer={userAnswer} setAnswer={setAnswer} disabled={isCorrect !== null} setValidationError={setValidationError} />
            </div>
          ) : isEstimationProblem(currentProblem) ? (
            renderMultipleChoice(
              currentProblem.prompt,
              currentProblem.options.map((option) => ({
                key: String(option),
                label: formatMathNumber(option),
                value: String(option),
              })),
            )
          ) : isAngleProblem(currentProblem) ? (
            renderMultipleChoice(
              currentProblem.prompt,
              currentProblem.options.map((option) => ({
                key: option,
                label: angleTypeLabel(option),
                value: option,
              })),
            )
          ) : isMixedNumberConvertProblem(currentProblem) ? (
            <div className="space-y-4">
              <div className="text-2xl font-semibold text-gray-800">{currentProblem.prompt}</div>
              {'whole' in currentProblem.answer ? (
                <MixedNumberInputs value={mixedAnswer} onChange={setMixedAnswer} disabled={isCorrect !== null} />
              ) : (
                <FractionInputs value={fracAnswer} onChange={setFracAnswer} disabled={isCorrect !== null} />
              )}
            </div>
          ) : isConversionProblem(currentProblem) ? (
            <div className="space-y-4">
              <div className="text-2xl font-semibold text-gray-800">{currentProblem.prompt}</div>
              {currentProblem.operation === 'decimal-to-fraction' ? (
                <FractionInputs value={fracAnswer} onChange={setFracAnswer} disabled={isCorrect !== null} />
              ) : (
                <PromptInput
                  userAnswer={userAnswer}
                  setAnswer={setAnswer}
                  disabled={isCorrect !== null}
                  setValidationError={setValidationError}
                  decimal
                />
              )}
            </div>
          ) : isPromptProblem(currentProblem) ? (
            <div className="space-y-4">
              <div className="text-2xl font-semibold text-gray-800">
                {isFactorizationProblem(currentProblem)
                  ? `Descompón ${currentProblem.target} en factores primos`
                  : currentProblem.prompt}
              </div>
              <PromptInput
                userAnswer={userAnswer}
                setAnswer={setAnswer}
                disabled={isCorrect !== null}
                setValidationError={setValidationError}
                decimal={!isFactorizationProblem(currentProblem) && allowsDecimalAnswer(currentProblem)}
                factorization={isFactorizationProblem(currentProblem)}
              />
            </div>
          ) : 'num1' in currentProblem && typeof currentProblem.num1 === 'number' ? (
            <>
              <span>{formatMathNumber(currentProblem.num1)}</span>
              <span className="mx-2 text-blue-600 text-3xl">{getOperationSymbol(currentProblem.operation)}</span>
              <span>{formatMathNumber(currentProblem.num2)}</span>
              <span className="mx-2">=</span>
              <PromptInput
                userAnswer={userAnswer}
                setAnswer={setAnswer}
                disabled={isCorrect !== null}
                setValidationError={setValidationError}
                decimal={allowsDecimalAnswer(currentProblem)}
              />
            </>
          ) : null}
        </div>

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

        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
          {validationError && (
            <div className="text-sm font-medium text-red-700" role="alert" aria-live="polite">
              {validationError}
            </div>
          )}
          {isCorrect === null && !isMultipleChoiceProblem(currentProblem) && (
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 transition-colors text-lg"
            >
              {isSubmitting ? 'Comprobando...' : 'Enviar'}
            </button>
          )}
          {isCorrect === null && isMultipleChoiceProblem(currentProblem) && (
            <button
              type="button"
              onClick={() => {
                if (typeof userAnswer === 'string' && userAnswer.trim()) {
                  submitAnswer(userAnswer);
                } else {
                  setValidationError('Elige una opción antes de enviar.');
                }
              }}
              className="px-6 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-700 transition-colors text-lg"
            >
              {isSubmitting ? 'Comprobando...' : 'Enviar'}
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

        {isCorrect === true && (
          <div className="mt-6 text-green-700 font-bold text-xl text-center" role="status" aria-live="polite">
            ¡Correcto!
          </div>
        )}
        {isCorrect === false && (
          <div className="mt-6 text-red-700 font-bold text-xl text-center" role="status" aria-live="polite">
            Incorrecto. La respuesta correcta es: {formatProblemAnswer(currentProblem)}
            <pre className="bg-gray-100 rounded p-3 mt-4 text-left text-base whitespace-pre-wrap">
              {currentProblem.explanation}
            </pre>
          </div>
        )}

        <div className="text-center text-sm text-gray-500 mt-4">
          <p>
            Nivel {effectiveLevel} • {practiceConfig.description}
            {levelMode === 'manual' ? ' (manual)' : ''}
          </p>
          {timeMode !== 'no-limit' && <p>Modo contra reloj: {formatTime(timeRemaining)}</p>}
        </div>
      </div>
    </div>
  );
}

function FractionInputs({
  value,
  onChange,
  disabled,
}: {
  value: { numerator: string; denominator: string };
  onChange: React.Dispatch<React.SetStateAction<{ numerator: string; denominator: string }>>;
  disabled: boolean;
}) {
  return (
    <span>
      <input
        type="number"
        inputMode="numeric"
        aria-label="Numerador"
        className="w-14 border-b-2 border-blue-400 text-center mx-1"
        placeholder="Num"
        value={value.numerator}
        onChange={(e) => onChange((prev) => ({ ...prev, numerator: e.target.value }))}
        disabled={disabled}
      />
      <span className="text-xl">/</span>
      <input
        type="number"
        inputMode="numeric"
        aria-label="Denominador"
        className="w-14 border-b-2 border-blue-400 text-center mx-1"
        placeholder="Den"
        value={value.denominator}
        onChange={(e) => onChange((prev) => ({ ...prev, denominator: e.target.value }))}
        disabled={disabled}
      />
    </span>
  );
}

function MixedNumberInputs({
  value,
  onChange,
  disabled,
}: {
  value: { whole: string; numerator: string; denominator: string };
  onChange: React.Dispatch<React.SetStateAction<{ whole: string; numerator: string; denominator: string }>>;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <input
        type="number"
        aria-label="Parte entera"
        className="w-14 border-b-2 border-blue-400 text-center"
        placeholder="Ent"
        value={value.whole}
        onChange={(e) => onChange((prev) => ({ ...prev, whole: e.target.value }))}
        disabled={disabled}
      />
      <FractionInputs
        value={{ numerator: value.numerator, denominator: value.denominator }}
        onChange={(updater) => {
          onChange((prev) => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            return { ...prev, numerator: next.numerator, denominator: next.denominator };
          });
        }}
        disabled={disabled}
      />
    </div>
  );
}

function NumericInput({
  userAnswer,
  setAnswer,
  disabled,
  setValidationError,
}: {
  userAnswer: string | Fraction | MixedNumber | RemainderAnswer;
  setAnswer: (value: string) => void;
  disabled: boolean;
  setValidationError: (value: string | null) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className="text-2xl text-blue-600">=</span>
      <input
        type="number"
        inputMode="numeric"
        aria-label="Tu respuesta"
        placeholder="Tu respuesta"
        className="w-24 border-b-2 border-blue-400 text-center"
        value={typeof userAnswer === 'string' ? userAnswer : ''}
        onChange={(e) => {
          setValidationError(null);
          setAnswer(e.target.value);
        }}
        disabled={disabled}
      />
    </div>
  );
}

function PromptInput({
  userAnswer,
  setAnswer,
  disabled,
  setValidationError,
  decimal = false,
  factorization = false,
}: {
  userAnswer: string | Fraction | MixedNumber | RemainderAnswer;
  setAnswer: (value: string) => void;
  disabled: boolean;
  setValidationError: (value: string | null) => void;
  decimal?: boolean;
  factorization?: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      {!factorization && <span className="text-2xl text-blue-600">=</span>}
      <input
        type={factorization || decimal ? 'text' : 'number'}
        inputMode={factorization ? undefined : decimal ? 'decimal' : 'numeric'}
        step={factorization ? undefined : decimal ? 'any' : '1'}
        aria-label={factorization ? 'Factores primos' : 'Tu respuesta'}
        placeholder={factorization ? '2 x 2 x 3' : 'Tu respuesta'}
        className="w-full max-w-xs border-b-2 border-blue-400 text-center"
        value={typeof userAnswer === 'string' ? userAnswer : ''}
        onChange={(e) => {
          setValidationError(null);
          setAnswer(e.target.value);
        }}
        disabled={disabled}
      />
    </div>
  );
}
