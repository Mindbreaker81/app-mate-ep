import { useEffect } from 'react';
import { useProblemSpeech } from '../hooks/useProblemSpeech';

interface ReadAloudButtonProps {
  /** Texto ya verbalizado que se leerá en voz alta. */
  text: string;
  /** false cuando el ejercicio está en una pestaña oculta: detiene la lectura. */
  active?: boolean;
}

/**
 * Botón «Escuchar» para leer el enunciado en voz alta (PIT-31).
 * - Solo aparece si el navegador soporta SpeechSynthesis.
 * - Si no hay voz en español en el dispositivo, muestra un aviso y no lee.
 * - Es voluntaria (sin autoplay): inicia y para con el mismo control accesible.
 */
export function ReadAloudButton({ text, active = true }: ReadAloudButtonProps) {
  const { supported, speaking, noSpanishVoice, toggle, cancel } = useProblemSpeech(text);

  // Al ocultar el ejercicio (otra pestaña interna) se detiene la lectura.
  useEffect(() => {
    if (!active) {
      cancel();
    }
  }, [active, cancel]);

  if (!supported) {
    return null;
  }

  if (noSpanishVoice) {
    return (
      <p className="text-sm text-gray-500">🔇 Sin voz en español en este dispositivo</p>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={speaking}
      className="inline-flex items-center gap-2 rounded-full border-2 border-indigo-200 bg-indigo-50 px-4 py-1 text-sm font-semibold text-indigo-800 transition-colors hover:border-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
    >
      {speaking ? '⏹ Detener lectura' : '🔊 Escuchar'}
    </button>
  );
}
