import React, { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { formatTime, getTimeModeConfig } from '../utils/timeConfig';
import { getPracticeModeConfig } from '../utils/practiceConfig';
import type { Fraction, MixedNumber, Operation, RemainderAnswer } from '../types';
import { MathGlossary } from './MathGlossary';
import { glossaryTermsForOperation } from '../utils/glossary';
import {
  isFactorizationProblem,
  isFractionProblem,
  isMixedNumberConvertProblem,
  isMixedNumberProblem,
  isMultipleChoiceProblem,
  isRemainderProblem,
  normalizeFactorizationAnswer,
  formatProblemAnswer,
} from '../utils/problemUtils';
import { celebrate } from '../utils/celebration';
import { getSkillById } from '../utils/skillCatalog';
import { buildHint, simplifiableFractionNote, typicalMistakeMessage } from '../utils/hints';
import { problemSpeechText } from '../utils/problemText';
import { ReadAloudButton } from './ReadAloudButton';
import { AnswerKeyboardProvider } from './inputs/AnswerInputs';
import { MathKeyboard } from './inputs/MathKeyboard';
import { loadMathKeyboardPreference, saveMathKeyboardPreference } from '../utils/keyboardPreference';
import { AuthContext } from '../context/AuthContext';
import { ProblemBody, buildMathKeyboardProps, type AnswerFieldsState } from './ProblemBody';

export function Exercise({ active = true }: { active?: boolean }) {
  const { state, checkAnswer, nextProblem, setAnswer, dispatch } = useGame();
  const { currentProblem, userAnswer, isCorrect, timeRemaining, isTimerActive, practiceMode, timeMode, grade, levelMode, manualLevel, level, pathSkillId } = state;
  const practiceConfig = getPracticeModeConfig(practiceMode, grade);
  const effectiveLevel = levelMode === 'manual' ? manualLevel : level;
  const pathSkill = pathSkillId ? getSkillById(pathSkillId) : null;

  const [fracAnswer, setFracAnswer] = React.useState({ numerator: '', denominator: '' });
  const [mixedAnswer, setMixedAnswer] = React.useState({ whole: '', numerator: '', denominator: '' });
  const [remainderAnswer, setRemainderAnswer] = React.useState({ quotient: '', remainder: '' });
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showExplanation, setShowExplanation] = React.useState(false);
  // Segundo intento antes de revelar la solución (F4).
  const [attemptCount, setAttemptCount] = React.useState(0);
  const [hintLevel, setHintLevel] = React.useState<0 | 1 | 2>(0);
  // Glosario (PIT-21): overlay modal, no desmonta el ejercicio.
  const [glossaryTermId, setGlossaryTermId] = React.useState<string | null>(null);

  // La solución solo se revela tras fallar dos veces.
  const revealed = isCorrect === false && attemptCount >= 2;

  // Teclado matemático opcional (PIT-18): lo abre el niño, nunca sustituye al
  // nativo. Preferencia local por usuario, sin migración.
  const sessionUserId = React.useContext(AuthContext)?.session?.user.id ?? '';
  const [keyboardOpen, setKeyboardOpenState] = React.useState(false);
  useEffect(() => {
    setKeyboardOpenState(loadMathKeyboardPreference(sessionUserId));
  }, [sessionUserId]);
  const setKeyboardOpen = (open: boolean) => {
    setKeyboardOpenState(open);
    saveMathKeyboardPreference(sessionUserId, open);
  };

  // Enunciado y controles compartidos con el examen (PIT-32): aquí responder
  // corrige al momento (submitAnswer → checkAnswer del flujo normal).
  const answerFields: AnswerFieldsState = {
    userAnswer,
    setAnswer,
    fracAnswer,
    setFracAnswer,
    mixedAnswer,
    setMixedAnswer,
    remainderAnswer,
    setRemainderAnswer,
    setValidationError,
    disabled: revealed,
  };

  const keyboardProps = buildMathKeyboardProps(currentProblem, answerFields);

  useEffect(() => {
    setFracAnswer({ numerator: '', denominator: '' });
    setMixedAnswer({ whole: '', numerator: '', denominator: '' });
    setRemainderAnswer({ quotient: '', remainder: '' });
    setValidationError(null);
    setIsSubmitting(false);
    setShowExplanation(false);
    setAttemptCount(0);
    setHintLevel(0);
    setGlossaryTermId(null);
  }, [currentProblem]);

  useEffect(() => {
    if (isCorrect !== null) {
      setIsSubmitting(false);
    }
    if (isCorrect === true) {
      celebrate(state.streak);
    }
  }, [isCorrect, state.streak]);

  // Enter avanza al responder correcto o cuando la solución ya está revelada
  // (no durante el segundo intento, para no saltárselo sin querer).
  // Cuando el ejercicio está oculto (otra pestaña activa) el listener no se registra.
  const canAdvance = isCorrect === true || revealed;

  useEffect(() => {
    if (!active || isCorrect === null || !canAdvance) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        nextProblem();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, isCorrect, canAdvance, nextProblem]);

  // El temporizador se pausa al ocultar la pestaña y se reanuda al volver,
  // solo si lo pausó el ocultado, el modo tiene límite y no se agotó (0 s).
  // También cubre temporizadores que se ACTIVAN con el ejercicio oculto
  // (CHECK_SESSION_DAY al cruzar medianoche, cambio de curso/modo/nivel):
  // esas acciones ponen isTimerActive a true y esta rama las detiene,
  // dejando el tiempo restante intacto para reanudarlo al volver. Sin bucles:
  // STOP_TIMER solo se despacha si isTimerActive es true.
  const timerPausedByHide = React.useRef(false);

  useEffect(() => {
    if (!active) {
      if (isTimerActive) {
        dispatch({ type: 'STOP_TIMER' });
        timerPausedByHide.current = true;
      }
      return;
    }
    if (timerPausedByHide.current) {
      timerPausedByHide.current = false;
      if (timeMode !== 'no-limit' && !isTimerActive && timeRemaining > 0) {
        dispatch({ type: 'START_TIMER' });
      }
    }
  }, [active, isTimerActive, timeMode, timeRemaining, dispatch]);

  const maxTime = timeMode !== 'no-limit' ? getTimeModeConfig(timeMode).seconds || 60 : 60;

  const submitAnswer = (answer: string | Fraction | MixedNumber | RemainderAnswer) => {
    setValidationError(null);
    setIsSubmitting(true);
    setAttemptCount((count) => count + 1);
    setAnswer(answer);
    checkAnswer(answer);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProblem || isCorrect === true || revealed) {
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

  const getTimerColor = () => {
    if (timeMode === 'no-limit') return 'text-gray-500';
    if (timeRemaining > 30) return 'text-green-600';
    if (timeRemaining > 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  // F4: mensaje de error típico y pistas graduales durante el segundo intento.
  const mistakeMessage =
    isCorrect === false && !revealed && currentProblem && typeof userAnswer === 'string' && userAnswer.trim() !== ''
      ? typicalMistakeMessage(currentProblem, userAnswer)
      : null;
  const hintText = hintLevel > 0 && currentProblem ? buildHint(currentProblem, hintLevel as 1 | 2) : null;
  const simplificationNote =
    isCorrect === true &&
    currentProblem &&
    isFractionProblem(currentProblem) &&
    fracAnswer.numerator !== '' &&
    fracAnswer.denominator !== ''
      ? simplifiableFractionNote(
          currentProblem,
          Number.parseInt(fracAnswer.numerator, 10),
          Number.parseInt(fracAnswer.denominator, 10),
        )
      : null;

  if (!currentProblem) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Cargando ejercicio...</p>
      </div>
    );
  }

  return (
    <AnswerKeyboardProvider>
      <div className="relative">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6 flex flex-wrap gap-2 justify-center">
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              <span>{practiceConfig.icon}</span>
              <span>{practiceConfig.label}</span>
            </div>
            {pathSkill && (
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                <span>🧭</span>
                <span>
                  {pathSkill.name} · Nivel {state.skillProgress[state.pathSkillId ?? '']?.level ?? 1}/3
                </span>
              </div>
            )}
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
            <ProblemBody
              problem={currentProblem}
              fields={answerFields}
              onSelectOption={(value) => {
                setValidationError(null);
                setAnswer(value);
                submitAnswer(value);
              }}
            />
            <div className="mt-4">
              {/* PIT-31: lectura voluntaria del enunciado (nunca de la solución). */}
              <ReadAloudButton text={problemSpeechText(currentProblem)} active={active} />
            </div>
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

          {keyboardProps && (
            <div className="flex justify-center mt-2">
              <button
                type="button"
                aria-expanded={keyboardOpen}
                aria-controls="teclado-matematico"
                onClick={() => setKeyboardOpen(!keyboardOpen)}
                className="text-sm font-semibold text-blue-600 underline hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                ⌨️ Teclado {keyboardOpen ? '(cerrar)' : ''}
              </button>
            </div>
          )}
          {keyboardProps && keyboardOpen && (
            <div id="teclado-matematico" className="flex justify-center">
              <MathKeyboard {...keyboardProps} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
            {validationError && (
              <div className="text-sm font-medium text-red-700" role="alert" aria-live="polite">
                {validationError}
              </div>
            )}
            {!revealed && isCorrect !== true && !isMultipleChoiceProblem(currentProblem) && (
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 transition-colors text-lg"
              >
                {isSubmitting ? 'Comprobando...' : 'Enviar'}
              </button>
            )}
            {(isCorrect === true || revealed) && (
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
              {simplificationNote && (
                <p className="text-base font-normal text-blue-800 mt-1" role="status">
                  {simplificationNote}
                </p>
              )}
              <div className="mt-3">
                {showExplanation ? (
                  <>
                    <ExplanationBox explanation={currentProblem.explanation} />
                    <GlossaryTermLinks operation={currentProblem.operation} onOpen={setGlossaryTermId} />
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowExplanation(true)}
                    className="text-sm font-semibold text-blue-600 underline hover:text-blue-800"
                  >
                    ¿Por qué?
                  </button>
                )}
              </div>
            </div>
          )}
          {isCorrect === false && !revealed && (
            <div className="mt-6 text-orange-700 font-bold text-xl text-center" role="status" aria-live="polite">
              No exactamente. ¡Inténtalo una vez más!
              {mistakeMessage && (
                <p className="text-base font-normal text-orange-800 mt-1">{mistakeMessage}</p>
              )}
              {hintText && (
                <ExplanationBox explanation={`💡 ${hintText}`} />
              )}
              {hintLevel < 2 && (
                <button
                  type="button"
                  onClick={() => setHintLevel((current) => (current === 0 ? 1 : 2) as 1 | 2)}
                  className="mt-2 text-sm font-semibold text-blue-600 underline hover:text-blue-800"
                >
                  💡 Dar una pista
                </button>
              )}
            </div>
          )}
          {revealed && (
            <div className="mt-6 text-red-700 font-bold text-xl text-center" role="status" aria-live="polite">
              La respuesta correcta es: {formatProblemAnswer(currentProblem)}
              <ExplanationBox explanation={currentProblem.explanation} />
              <GlossaryTermLinks operation={currentProblem.operation} onOpen={setGlossaryTermId} />
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
      {glossaryTermId !== null && (
        <MathGlossary initialTermId={glossaryTermId} onClose={() => setGlossaryTermId(null)} />
      )}
    </AnswerKeyboardProvider>
  );
}

function ExplanationBox({ explanation }: { explanation: string }) {
  return (
    <pre className="bg-gray-100 rounded p-3 mt-4 text-left text-base whitespace-pre-wrap font-sans font-normal text-gray-800">
      {explanation}
    </pre>
  );
}

// Enlaces al glosario por IDs de término explícitos según la operación (PIT-21).
function GlossaryTermLinks({
  operation,
  onOpen,
}: {
  operation: Operation;
  onOpen: (termId: string) => void;
}) {
  const terms = glossaryTermsForOperation(operation);
  if (terms.length === 0) {
    return null;
  }
  return (
    <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-base font-normal text-gray-700">
      <span aria-hidden="true">📖</span>
      <span className="font-semibold">Glosario:</span>
      {terms.map((term) => (
        <button
          key={term.id}
          type="button"
          onClick={() => onOpen(term.id)}
          aria-label={`Ver «${term.es}» en el glosario`}
          className="rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800 hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 transition-colors"
        >
          {term.es} · {term.ca}
        </button>
      ))}
    </div>
  );
}
