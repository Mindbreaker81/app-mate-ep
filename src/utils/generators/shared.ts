import type { Level } from '../../types';
import { roundToPrecision } from '../mathUtils';

export type LevelConfig = Level;

export const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export function pickRandom<T>(values: readonly T[]): T {
  return values[randomInt(0, values.length - 1)];
}

export function shuffle<T>(values: T[]): T[] {
  const clone = [...values];
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index);
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }
  return clone;
}

export function randomDecimal(maxWhole: number, maxPlaces: number): number {
  const places = randomInt(1, Math.max(1, maxPlaces));
  const scale = 10 ** places;
  return roundToPrecision(randomInt(1, Math.max(1, maxWhole * scale)) / scale, maxPlaces);
}

export function resolveLevelLimits(config: LevelConfig) {
  return {
    maxMixedFractionWhole: config.maxMixedFractionWhole ?? Math.max(2, Math.floor(config.maxNumber / 8)),
    maxGeometrySide: config.maxGeometrySide ?? Math.min(config.maxNumber, 60),
    maxUnitValue: config.maxUnitValue ?? Math.min(config.maxNumber, 100),
    meanDataPoints: config.meanDataPoints ?? Math.min(5, Math.max(3, 2 + Math.floor(config.id / 3))),
  };
}

export function roundToNearestTen(value: number): number {
  return Math.round(value / 10) * 10;
}

export function roundToNearestHundred(value: number): number {
  return Math.round(value / 100) * 100;
}

export const EXACT_DECIMAL_DENOMINATORS = [2, 4, 5, 8, 10, 20, 25, 50, 100] as const;

export const PERCENT_OPTIONS = [10, 15, 20, 25, 30, 40, 50, 75] as const;
