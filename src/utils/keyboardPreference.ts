/**
 * Preferencia local del teclado matemático en pantalla (PIT-18). Igual que la
 * sesión diaria: localStorage por usuario, SIN migración ni game_state. Es una
 * preferencia de dispositivo: cada niño la activa cuando la quiere.
 *
 * El teclado es OPCIONAL y se abre por decisión del niño; nunca sustituye al
 * teclado nativo, así que por defecto está desactivado.
 */

const STORAGE_PREFIX = 'pitagoritas.mathKeyboard.';

const hasWindow = typeof window !== 'undefined';

export function mathKeyboardPreferenceKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId || 'anon'}`;
}

export function loadMathKeyboardPreference(userId: string): boolean {
  if (!hasWindow) {
    return false;
  }
  try {
    const raw = window.localStorage.getItem(mathKeyboardPreferenceKey(userId));
    if (raw === null) {
      return false;
    }
    const parsed = JSON.parse(raw) as { enabled?: unknown };
    return parsed.enabled === true;
  } catch {
    return false;
  }
}

export function saveMathKeyboardPreference(userId: string, enabled: boolean): void {
  if (!hasWindow) {
    return;
  }
  try {
    window.localStorage.setItem(mathKeyboardPreferenceKey(userId), JSON.stringify({ enabled }));
  } catch {
    // Sin storage (navegación privada, cuota llena): la preferencia simplemente
    // no persiste; el teclado sigue funcionando durante la sesión.
  }
}
