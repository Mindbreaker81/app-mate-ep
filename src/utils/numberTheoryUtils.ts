import { randomInt } from './generators/shared';

export function gcd(a: number, b: number): number {
  const left = Math.abs(a);
  const right = Math.abs(b);
  if (right === 0) {
    return left;
  }
  return gcd(right, left % right);
}

export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) {
    return 0;
  }
  return Math.abs(a * b) / gcd(a, b);
}

export function primeFactorize(value: number): number[] {
  const factors: number[] = [];
  let remaining = value;
  let divisor = 2;

  while (remaining > 1) {
    while (remaining % divisor === 0) {
      factors.push(divisor);
      remaining /= divisor;
    }
    divisor += 1;
  }

  return factors;
}

export function isPrime(value: number): boolean {
  if (value < 2) return false;
  for (let divisor = 2; divisor <= Math.sqrt(value); divisor += 1) {
    if (value % divisor === 0) {
      return false;
    }
  }
  return true;
}

export function randomCompositeNumber(maxValue: number): number {
  let candidate = randomInt(12, Math.max(12, maxValue));
  while (isPrime(candidate)) {
    candidate = randomInt(12, Math.max(12, maxValue));
  }
  return candidate;
}
