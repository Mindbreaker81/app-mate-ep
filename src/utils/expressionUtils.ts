import type { MixedToken } from '../types';

export function evaluateMathTokens(tokens: MixedToken[]): number {
  let index = 0;

  const parseExpression = (): number => {
    let value = parseTerm();

    while (tokens[index] === '+' || tokens[index] === '-') {
      const operator = tokens[index];
      index += 1;
      const nextValue = parseTerm();
      value = operator === '+' ? value + nextValue : value - nextValue;
    }

    return value;
  };

  const parseTerm = (): number => {
    let value = parseFactor();

    while (tokens[index] === '×' || tokens[index] === '÷') {
      const operator = tokens[index];
      index += 1;
      const nextValue = parseFactor();
      value = operator === '×' ? value * nextValue : value / nextValue;
    }

    return value;
  };

  const parseFactor = (): number => {
    const token = tokens[index];

    if (typeof token === 'number') {
      index += 1;
      return token;
    }

    if (token === '(') {
      index += 1;
      const value = parseExpression();
      if (tokens[index] !== ')') {
        throw new Error('Paréntesis sin cerrar en expresión mixta.');
      }
      index += 1;
      return value;
    }

    throw new Error(`Token no válido en expresión mixta: ${String(token)}`);
  };

  const result = parseExpression();

  if (index !== tokens.length) {
    throw new Error('Quedaron tokens sin procesar en la expresión mixta.');
  }

  return result;
}
