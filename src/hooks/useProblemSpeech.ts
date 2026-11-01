import { useCallback, useEffect, useRef, useState } from 'react';

export interface ProblemSpeech {
  /** true si el navegador tiene la API de síntesis de voz. */
  supported: boolean;
  /** true mientras se está reproduciendo (o encolada) la lectura actual. */
  speaking: boolean;
  /**
   * true si la API existe pero el dispositivo no ofrece ninguna voz en
   * español: en ese caso se mantiene el texto y se avisa, sin leer.
   */
  noSpanishVoice: boolean;
  /** Alterna leer/detener; no hace nada si la API no está soportada. */
  toggle(): void;
  /** Detiene la lectura en curso. */
  cancel(): void;
}

function getSynthesis(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
    ? window.speechSynthesis
    : null;
}

function isSpanish(voice: SpeechSynthesisVoice): boolean {
  return voice.lang.toLowerCase().startsWith('es');
}

/**
 * Lectura voluntaria del enunciado con SpeechSynthesis (PIT-31):
 * - Voz en castellano primero: prefiere voces locales (`localService`) con
 *   lang es*; si no hay, usa lang 'es-ES' sin forzar voz.
 * - La lectura se cancela al cambiar de enunciado, al ocultar la pestaña y
 *   al desmontar el componente.
 * - Nunca arranca sola (sin autoplay): solo `toggle()` dispara `speak()`.
 */
export function useProblemSpeech(text: string): ProblemSpeech {
  const synth = getSynthesis();
  const supported = synth !== null && typeof SpeechSynthesisUtterance === 'function';
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() =>
    supported && synth ? synth.getVoices() : [],
  );
  const [speaking, setSpeaking] = useState(false);
  const textRef = useRef(text);
  textRef.current = text;

  // Las voces se descubren en ejecución y pueden llegar tarde.
  useEffect(() => {
    if (!supported || !synth) {
      return undefined;
    }
    const updateVoices = () => setVoices(synth.getVoices());
    updateVoices();
    synth.addEventListener('voiceschanged', updateVoices);
    return () => synth.removeEventListener('voiceschanged', updateVoices);
  }, [supported, synth]);

  const cancel = useCallback(() => {
    if (!supported || !synth) {
      return;
    }
    synth.cancel();
    setSpeaking(false);
  }, [supported, synth]);

  // Al cambiar de enunciado (o al desmontar) se cancela la lectura en curso.
  useEffect(() => cancel, [text, cancel]);

  // Al ocultar la pestaña del navegador también se detiene la lectura.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        cancel();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [cancel]);

  const toggle = useCallback(() => {
    if (!supported || !synth) {
      return;
    }
    if (speaking) {
      cancel();
      return;
    }
    try {
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(textRef.current);
      const spanishVoices = voices.filter(isSpanish);
      // Política mínima de voz: preferir una voz local en español.
      const voice = spanishVoices.find((item) => item.localService !== false) ?? spanishVoices[0] ?? null;
      if (voice) {
        utterance.voice = voice;
      }
      utterance.lang = voice?.lang ?? 'es-ES';
      utterance.rate = 0.95;
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      synth.speak(utterance);
      setSpeaking(true);
    } catch {
      setSpeaking(false);
    }
  }, [supported, synth, speaking, cancel, voices]);

  return {
    supported,
    speaking,
    noSpanishVoice: voices.length > 0 && !voices.some(isSpanish),
    toggle,
    cancel,
  };
}
