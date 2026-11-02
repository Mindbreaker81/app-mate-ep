import type { Dispatch, SetStateAction } from 'react';
import type { Fraction, MixedNumber, Problem, RemainderAnswer } from '../types';
import {
  allowsDecimalAnswer,
  allowsNegativeAnswer,
  angleTypeLabel,
  compareOperatorLabel,
  formatMixedNumber,
  isAngleProblem,
  isCompareProblem,
  isConversionProblem,
  isEstimationProblem,
  isFactorizationProblem,
  isFractionPercentProblem,
  isFractionProblem,
  isIntegerArithmeticProblem,
  isIntegerCompareProblem,
  isIntegerOrderProblem,
  isMixedNumberConvertProblem,
  isMixedNumberProblem,
  isMixedProblem,
  isMultipleChoiceProblem,
  isNumberLineProblem,
  isOrderValuesProblem,
  isPowerProblem,
  isProbabilityCompareProblem,
  isProbabilityProblem,
  isPromptProblem,
  isProportionalityProblem,
  isRemainderProblem,
  isSquareRootProblem,
} from '../utils/problemUtils';
import { formatMathNumber } from '../utils/mathUtils';
import { NumberLine } from './visuals/NumberLine';
import {
  FractionInputs,
  MixedNumberInputs,
  NumericInput,
  PromptInput,
  RemainderInputs,
} from './inputs/AnswerInputs';
import type { MathKeyboardField, MathKeyboardProps } from './inputs/MathKeyboard';
import type { FieldEditResult } from '../utils/answerEditing';

/**
 * Campos de respuesta compartidos por el flujo normal (Exercise) y el examen
 * de repaso (PIT-32, ExamPractice): mismo bloque de enunciado + controles,
 * pero cada flujo decide qué hace «responder» (corregir ya vs. registrar).
 */
export interface AnswerFieldsState {
  userAnswer: string | Fraction | MixedNumber | RemainderAnswer;
  setAnswer: (value: string) => void;
  fracAnswer: { numerator: string; denominator: string };
  setFracAnswer: Dispatch<SetStateAction<{ numerator: string; denominator: string }>>;
  mixedAnswer: { whole: string; numerator: string; denominator: string };
  setMixedAnswer: Dispatch<SetStateAction<{ whole: string; numerator: string; denominator: string }>>;
  remainderAnswer: { quotient: string; remainder: string };
  setRemainderAnswer: Dispatch<SetStateAction<{ quotient: string; remainder: string }>>;
  setValidationError: (value: string | null) => void;
  /** Desactiva todos los controles (p. ej. solución ya revelada). */
  disabled: boolean;
}

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

/**
 * Enunciado + control de respuesta del problema (extraído de Exercise para
 * reutilizarlo también en el examen). NO muestra corrección ni solución: eso
 * lo decide el flujo que lo usa. `onSelectOption` recibe el valor tocado en
 * las preguntas de opción múltiple.
 */
