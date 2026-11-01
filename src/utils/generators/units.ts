import type { UnitConversionProblem } from '../../types';
import { formatMathNumber } from '../mathUtils';
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
    // — Unidades del ciclo completas: mm, dm, dam, hm, cL, dL, mg, t, superficie y volumen —
    () => {
      const cm = randomInt(2, Math.max(2, limits.maxUnitValue));
      const answer = cm * 10;
      return {
        prompt: `¿Cuántos mm son ${cm} cm?`,
        answer,
        explanation: `Paso 1: 1 cm = 10 mm.\nPaso 2: ${cm} × 10 = ${answer} mm.`,
      };
    },
    () => {
      const dm = randomInt(2, Math.max(2, limits.maxUnitValue));
      const answer = dm / 10;
      return {
        prompt: `¿Cuántos m son ${dm} dm?`,
        answer,
        explanation: `Paso 1: 10 dm = 1 m.\nPaso 2: ${dm} ÷ 10 = ${formatMathNumber(answer)} m.`,
      };
    },
    () => {
      const dam = randomInt(2, Math.max(2, Math.floor(limits.maxUnitValue / 5)));
      const answer = dam * 10;
      return {
        prompt: `¿Cuántos m son ${dam} dam?`,
        answer,
        explanation: `Paso 1: 1 dam = 10 m.\nPaso 2: ${dam} × 10 = ${answer} m.`,
      };
    },
    () => {
      const hm = randomInt(2, Math.max(2, Math.floor(limits.maxUnitValue / 50)));
      const answer = hm * 100;
      return {
        prompt: `¿Cuántos m son ${hm} hm?`,
        answer,
        explanation: `Paso 1: 1 hm = 100 m.\nPaso 2: ${hm} × 100 = ${answer} m.`,
      };
    },
    () => {
      const cl = randomInt(2, Math.max(2, limits.maxUnitValue)) * 10;
      const answer = cl / 100;
      return {
        prompt: `¿Cuántos L son ${cl} cL?`,
        answer,
        explanation: `Paso 1: 100 cL = 1 L.\nPaso 2: ${cl} ÷ 100 = ${formatMathNumber(answer)} L.`,
      };
    },
    () => {
      const dl = randomInt(2, Math.max(2, limits.maxUnitValue));
      const answer = dl / 10;
      return {
        prompt: `¿Cuántos L son ${dl} dL?`,
        answer,
        explanation: `Paso 1: 10 dL = 1 L.\nPaso 2: ${dl} ÷ 10 = ${formatMathNumber(answer)} L.`,
      };
    },
    () => {
      const mg = randomInt(2, Math.max(2, limits.maxUnitValue)) * 100;
      const answer = mg / 1000;
      return {
        prompt: `¿Cuántos g son ${mg} mg?`,
        answer,
        explanation: `Paso 1: 1000 mg = 1 g.\nPaso 2: ${mg} ÷ 1000 = ${formatMathNumber(answer)} g.`,
      };
    },
    () => {
      const tons = randomInt(1, Math.max(1, Math.floor(limits.maxUnitValue / 100)));
      const answer = tons * 1000;
      return {
        prompt: `¿Cuántos kg son ${tons} t?`,
        answer,
        explanation: `Paso 1: 1 t = 1000 kg.\nPaso 2: ${tons} × 1000 = ${answer} kg.`,
      };
    },
    () => {
      // Superficie: 1 m² = 10 000 cm².
      const squareMeters = randomInt(1, Math.max(1, Math.floor(limits.maxUnitValue / 10)));
      const answer = squareMeters * 10000;
      return {
        prompt: `¿Cuántos cm² son ${squareMeters} m²?`,
        answer,
        explanation: `Paso 1: 1 m² = 100 cm × 100 cm = 10 000 cm².\nPaso 2: ${squareMeters} × 10 000 = ${answer} cm².`,
      };
    },
    () => {
      // Volumen: 1 L = 1000 cm³ = 1 dm³.
      const liters = randomInt(1, Math.max(1, Math.floor(limits.maxUnitValue / 10)));
      const answer = liters * 1000;
      return {
        prompt: `¿Cuántos cm³ son ${liters} L?`,
        answer,
        explanation: `Paso 1: 1 L = 1 dm³ = 1000 cm³.\nPaso 2: ${liters} × 1000 = ${answer} cm³.`,
      };
    },
  ];

  const selected = templates[randomInt(0, templates.length - 1)]();
  return { ...selected, operation: 'unit-conversion' };
}
