import { afterEach, describe, expect, it } from 'vitest';
import {
  loadMathKeyboardPreference,
  mathKeyboardPreferenceKey,
  saveMathKeyboardPreference,
} from '../keyboardPreference';

afterEach(() => {
  window.localStorage.clear();
});

describe('preferencia del teclado matemático', () => {
  it('por defecto está desactivada', () => {
    expect(loadMathKeyboardPreference('user-1')).toBe(false);
  });

  it('guarda y carga la preferencia', () => {
    saveMathKeyboardPreference('user-1', true);
    expect(loadMathKeyboardPreference('user-1')).toBe(true);
    saveMathKeyboardPreference('user-1', false);
    expect(loadMathKeyboardPreference('user-1')).toBe(false);
  });

  it('es por usuario: no se mezcla entre niños', () => {
    saveMathKeyboardPreference('user-1', true);
    expect(loadMathKeyboardPreference('user-2')).toBe(false);
    expect(mathKeyboardPreferenceKey('user-1')).not.toBe(mathKeyboardPreferenceKey('user-2'));
  });

  it('descarta datos corruptos en lugar de fallar', () => {
    window.localStorage.setItem(mathKeyboardPreferenceKey('user-1'), 'no-es-json');
    expect(loadMathKeyboardPreference('user-1')).toBe(false);
    window.localStorage.setItem(mathKeyboardPreferenceKey('user-1'), '{"enabled":7}');
    expect(loadMathKeyboardPreference('user-1')).toBe(false);
  });
});