export function ProblemBody({
  problem,
  fields,
  onSelectOption,
}: {
  problem: Problem;
  fields: AnswerFieldsState;
  onSelectOption: (value: string) => void;
}) {
  const {
    userAnswer,
    setAnswer,
    fracAnswer,
    setFracAnswer,
    mixedAnswer,
    setMixedAnswer,
    remainderAnswer,
    setRemainderAnswer,
    setValidationError,
    disabled,
  } = fields;

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
              onClick={() => onSelectOption(option.value)}
              disabled={disabled}
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

  return (
    <>
      {isMixedNumberProblem(problem) ? (
        <div className="space-y-4">
          <div className="text-3xl font-semibold text-gray-800">
            {formatMixedNumber(problem.num1)}{' '}
            {problem.operation === 'mixed-number-addition' ? '+' : '-'}{' '}
            {formatMixedNumber(problem.num2)}
          </div>
          <MixedNumberInputs value={mixedAnswer} onChange={setMixedAnswer} disabled={disabled} />
        </div>
      ) : isFractionProblem(problem) ? (
        <>
          <span>{problem.num1.numerator}/{problem.num1.denominator}</span>
          <span className="mx-2 text-blue-600 text-3xl">
            {problem.operation === 'fraction-addition'
              ? '+'
              : problem.operation === 'fraction-subtraction'
                ? '-'
                : problem.operation === 'fraction-multiplication'
                  ? '×'
                  : '÷'}
          </span>
          <span>{problem.num2.numerator}/{problem.num2.denominator}</span>
          <span className="mx-2">=</span>
          <FractionInputs value={fracAnswer} onChange={setFracAnswer} disabled={disabled} />
        </>
      ) : isRemainderProblem(problem) ? (
        <div className="space-y-4">
          <div className="text-3xl font-semibold text-gray-800">
            {problem.num1} ÷ {problem.num2} = ? resto ?
          </div>
          <RemainderInputs value={remainderAnswer} onChange={setRemainderAnswer} disabled={disabled} />
        </div>
      ) : isIntegerCompareProblem(problem) ? (
        renderMultipleChoice(problem.prompt, [
          { key: 'lt', label: compareOperatorLabel('<'), value: '<' },
          { key: 'gt', label: compareOperatorLabel('>'), value: '>' },
        ])
      ) : isIntegerOrderProblem(problem) ? (
        renderMultipleChoice(
          `${problem.prompt} (${problem.values.join(', ')})`,
          problem.options.map((option, index) => ({ key: `${index}`, label: option, value: option })),
        )
      ) : isIntegerArithmeticProblem(problem) ? (
        <div className="space-y-4">
          <div className="text-3xl font-semibold text-gray-800">{problem.display}</div>
          <PromptInput
            userAnswer={userAnswer}
            setAnswer={setAnswer}
            disabled={disabled}
            setValidationError={setValidationError}
            allowNegative
          />
        </div>
      ) : isProbabilityProblem(problem) ? (
        renderMultipleChoice(
          problem.prompt,
          problem.options.map((option) => ({
            key: String(option),
            label: formatMathNumber(option),
            value: String(option),
          })),
        )
      ) : isProportionalityProblem(problem) || isProbabilityCompareProblem(problem) ? (
        renderMultipleChoice(
          problem.prompt,
          problem.options.map((option, index) => ({ key: `${index}`, label: option, value: option })),
        )
      ) : isCompareProblem(problem) ? (
        renderMultipleChoice(problem.prompt, [
          { key: 'lt', label: compareOperatorLabel('<'), value: '<' },
          { key: 'gt', label: compareOperatorLabel('>'), value: '>' },
          { key: 'eq', label: compareOperatorLabel('='), value: '=' },
        ])
      ) : isOrderValuesProblem(problem) ? (
        renderMultipleChoice(
          `${problem.prompt} (${problem.values.join(', ')})`,
          problem.options.map((option, index) => ({ key: `${index}`, label: option, value: option })),
        )
      ) : isMixedProblem(problem) ? (
        <div className="space-y-4">
          <div className="text-3xl font-semibold text-gray-800">{problem.expression}</div>
          <NumericInput userAnswer={userAnswer} setAnswer={setAnswer} disabled={disabled} setValidationError={setValidationError} />
        </div>
      ) : isPowerProblem(problem) ? (
        <div className="space-y-4">
          <div className="text-4xl font-semibold text-gray-800">
            {problem.base}
            <sup className="text-2xl align-super ml-1">{problem.exponent}</sup>
          </div>
          <NumericInput userAnswer={userAnswer} setAnswer={setAnswer} disabled={disabled} setValidationError={setValidationError} />
        </div>
      ) : isSquareRootProblem(problem) ? (
        <div className="space-y-4">
          <div className="text-4xl font-semibold text-gray-800">√{problem.radicand}</div>
          <NumericInput userAnswer={userAnswer} setAnswer={setAnswer} disabled={disabled} setValidationError={setValidationError} />
        </div>
      ) : isEstimationProblem(problem) ? (
        renderMultipleChoice(
          problem.prompt,
          problem.options.map((option) => ({
            key: String(option),
            label: formatMathNumber(option),
            value: String(option),
          })),
        )
      ) : isAngleProblem(problem) ? (
        renderMultipleChoice(
          problem.prompt,
          problem.options.map((option) => ({
            key: option,
            label: angleTypeLabel(option),
            value: option,
          })),
        )
      ) : isMixedNumberConvertProblem(problem) ? (
        <div className="space-y-4">
          <div className="text-2xl font-semibold text-gray-800">{problem.prompt}</div>
          {'whole' in problem.answer ? (
            <MixedNumberInputs value={mixedAnswer} onChange={setMixedAnswer} disabled={disabled} />
          ) : (
            <FractionInputs value={fracAnswer} onChange={setFracAnswer} disabled={disabled} />
          )}
        </div>
      ) : isConversionProblem(problem) ? (
        <div className="space-y-4">
          <div className="text-2xl font-semibold text-gray-800">{problem.prompt}</div>
          {problem.operation === 'decimal-to-fraction' ? (
            <FractionInputs value={fracAnswer} onChange={setFracAnswer} disabled={disabled} />
          ) : (
            <PromptInput
              userAnswer={userAnswer}
              setAnswer={setAnswer}
              disabled={disabled}
              setValidationError={setValidationError}
              decimal
            />
          )}
        </div>
      ) : isFractionPercentProblem(problem) ? (
        <div className="space-y-4">
          <div className="text-2xl font-semibold text-gray-800">{problem.prompt}</div>
          {typeof problem.answer === 'number' ? (
            <NumericInput userAnswer={userAnswer} setAnswer={setAnswer} disabled={disabled} setValidationError={setValidationError} />
          ) : (
            <FractionInputs value={fracAnswer} onChange={setFracAnswer} disabled={disabled} />
          )}
        </div>
      ) : isNumberLineProblem(problem) ? (
        <div className="space-y-4">
          <div className="text-2xl font-semibold text-gray-800 text-center">{problem.prompt}</div>
          <NumberLine problem={problem} />
          <PromptInput
            userAnswer={userAnswer}
            setAnswer={setAnswer}
            disabled={disabled}
            setValidationError={setValidationError}
            decimal={allowsDecimalAnswer(problem)}
            allowNegative={allowsNegativeAnswer(problem)}
          />
        </div>
      ) : isPromptProblem(problem) ? (
        <div className="space-y-4">
          <div className="text-2xl font-semibold text-gray-800">
            {isFactorizationProblem(problem)
              ? `Descompón ${problem.target} en factores primos`
              : problem.prompt}
          </div>
          <PromptInput
            userAnswer={userAnswer}
            setAnswer={setAnswer}
            disabled={disabled}
            setValidationError={setValidationError}
            decimal={!isFactorizationProblem(problem) && allowsDecimalAnswer(problem)}
            factorization={isFactorizationProblem(problem)}
            allowNegative={allowsNegativeAnswer(problem)}
          />
        </div>
      ) : 'num1' in problem && typeof problem.num1 === 'number' ? (
        <>
          <span>{formatMathNumber(problem.num1)}</span>
          <span className="mx-2 text-blue-600 text-3xl">{getOperationSymbol(problem.operation)}</span>
          <span>{formatMathNumber(problem.num2)}</span>
          <span className="mx-2">=</span>
          <PromptInput
            userAnswer={userAnswer}
            setAnswer={setAnswer}
            disabled={disabled}
            setValidationError={setValidationError}
            decimal={allowsDecimalAnswer(problem)}
          />
        </>
      ) : null}
    </>
  );
}

