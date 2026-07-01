import type { UnitConversionProblem } from '../../types';
import { randomInt, resolveLevelLimits, type LevelConfig } from './shared';

type UnitTemplate = () => { prompt: string; answer: number; explanation: string };

export function generateUnitConversion(levelConfig: LevelConfig): UnitConversionProblem {
  const limits = resolveLevelLimits(levelConfig);
  const templates: UnitTemplate[] = [
    () => {
      const meters = randomInt(1, Math.max(1, Math.floor(limits.maxUnitValue / 10)));
      const answer = meters * 100;
      return {
        prompt: `¿Cuántos cm son ${meters} m?`,
        answer,
        explanation: `Paso 1: 1 m = 100 cm.\nPaso 2: ${meters} × 100 = ${answer} cm.`,
      };
    },
    () => {
      const cm = randomInt(2, Math.max(2, limits.maxUnitValue)) * 10;
      const answer = cm / 100;
      return {
        prompt: `¿Cuántos m son ${cm} cm?`,
        answer,
        explanation: `Paso 1: 100 cm = 1 m.\nPaso 2: ${cm} ÷ 100 = ${answer} m.`,
      };
    },
    () => {
      const km = randomInt(1, Math.max(1, Math.floor(limits.maxUnitValue / 100)));
      const answer = km * 1000;
      return {
        prompt: `¿Cuántos m son ${km} km?`,
        answer,
        explanation: `Paso 1: 1 km = 1000 m.\nPaso 2: ${km} × 1000 = ${answer} m.`,
      };
    },
    () => {
      const kg = randomInt(1, Math.max(1, Math.floor(limits.maxUnitValue / 10)));
      const answer = kg * 1000;
      return {
        prompt: `¿Cuántos g son ${kg} kg?`,
        answer,
        explanation: `Paso 1: 1 kg = 1000 g.\nPaso 2: ${kg} × 1000 = ${answer} g.`,
      };
    },
    () => {
      const grams = randomInt(2, 20) * 100;
      const answer = grams / 1000;
      return {
        prompt: `¿Cuántos kg son ${grams} g?`,
        answer,
        explanation: `Paso 1: 1000 g = 1 kg.\nPaso 2: ${grams} ÷ 1000 = ${answer} kg.`,
      };
    },
    () => {
      const liters = randomInt(1, Math.max(1, Math.floor(limits.maxUnitValue / 20)));
      const answer = liters * 1000;
      return {
        prompt: `¿Cuántos mL son ${liters} L?`,
        answer,
        explanation: `Paso 1: 1 L = 1000 mL.\nPaso 2: ${liters} × 1000 = ${answer} mL.`,
      };
    },
    () => {
      const hours = randomInt(1, 5);
      const answer = hours * 60;
      return {
        prompt: `¿Cuántos minutos hay en ${hours} h?`,
        answer,
        explanation: `Paso 1: 1 h = 60 min.\nPaso 2: ${hours} × 60 = ${answer} min.`,
      };
    },
  ];

  const selected = templates[randomInt(0, templates.length - 1)]();
  return { ...selected, operation: 'unit-conversion' };
}
