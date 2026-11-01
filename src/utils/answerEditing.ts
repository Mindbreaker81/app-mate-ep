/**
 * Edición pura de campos de respuesta para el teclado matemático en pantalla
 * (PIT-18). Las funciones no tocan el DOM: reciben el valor y las posiciones
 * del cursor y devuelven el nuevo valor y dónde debe quedar el cursor. El
 * componente que llama es responsable de aplicarlos al estado y restaurar la
 * selección en el input.
 */

export interface FieldEditResult {
  value: string;
  caret: number;
}

/** Sujeta una posición a [0, value.length]. */
function clampCaret(value: string, position: number): number {
  return Math.max(0, Math.min(position, value.length));
}

/** Inserta `text` en el cursor o sustituyendo la selección [start, end). */
export function insertText(current: string, start: number, end: number, text: string): FieldEditResult {
  const from = clampCaret(current, start);
  const to = clampCaret(current, end);
  const [selectionStart, selectionEnd] = from <= to ? [from, to] : [to, from];
  const value = current.slice(0, selectionStart) + text + current.slice(selectionEnd);
  return { value, caret: selectionStart + text.length };
}

/** Comportamiento de retroceso: borra la selección o el carácter anterior. */
export function deleteBackward(current: string, start: number, end: number): FieldEditResult {
  const from = clampCaret(current, start);
  const to = clampCaret(current, end);
  const [selectionStart, selectionEnd] = from <= to ? [from, to] : [to, from];
  if (selectionStart !== selectionEnd) {
    return { value: current.slice(0, selectionStart) + current.slice(selectionEnd), caret: selectionStart };
  }
  if (selectionStart === 0) {
    return { value: current, caret: 0 };
  }
  return { value: current.slice(0, selectionStart - 1) + current.slice(selectionEnd), caret: selectionStart - 1 };
}

/** Cambia el signo del campo completo (igual que el botón ± actual). */
export function toggleNumericSign(current: string): string {
  return current.startsWith('-') ? current.slice(1) : `-${current}`;
}
