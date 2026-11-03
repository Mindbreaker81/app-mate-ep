import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../../context/AuthContext';
import { GameProvider, useGame } from '../../context/GameContext';
import { ExamPractice } from '../ExamPractice';
import type { ExamQuestion } from '../../types';
import { examResultsStorageKey } from '../../utils/examSession';

const mockState = vi.hoisted(() => ({
  fixedProblem: {
    num1: 2,
    num2: 2,
    operation: 'addition' as const,
    answer: 4,
    explanation: 'Suma simple',
  },
}));

vi.mock('../../utils/problemGenerator', () => ({
  generateProblem: vi.fn(() => mockState.fixedProblem),
  generateOperation: vi.fn(() => mockState.fixedProblem),
  getDifficulty: vi.fn(() => 'easy'),
}));

vi.mock('../../services/attemptService', () => ({
  recordAttemptDirect: vi.fn(),
  flushQueue: vi.fn().mockResolvedValue(undefined),
  migrateLegacyData: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../services/statsService', () => ({
  fetchUserStats: vi.fn().mockResolvedValue(null),
  fetchOwnAttempts: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../services/gameStateService', () => ({
  loadGameState: vi.fn().mockResolvedValue(null),
  saveGameState: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../utils/celebration', () => ({ celebrate: vi.fn() }));

const synthMock = vi.hoisted(() => ({
  speak: vi.fn(),
  cancel: vi.fn(),
  getVoices: vi.fn(() => [] as SpeechSynthesisVoice[]),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}));

const QUESTIONS: ExamQuestion[] = [
  {
    skillId: 'sumas-restas',
    skillName: 'Sumas y restas',
    problem: { operation: 'addition', num1: 2, num2: 3, answer: 5, explanation: '2 + 3 = 5' },
  },
  {
    skillId: 'fracciones-basicas',
    skillName: 'Fracciones básicas',
    problem: {
      operation: 'compare-fractions',
      prompt: '¿Qué símbolo va entre 3/4 y 2/4?',
      answer: '>',
      explanation: '3/4 es mayor que 2/4',
    },
  },
  {
    skillId: 'sumas-restas',
    skillName: 'Sumas y restas',
    problem: { operation: 'subtraction', num1: 9, num2: 4, answer: 5, explanation: '9 - 4 = 5' },
  },
];

const exitSpy = vi.hoisted(() => vi.fn());

function Screen() {
  const { state, dispatch } = useGame();
  return (
    <div>
      <div data-testid="exam">{state.exam ? 'activo' : 'no'}</div>
      <button type="button" onClick={() => dispatch({ type: 'START_EXAM', payload: QUESTIONS })}>
        empezar examen
      </button>
      {state.exam ? <ExamPractice onExit={exitSpy} /> : null}
    </div>
  );
}

function renderScreen() {
  const authValue: AuthContextValue = {
    session: null,
    profile: null,
    isAdmin: false,
    loading: false,
    error: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signInAdmin: vi.fn(),
    changePassword: vi.fn(),
    requestPasswordReset: vi.fn(),
    passwordRecovery: false,
    finishPasswordRecovery: vi.fn(),
    signOut: vi.fn(),
    clearError: vi.fn(),
  };
  return render(
    <AuthContext.Provider value={authValue}>
      <GameProvider>
        <Screen />
      </GameProvider>
    </AuthContext.Provider>,
  );
}

function startExam() {
  fireEvent.click(screen.getByRole('button', { name: 'empezar examen' }));
}

describe('ExamPractice — repaso de examen con resultados diferidos (PIT-32)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    vi.stubGlobal('speechSynthesis', synthMock);
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        text = '';
        lang = '';
        rate = 1;
        voice = null;
        onend: (() => void) | null = null;
        onerror: (() => void) | null = null;
        constructor(text?: string) {
          this.text = text ?? '';
        }
      },
    );
  });

  it('muestra la pregunta y el progreso sin temporizador ni corrección inmediata', () => {
    renderScreen();
    startExam();

    expect(screen.getByText(/pregunta 1 de 3/i)).toBeInTheDocument();
    expect(screen.queryByText(/tiempo restante/i)).not.toBeInTheDocument();
    // Sin corrección: no hay «¡Correcto!» ni solución mientras se responde.
    expect(screen.queryByText(/¡correcto!/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/la respuesta correcta es/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/pista/i)).not.toBeInTheDocument();
  });

  it('la voz de PIT-31 sigue disponible durante el examen', () => {
    renderScreen();
    startExam();
    expect(screen.getByRole('button', { name: /escuchar/i })).toBeInTheDocument();
  });

  it('recorre las preguntas guardando respuestas y termina mostrando el resumen', () => {
    renderScreen();
    startExam();

    // Pregunta 1 (numérica): responder y avanzar sin feedback.
    fireEvent.change(screen.getByLabelText('Tu respuesta'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    expect(screen.queryByText(/¡correcto!/i)).not.toBeInTheDocument();
    expect(screen.getByText(/pregunta 2 de 3/i)).toBeInTheDocument();

    // Pregunta 2 (opción múltiple): seleccionar y avanzar.
    fireEvent.click(screen.getByRole('button', { name: /el primero es mayor/i }));
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    expect(screen.getByText(/pregunta 3 de 3/i)).toBeInTheDocument();

    // Pregunta 3: responder mal a propósito y terminar.
    fireEvent.change(screen.getByLabelText('Tu respuesta'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: /terminar/i }));

    // Resumen con soluciones solo ahora.
    expect(screen.getByText(/has acertado 2 de 3/i)).toBeInTheDocument();
    expect(screen.getByText('2 + 3 = 5')).toBeInTheDocument();
    expect(screen.getByText('9 - 4 = 5')).toBeInTheDocument();
  });

  it('no deja avanzar con la respuesta vacía y avisa', () => {
    renderScreen();
    startExam();

    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/respuesta/i);
    expect(screen.getByText(/pregunta 1 de 3/i)).toBeInTheDocument();
  });

  it('en opción múltiple hay que elegir antes de avanzar', () => {
    renderScreen();
    startExam();

    fireEvent.change(screen.getByLabelText('Tu respuesta'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    // Segunda pregunta es de opción múltiple: «Siguiente» deshabilitado hasta elegir.
    const next = screen.getByRole('button', { name: /siguiente/i });
    expect(next).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /el primero es mayor/i }));
    expect(screen.getByRole('button', { name: /siguiente/i })).toBeEnabled();
  });

  it('al terminar guarda el resultado solo en local del usuario y «Volver» lo cierra', () => {
    renderScreen();
    startExam();

    fireEvent.change(screen.getByLabelText('Tu respuesta'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    fireEvent.click(screen.getByRole('button', { name: /el primero es mayor/i }));
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    fireEvent.change(screen.getByLabelText('Tu respuesta'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /terminar/i }));

    const raw = window.localStorage.getItem(examResultsStorageKey('local'));
    expect(raw).toBeTruthy();
    const stored = JSON.parse(raw!);
    expect(stored).toHaveLength(1);
    expect(stored[0].correct).toBe(3);
    expect(stored[0].total).toBe(3);

    fireEvent.click(screen.getByRole('button', { name: /volver a mi camino/i }));
    expect(exitSpy).toHaveBeenCalled();
    expect(screen.getByTestId('exam')).toHaveTextContent('no');
  });

  it('salir del examen pide confirmación y descarta todo sin contar', () => {
    renderScreen();
    startExam();

    fireEvent.click(screen.getByRole('button', { name: /salir del examen/i }));
    fireEvent.click(screen.getByRole('button', { name: /sí, salir/i }));

    expect(exitSpy).toHaveBeenCalled();
    expect(screen.getByTestId('exam')).toHaveTextContent('no');
    expect(window.localStorage.getItem(examResultsStorageKey('local'))).toBeNull();
  });
});