/**
 * Configuración del teclado en pantalla (PIT-18) para el problema actual,
 * con los mismos predicados que el render del enunciado. Compartida por el
 * ejercicio normal y el examen.
 */
export function buildMathKeyboardProps(
  problem: Problem | null,
  fields: Omit<AnswerFieldsState, 'disabled'> & { disabled: boolean },
): MathKeyboardProps | null {
  if (!problem || isMultipleChoiceProblem(problem)) {
    return null;
  }
  const {
    userAnswer,
    setAnswer,
    fracAnswer,
    setFracAnswer,
    mixedAnswer,
    setMixedAnswer,
    remainderAnswer,
    setRemainderAnswer,
    setValidationError,
    disabled,
  } = fields;

  /** Envuelve un setter de campo para aplicarle una edición del teclado. */
  const fieldEdit = (setValue: (value: string) => void) => (next: FieldEditResult) => {
    setValidationError(null);
    setValue(next.value);
  };

  const fractionFields = (): MathKeyboardField[] => [
    { id: 'numerator', label: 'Numerador', value: fracAnswer.numerator, onEdit: fieldEdit((value) => setFracAnswer((prev) => ({ ...prev, numerator: value }))) },
    { id: 'denominator', label: 'Denominador', value: fracAnswer.denominator, onEdit: fieldEdit((value) => setFracAnswer((prev) => ({ ...prev, denominator: value }))) },
  ];

  if (isMixedNumberProblem(problem) || (isMixedNumberConvertProblem(problem) && 'whole' in problem.answer)) {
    return {
      fields: [
        { id: 'whole', label: 'Parte entera', value: mixedAnswer.whole, onEdit: fieldEdit((value) => setMixedAnswer((prev) => ({ ...prev, whole: value }))) },
        { id: 'numerator', label: 'Numerador', value: mixedAnswer.numerator, onEdit: fieldEdit((value) => setMixedAnswer((prev) => ({ ...prev, numerator: value }))) },
        { id: 'denominator', label: 'Denominador', value: mixedAnswer.denominator, onEdit: fieldEdit((value) => setMixedAnswer((prev) => ({ ...prev, denominator: value }))) },
      ],
      fieldSwitcher: 'slash',
      disabled,
    };
  }
  if (
    isFractionProblem(problem) ||
    (isMixedNumberConvertProblem(problem) && 'numerator' in problem.answer) ||
    (isConversionProblem(problem) && problem.operation === 'decimal-to-fraction') ||
    (isFractionPercentProblem(problem) && typeof problem.answer !== 'number')
  ) {
    return { fields: fractionFields(), fieldSwitcher: 'slash', disabled };
  }
  if (isRemainderProblem(problem)) {
    return {
      fields: [
        { id: 'quotient', label: 'Cociente', value: remainderAnswer.quotient, onEdit: fieldEdit((value) => setRemainderAnswer((prev) => ({ ...prev, quotient: value }))) },
        { id: 'remainder', label: 'Resto', value: remainderAnswer.remainder, onEdit: fieldEdit((value) => setRemainderAnswer((prev) => ({ ...prev, remainder: value }))) },
      ],
      fieldSwitcher: 'cycle',
      disabled,
    };
  }
  if (isFactorizationProblem(problem)) {
    return {
      fields: [{ id: 'value', label: 'Factores primos', value: typeof userAnswer === 'string' ? userAnswer : '', onEdit: fieldEdit(setAnswer) }],
      factorization: true,
      disabled,
    };
  }
  return {
    fields: [{ id: 'value', label: 'Respuesta', value: typeof userAnswer === 'string' ? userAnswer : '', onEdit: fieldEdit(setAnswer) }],
    decimal: allowsDecimalAnswer(problem),
    allowNegative: allowsNegativeAnswer(problem),
    disabled,
  };
}
