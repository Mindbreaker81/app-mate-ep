export function roundToPrecision(value: number, precision = 3): number {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function numbersEqual(a: number, b: number, epsilon = 0.0001): boolean {
  return Math.abs(a - b) <= epsilon;
}

export function formatMathNumber(value: number, precision = 3): string {
  if (Number.isInteger(value)) {
    return value.toString();
  }

  return roundToPrecision(value, precision)
    .toFixed(precision)
    .replace(/\.?0+$/, '');
}
