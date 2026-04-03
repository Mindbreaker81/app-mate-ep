import type { Fraction } from '../types';

function gcd(a: number, b: number): number {
  const left = Math.abs(a);
  const right = Math.abs(b);
  if (right === 0) {
    return left;
  }
  return gcd(right, left % right);
}

export function simplifyFraction(frac: Fraction): Fraction {
  const denominator = frac.denominator === 0 ? 1 : frac.denominator;
  const sign = denominator < 0 ? -1 : 1;
  const normalized = {
    numerator: frac.numerator * sign,
    denominator: Math.abs(denominator),
  };
  const divisor = gcd(normalized.numerator, normalized.denominator) || 1;

  return {
    numerator: normalized.numerator / divisor,
    denominator: normalized.denominator / divisor,
  };
}

export function fractionEquals(a: Fraction, b: Fraction): boolean {
  const left = simplifyFraction(a);
  const right = simplifyFraction(b);

  return left.numerator === right.numerator && left.denominator === right.denominator;
}

export function formatFraction(frac: Fraction): string {
  const simplified = simplifyFraction(frac);
  return `${simplified.numerator}/${simplified.denominator}`;
}
