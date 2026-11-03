import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../../context/AuthContext';
import { GameProvider } from '../../context/GameContext';
import { Home } from '../Home';
import type { Problem } from '../../types';

// El confeti real necesita canvas (no disponible en jsdom): mismo mock que Exercise.flow.
vi.mock('../../utils/celebration', () => ({ celebrate: vi.fn() }));

const problemMocks = vi.hoisted(() => ({
  queue: [] as Problem[],
  fallback: null as Problem | null,
}));

vi.mock('../../utils/problemGenerator', () => ({
  generateProblem: vi.fn(() => (problemMocks.queue.length > 0 ? problemMocks.queue.shift() : problemMocks.fallback)),
  generateOperation: vi.fn(() => (problemMocks.queue.length > 0 ? problemMocks.queue.shift() : problemMocks.fallback)),
  getDifficulty: vi.fn(() => 'easy'),
}));

vi.mock('../../services/attemptService', () => ({
  recordAttemptDirect: vi.fn(),
  flushQueue: vi.fn().mockResolvedValue(undefined),
  migrateLegacyData: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../services/statsService', () => ({
  fetchUserStats: vi.fn().mockResolvedValue(null),
  fetchOwnAttempts: vi.fn().mockResolvedValue(null),
}));

const addition22 = {
  num1: 2,
  num2: 2,
  operation: 'addition',
  answer: 4,
  explanation: 'Paso 1: 2 + 2 = 4.',
} satisfies Problem;

const addition33 = {
  num1: 3,
  num2: 3,
  operation: 'addition',
  answer: 6,
  explanation: 'Paso 1: 3 + 3 = 6.',
} satisfies Problem;

const fractionAddition = {
  num1: { numerator: 1, denominator: 2 },
  num2: { numerator: 1, denominator: 4 },
  operation: 'fraction-addition',
  answer: { numerator: 3, denominator: 4 },
  explanation: 'Paso 1: reducción a común denominador.',
} satisfies Problem;

function renderWithProviders(ui: React.ReactElement) {
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
  return render(<AuthContext.Provider value={authValue}>{ui}</AuthContext.Provider>);
}

function goToExerciseTab() {
  fireEvent.click(screen.getByRole('tab', { name: /ejercicio/i }));
}

function answerInput() {
  // NumericInput es type="number": rol spinbutton con etiqueta «Tu respuesta».
  return screen.getByRole('spinbutton', { name: 'Tu respuesta' });
}

/** El enunciado numérico reparte operandos en varios <span>: se compara el contenedor. */
function numericPrompt(first: number | string, second: number | string) {
  const container = document.querySelector('#exercise-panel .text-center.mb-8');
  // «2 + 2 =» del enunciado más el «=» previo al input numérico.
  expect(container?.textContent).toBe(`${first}+${second}==`);
  return container;
}

