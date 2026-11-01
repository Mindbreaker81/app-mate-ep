import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReadAloudButton } from '../ReadAloudButton';

class MockUtterance {
  static instances: MockUtterance[] = [];

  text: string;
  lang = '';
  voice: SpeechSynthesisVoice | null = null;
  rate = 1;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;

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

const ES_LOCAL = { lang: 'es-ES', name: 'Lucía', localService: true } as SpeechSynthesisVoice;
const ES_REMOTE = { lang: 'es-MX', name: 'Dalia', localService: false } as SpeechSynthesisVoice;
const EN_VOICE = { lang: 'en-US', name: 'Emma', localService: true } as SpeechSynthesisVoice;

function stubSynthesis(voices: SpeechSynthesisVoice[]) {
  synthMock.getVoices.mockReturnValue(voices);
  vi.stubGlobal('speechSynthesis', synthMock);
  vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance);
}

describe('ReadAloudButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockUtterance.instances = [];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('no renderiza nada si el navegador no soporta la API', () => {
    const { container } = render(<ReadAloudButton text="7 más 5" />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('lee el enunciado al pulsar, con la voz local en español preferida', () => {
    stubSynthesis([ES_REMOTE, ES_LOCAL]);
    render(<ReadAloudButton text="7 más 5" />);

    fireEvent.click(screen.getByRole('button', { name: /escuchar/i }));

    expect(synthMock.speak).toHaveBeenCalledTimes(1);
    const utterance = MockUtterance.instances[0];
    expect(utterance.text).toBe('7 más 5');
    expect(utterance.voice).toBe(ES_LOCAL);
    expect(utterance.lang).toBe('es-ES');
  });

  it('cambia a «Detener» y para la lectura al volver a pulsar', () => {
    stubSynthesis([ES_LOCAL]);
    render(<ReadAloudButton text="7 más 5" />);

    fireEvent.click(screen.getByRole('button', { name: /escuchar/i }));
    const stopButton = screen.getByRole('button', { name: /detener/i });
    expect(stopButton).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(stopButton);
    expect(synthMock.cancel).toHaveBeenCalled();
  });

  it('no lee nada por sí sola (sin autoplay)', () => {
    stubSynthesis([ES_LOCAL]);
    render(<ReadAloudButton text="7 más 5" />);
    expect(synthMock.speak).not.toHaveBeenCalled();
  });

  it('avisa sin leer si no hay voz en español en el dispositivo', () => {
    stubSynthesis([EN_VOICE]);
    render(<ReadAloudButton text="7 más 5" />);

    expect(screen.getByText(/sin voz en español/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /escuchar/i })).not.toBeInTheDocument();
  });

  it('cancela la lectura al desmontar', () => {
    stubSynthesis([ES_LOCAL]);
    const { unmount } = render(<ReadAloudButton text="7 más 5" />);
    fireEvent.click(screen.getByRole('button', { name: /escuchar/i }));

    unmount();
    expect(synthMock.cancel).toHaveBeenCalled();
  });

  it('cancela la lectura al cambiar de enunciado', () => {
    stubSynthesis([ES_LOCAL]);
    const { rerender } = render(<ReadAloudButton text="7 más 5" />);
    fireEvent.click(screen.getByRole('button', { name: /escuchar/i }));
    synthMock.cancel.mockClear();

    rerender(<ReadAloudButton text="9 menos 4" />);
    expect(synthMock.cancel).toHaveBeenCalled();
  });

  it('cancela la lectura al ocultar la pestaña', () => {
    stubSynthesis([ES_LOCAL]);
    const { rerender } = render(<ReadAloudButton text="7 más 5" active />);
    fireEvent.click(screen.getByRole('button', { name: /escuchar/i }));
    synthMock.cancel.mockClear();

    rerender(<ReadAloudButton text="7 más 5" active={false} />);
    expect(synthMock.cancel).toHaveBeenCalled();
  });
});
