import { describe, expect, it } from 'vitest';
import { deleteBackward, insertText, toggleNumericSign } from '../answerEditing';

describe('insertText', () => {
  it('inserta al final cuando no hay selección', () => {
    expect(insertText('12', 2, 2, '3')).toEqual({ value: '123', caret: 3 });
  });

  it('inserta en medio respetando el cursor', () => {
    expect(insertText('15', 1, 1, '2')).toEqual({ value: '125', caret: 2 });
  });

  it('sustituye el texto seleccionado', () => {
    expect(insertText('125', 1, 2, '7')).toEqual({ value: '175', caret: 2 });
    expect(insertText('125', 1, 3, '7')).toEqual({ value: '17', caret: 2 });
  });

  it('sujeta cursores fuera de rango (valor recién cambiado)', () => {
    expect(insertText('12', 99, 99, '3')).toEqual({ value: '123', caret: 3 });
    expect(insertText('12', -5, -5, '3')).toEqual({ value: '312', caret: 1 });
  });

  it('funciona con el campo vacío', () => {
    expect(insertText('', 0, 0, '7')).toEqual({ value: '7', caret: 1 });
  });

  it('permite insertar varios caracteres (coma y dígito juntos)', () => {
    expect(insertText('1', 1, 1, ',5')).toEqual({ value: '1,5', caret: 3 });
  });
});

describe('deleteBackward', () => {
  it('borra la selección completa', () => {
    expect(deleteBackward('1234', 1, 3)).toEqual({ value: '14', caret: 1 });
  });

  it('borra el carácter anterior al cursor', () => {
    expect(deleteBackward('123', 2, 2)).toEqual({ value: '13', caret: 1 });
  });

  it('no hace nada con el cursor al inicio y sin selección', () => {
    expect(deleteBackward('123', 0, 0)).toEqual({ value: '123', caret: 0 });
  });

  it('sujeta cursores fuera de rango', () => {
    expect(deleteBackward('12', 99, 99)).toEqual({ value: '1', caret: 1 });
  });
});

describe('toggleNumericSign', () => {
  it('añade el signo a un número positivo', () => {
    expect(toggleNumericSign('25')).toBe('-25');
  });

  it('quita el signo a un número negativo', () => {
    expect(toggleNumericSign('-25')).toBe('25');
  });

  it('con el campo vacío deja solo el signo', () => {
    expect(toggleNumericSign('')).toBe('-');
  });

  it('con solo el signo lo quita', () => {
    expect(toggleNumericSign('-')).toBe('');
  });

  it('mantiene los decimales', () => {
    expect(toggleNumericSign('3,5')).toBe('-3,5');
    expect(toggleNumericSign('-3,5')).toBe('3,5');
  });
});
