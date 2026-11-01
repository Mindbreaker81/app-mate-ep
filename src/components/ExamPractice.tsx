import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { AuthContext } from '../context/AuthContext';
import type { ExamResult, SerializedAnswer } from '../types';
import { problemSpeechText } from '../utils/problemText';
import { isMultipleChoiceProblem } from '../utils/problemUtils';
import { buildExamQuestions, buildExamResult, collectExamAnswer, saveExamResult } from '../utils/examSession';
import { loadMathKeyboardPreference, saveMathKeyboardPreference } from '../utils/keyboardPreference';
import { ReadAloudButton } from './ReadAloudButton';
import { ProblemBody, buildMathKeyboardProps, type AnswerFieldsState } from './ProblemBody';
import { AnswerKeyboardProvider } from './inputs/AnswerInputs';
import { MathKeyboard } from './inputs/MathKeyboard';

/**
 * Repaso de examen (PIT-32): diez preguntas de las habilidades accesibles, sin
 * tiempo y sin corrección ni pistas mientras se responde. Las soluciones solo
 * aparecen al terminar; el resultado se guarda solo en este dispositivo.
 */
export function ExamPractice({ active = true, onExit }: { active?: boolean; onExit: () => void }) {
  const { state, dispatch } = useGame();
  const exam = state.exam;
  const sessionUserId = React.useContext(AuthContext)?.session?.user.id ?? '';
  const resultsUserId = sessionUserId || 'local';

  const [userAnswer, setUserAnswer] = useState('');
  const [fracAnswer, setFracAnswer] = useState({ numerator: '', denominator: '' });
  const [mixedAnswer, setMixedAnswer] = useState({ whole: '', numerator: '', denominator: '' });
  const [remainderAnswer, setRemainderAnswer] = useState({ quotient: '', remainder: '' });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [confirmingExit, setConfirmingExit] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [keyboardOpen, setKeyboardOpenState] = useState(false);

  useEffect(() => {
    setKeyboardOpenState(loadMathKeyboardPreference(sessionUserId));
  }, [sessionUserId]);
  const setKeyboardOpen = (open: boolean) => {
    setKeyboardOpenState(open);
    saveMathKeyboardPreference(sessionUserId, open);
  };

  const index = exam?.index ?? 0;
  const question = exam?.questions[index];
  const isMultipleChoice = question ? isMultipleChoiceProblem(question.problem) : false;

  // Al cambiar de pregunta los campos vuelven a lo registrado (nada aún).
  useEffect(() => {
    const saved = exam?.answers[index];
    setUserAnswer(typeof saved === 'string' ? saved : '');
    setFracAnswer({ numerator: '', denominator: '' });
    setMixedAnswer({ whole: '', numerator: '', denominator: '' });
    setRemainderAnswer({ quotient: '', remainder: '' });
    setValidationError(null);
    setConfirmingExit(false);
  }, [index, exam]);

  if (!exam || !question) {
    return null;
  }

  const answerFields: AnswerFieldsState = {
    userAnswer,
    setAnswer: setUserAnswer,
    fracAnswer,
    setFracAnswer,
    mixedAnswer,
    setMixedAnswer,
    remainderAnswer,
    setRemainderAnswer,
    setValidationError,
    disabled: false,
  };
  const keyboardProps = buildMathKeyboardProps(question.problem, answerFields);

  const isLast = index + 1 >= exam.questions.length;
  const answered = exam.answers[index] !== undefined;

  const finishExam = (answers: Record<number, SerializedAnswer>) => {
    const res = buildExamResult({ ...exam, answers, finished: true });
    // MVP: el resultado vive solo en localStorage, por usuario y sin envío remoto.
    saveExamResult(resultsUserId, res);
    setResult(res);
    dispatch({ type: 'FINISH_EXAM' });
  };

  const submit = () => {
    if (isMultipleChoice) {
      // La opción ya quedó registrada al tocarla.
      if (!answered) {
        return;
      }
      if (isLast) {
        finishExam(exam.answers);
      } else {
        dispatch({ type: 'ADVANCE_EXAM' });
      }
      return;
    }
    const collected = collectExamAnswer(question.problem, {
      userAnswer,
      fracAnswer,
      mixedAnswer,
      remainderAnswer,
    });
    if (!collected.ok) {
      setValidationError(collected.error);
      return;
    }
    const answers = { ...exam.answers, [index]: collected.answer };
    if (isLast) {
      finishExam(answers);
      return;
    }
    dispatch({ type: 'ANSWER_EXAM', payload: { index, answer: collected.answer } });
    dispatch({ type: 'ADVANCE_EXAM' });
  };

  const exitExam = () => {
    dispatch({ type: 'CANCEL_EXAM' });
    onExit();
  };

  const repeatExam = () => {
    setResult(null);
    dispatch({ type: 'START_EXAM', payload: buildExamQuestions(state.skillProgress) });
  };

  if (exam.finished) {
    const res = result ?? buildExamResult(exam);
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
            📝 Repaso de examen
          </span>
          <h2 className="text-2xl font-bold text-gray-800 mt-3">¡Examen terminado!</h2>
          <p className="text-xl text-gray-700 mt-1" aria-live="polite">
            Has acertado {res.correct} de {res.total}.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Repasa cada pregunta: esto es solo para ti, no cambia tu progreso.
          </p>
        </div>
        <ol className="space-y-3" aria-label="Repaso de las preguntas del examen">
          {res.entries.map((entry, entryIndex) => (
            <li
              key={entryIndex}
              className={`rounded-lg border-2 p-4 text-left ${
                entry.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="text-xl">
                  {entry.isCorrect ? '✅' : '❌'}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">
                    <span className="sr-only">{entry.isCorrect ? 'Correcta: ' : 'Incorrecta: '}</span>
                    Pregunta {entryIndex + 1} · {entry.skillName}
                  </p>
                  <p className="text-gray-800">{entry.question}</p>
                  <p className="mt-1 text-sm">
                    Tu respuesta: <span className="font-semibold">{entry.userAnswer}</span>
                    {!entry.isCorrect && (
                      <>
                        {' · '}Correcta: <span className="font-semibold text-green-800">{entry.correctAnswer}</span>
                      </>
                    )}
                  </p>
                  {exam.questions[entryIndex].problem.explanation && (
                    <pre className="bg-white/70 rounded p-2 mt-2 text-sm whitespace-pre-wrap font-sans text-gray-800">
                      {exam.questions[entryIndex].problem.explanation}
                    </pre>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
          <button
            type="button"
            onClick={repeatExam}
            className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 transition-colors"
          >
            Hacer otro examen
          </button>
          <button
            type="button"
            onClick={exitExam}
            className="px-5 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 transition-colors"
          >
            Volver a mi camino
          </button>
        </div>
      </div>
    );
  }

  return (
    <AnswerKeyboardProvider>
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
            📝 Repaso de examen
          </span>
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
            🧭 {question.skillName}
          </span>
          {confirmingExit ? (
            <span className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">¿Seguro? No contará.</span>
              <button
                type="button"
                onClick={exitExam}
                className="font-semibold text-red-700 underline hover:text-red-800"
              >
                Sí, salir
              </button>
              <button
                type="button"
                onClick={() => setConfirmingExit(false)}
                className="font-semibold text-gray-600 underline hover:text-gray-800"
              >
                Seguir
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingExit(true)}
              className="text-sm text-gray-500 underline hover:text-gray-700"
            >
              Salir del examen
            </button>
          )}
        </div>

        <p className="text-sm text-gray-500 text-center" aria-live="polite">
          Pregunta {index + 1} de {exam.questions.length} · Sin tiempo · Las soluciones salen al final
        </p>
        <div
          className="h-2 bg-gray-200 rounded-full overflow-hidden mt-2 mb-6"
          role="progressbar"
          aria-label="Progreso del examen"
          aria-valuemin={0}
          aria-valuemax={exam.questions.length}
          aria-valuenow={index}
        >
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${(index / exam.questions.length) * 100}%` }}
          />
        </div>

        <div className="text-center mb-8">
          <ProblemBody
            problem={question.problem}
            fields={answerFields}
            onSelectOption={(value) => {
              setValidationError(null);
              setUserAnswer(value);
              dispatch({ type: 'ANSWER_EXAM', payload: { index, answer: value } });
            }}
          />
          <div className="mt-4">
            {/* PIT-31: la lectura voluntaria del enunciado también en el examen. */}
            <ReadAloudButton text={problemSpeechText(question.problem)} active={active} />
          </div>
        </div>

        {keyboardProps && (
          <div className="flex justify-center mt-2">
            <button
              type="button"
              aria-expanded={keyboardOpen}
              aria-controls="teclado-examen"
              onClick={() => setKeyboardOpen(!keyboardOpen)}
              className="text-sm font-semibold text-indigo-600 underline hover:text-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              ⌨️ Teclado {keyboardOpen ? '(cerrar)' : ''}
            </button>
          </div>
        )}
        {keyboardProps && keyboardOpen && (
          <div id="teclado-examen" className="flex justify-center">
            <MathKeyboard {...keyboardProps} />
          </div>
        )}

        <form
          className="flex flex-col items-center gap-4 mt-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          {validationError && (
            <div className="text-sm font-medium text-red-700" role="alert" aria-live="polite">
              {validationError}
            </div>
          )}
          <button
            type="submit"
            disabled={isMultipleChoice && !answered}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 transition-colors text-lg"
          >
            {isLast ? 'Terminar examen' : 'Siguiente'}
          </button>
        </form>
      </div>
    </AnswerKeyboardProvider>
  );
}
