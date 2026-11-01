import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Exercise } from '../Exercise';

class MockUtterance {
  static instances: MockUtterance[] = [];

  text: string;
  lang = '';
  voice: SpeechSynthesisVoice | null = null;
  rate = 1;

  constructor(text: string) {
    this.text = text;
    MockUtterance.instances.push(this);
  }
}

const synthMock = {
  speak: vi.fn(),
  cancel: vi.fn(),
  getVoices: vi.fn(() => [] as SpeechSynthesisVoice[]),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  paused: false,
  pending: false,
  speaking: false,
};

const exerciseMocks = vi.hoisted(() => ({
  checkAnswer: vi.fn(),
  nextProblem: vi.fn(),
  setAnswer: vi.fn(),
  dispatch: vi.fn(),
  state: {
    currentProblem: null as unknown,
    userAnswer: '',
    isCorrect: null,
    timeRemaining: 0,
    isTimerActive: false,
    practiceMode: 'all',
    timeMode: 'no-limit',
    grade: '5e',
    levelMode: 'auto',
    manualLevel: 1,
    level: 1,
    pathSkillId: null,
    skillProgress: {},
    streak: 0,
    dailySession: null,
    sessionDone: 0,
  },
}));

vi.mock('../../context/GameContext', () => ({
  useGame: () => ({
    state: exerciseMocks.state,
    checkAnswer: exerciseMocks.checkAnswer,
    nextProblem: exerciseMocks.nextProblem,
    setAnswer: exerciseMocks.setAnswer,
    dispatch: exerciseMocks.dispatch,
  }),
}));

const ADDITION = {
  num1: 7,
  num2: 5,
  operation: 'addition',
  answer: 12,
  explanation: '',
};

const ES_VOICE = { lang: 'es-ES', name: 'Lucía', localService: true } as SpeechSynthesisVoice;

function stubSynthesis(voices = [ES_VOICE]) {
  synthMock.getVoices.mockReturnValue(voices);
  vi.stubGlobal('speechSynthesis', synthMock);
  vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance);
}

describe('Exercise — lectura voluntaria del enunciado (PIT-31)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockUtterance.instances = [];
    Object.assign(exerciseMocks.state, { currentProblem: ADDITION });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('ofrece el botón de escuchar y no lee nada por sí solo', () => {
    stubSynthesis();
    render(<Exercise />);

    expect(screen.getByRole('button', { name: /escuchar/i })).toBeInTheDocument();
    expect(synthMock.speak).not.toHaveBeenCalled();
  });

  it('lee el enunciado verbalizado al pulsar el botón', () => {
    stubSynthesis();
    render(<Exercise />);

    fireEvent.click(screen.getByRole('button', { name: /escuchar/i }));

    expect(synthMock.speak).toHaveBeenCalledTimes(1);
    expect(MockUtterance.instances[0].text).toBe('7 más 5');
  });

  it('sin soporte de la API no aparece el botón', () => {
    // jsdom no trae speechSynthesis: sin stub, el botón no debe existir.
    render(<Exercise />);
    expect(screen.queryByRole('button', { name: /escuchar/i })).not.toBeInTheDocument();
  });

  it('cancela la lectura al cambiar de ejercicio', () => {
    stubSynthesis();
    const { rerender } = render(<Exercise />);
    fireEvent.click(screen.getByRole('button', { name: /escuchar/i }));
    synthMock.cancel.mockClear();

    Object.assign(exerciseMocks.state, {
      currentProblem: { ...ADDITION, num1: 9, num2: 4 },
    });
    rerender(<Exercise />);

    expect(synthMock.cancel).toHaveBeenCalled();
  });

  it('cancela la lectura al ocultar la pestaña del ejercicio', () => {
    stubSynthesis();
    const { rerender } = render(<Exercise active />);
    fireEvent.click(screen.getByRole('button', { name: /escuchar/i }));
    synthMock.cancel.mockClear();

    rerender(<Exercise active={false} />);
    expect(synthMock.cancel).toHaveBeenCalled();
  });
});