describe('Home + Exercise: el estado sobrevive al cambio de pestaña', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    problemMocks.queue = [{ ...addition22 }, { ...addition33 }];
    problemMocks.fallback = { ...addition33 };
  });

  it('dos fallos con cambio de pestaña en medio: conserva el reintento y muestra «Siguiente»', () => {
    renderWithProviders(
      <GameProvider>
        <Home />
      </GameProvider>,
    );

    goToExerciseTab();
    const input = answerInput();
    expect(numericPrompt(2, 2)).toBeInTheDocument();

    // Primer fallo: segundo intento con pistas.
    fireEvent.change(input, { target: { value: '9' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(screen.getByText(/No exactamente\. ¡Inténtalo una vez más!/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Siguiente' })).not.toBeInTheDocument();

    // Cambio de pestaña y vuelta: el segundo intento se conserva.
    fireEvent.click(screen.getByRole('tab', { name: /estadísticas/i }));
    fireEvent.click(screen.getByRole('tab', { name: /ejercicio/i }));

    // Segundo fallo: revela la solución y aparece «Siguiente».
    fireEvent.change(answerInput(), { target: { value: '8' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeInTheDocument();
    expect(screen.getByText(/Paso 1: 2 \+ 2 = 4/)).toBeInTheDocument();
  });

  it('Enter no avanza mientras el ejercicio está oculto; al volver sí', () => {
    renderWithProviders(
      <GameProvider>
        <Home />
      </GameProvider>,
    );

    goToExerciseTab();
    const input = answerInput();
    fireEvent.change(input, { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeInTheDocument();

    // Oculto: Enter no debe avanzar.
    fireEvent.click(screen.getByRole('tab', { name: /estadísticas/i }));
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(numericPrompt(2, 2)).toBeInTheDocument();

    // Visible de nuevo: Enter avanza al siguiente problema.
    fireEvent.click(screen.getByRole('tab', { name: /ejercicio/i }));
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(numericPrompt(3, 3)).toBeInTheDocument();
  });

  it('la respuesta fraccionaria parcial se conserva al cambiar de pestaña', () => {
    problemMocks.queue = [{ ...fractionAddition }, { ...addition33 }];
    renderWithProviders(
      <GameProvider>
        <Home />
      </GameProvider>,
    );

    goToExerciseTab();
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Numerador' }), { target: { value: '3' } });

    fireEvent.click(screen.getByRole('tab', { name: /estadísticas/i }));
    fireEvent.click(screen.getByRole('tab', { name: /ejercicio/i }));

    expect(screen.getByRole('spinbutton', { name: 'Numerador' })).toHaveValue(3);
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Denominador' }), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(screen.getByText('¡Correcto!')).toBeInTheDocument();
  });

  it('el temporizador se pausa al ocultar la pestaña, se reanuda al volver y no se reactiva si llegó a 0', () => {
    vi.useFakeTimers();
    try {
      renderWithProviders(
        <GameProvider>
          <Home />
        </GameProvider>,
      );

      // Activar modo 30 s genera un problema nuevo con temporizador en marcha.
      fireEvent.click(screen.getByRole('tab', { name: /tiempo/i }));
      fireEvent.click(screen.getByRole('button', { name: /30 segundos/i }));
      goToExerciseTab();
      expect(screen.getByText('0:30')).toBeInTheDocument();

      // GameContext programa un setTimeout por render: un act por tick.
      const tick = (times: number) => {
        for (let i = 0; i < times; i += 1) {
          act(() => {
            vi.advanceTimersByTime(1000);
          });
        }
      };

      tick(3);
      expect(screen.getByText('0:27')).toBeInTheDocument();

      // Ocultar: el tiempo se detiene.
      fireEvent.click(screen.getByRole('tab', { name: /estadísticas/i }));
      tick(5);
      expect(screen.getByText('0:27')).toBeInTheDocument();

      // Volver: se reanuda donde estaba.
      goToExerciseTab();
      tick(2);
      expect(screen.getByText('0:25')).toBeInTheDocument();

      // Llegar a 0: el tiempo termina (sin respuesta que autocomprobar).
      tick(25);
      expect(screen.getByText('0:00')).toBeInTheDocument();

      // Cambio de pestaña y vuelta: no se reactiva un temporizador terminado.
      fireEvent.click(screen.getByRole('tab', { name: /estadísticas/i }));
      fireEvent.click(screen.getByRole('tab', { name: /ejercicio/i }));
      tick(3);
      expect(screen.getByText('0:00')).toBeInTheDocument();
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('el temporizador no se reanuda al volver si el modo no tiene límite', () => {
    renderWithProviders(
      <GameProvider>
        <Home />
      </GameProvider>,
    );

    // Modo por defecto «Sin Límite»: nunca hay temporizador que reanudar.
    goToExerciseTab();
    expect(screen.queryByText(/Tiempo restante/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /estadísticas/i }));
    fireEvent.click(screen.getByRole('tab', { name: /ejercicio/i }));
    expect(screen.queryByText(/Tiempo restante/)).not.toBeInTheDocument();
  });

  it('regresión: un temporizador que se activa con la pestaña oculta (cambio de curso) se detiene y se reanuda sin perder tiempo', () => {
    vi.useFakeTimers();
    try {
      problemMocks.queue = [{ ...addition22 }, { ...addition33 }, { ...addition22 }];
      problemMocks.fallback = { ...addition22 };
      renderWithProviders(
        <GameProvider>
          <Home />
        </GameProvider>,
      );

      // Activar 30 s (nuevo problema con temporizador) y volver al ejercicio.
      fireEvent.click(screen.getByRole('tab', { name: /tiempo/i }));
      fireEvent.click(screen.getByRole('button', { name: /30 segundos/i }));
      goToExerciseTab();
      expect(screen.getByText('0:30')).toBeInTheDocument();

      // Ocultar el ejercicio: el temporizador se pausa.
      fireEvent.click(screen.getByRole('tab', { name: /estadísticas/i }));
      for (let i = 0; i < 2; i += 1) {
        act(() => {
          vi.advanceTimersByTime(1000);
        });
      }
      expect(screen.getByText('0:30')).toBeInTheDocument();

      // Con la pestaña oculta, una acción externa (cambio de curso) crea un
      // problema nuevo con temporizador activo: debe detenerse igualmente.
      fireEvent.click(screen.getByRole('button', { name: /5\.º de primaria/i }));
      expect(screen.getByText('0:30')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(4000);
      });
      // Sigue detenido mientras está oculto, con su tiempo completo intacto.
      expect(screen.getByText('0:30')).toBeInTheDocument();

      // Al volver se reanuda (no se reinicia dos ni pierde tiempo).
      goToExerciseTab();
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText('0:29')).toBeInTheDocument();
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });
});
