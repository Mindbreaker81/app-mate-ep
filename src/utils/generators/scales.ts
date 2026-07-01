import type { ScaleProblem } from '../../types';
import { randomInt, type LevelConfig } from './shared';

export function generateScaleConversion(levelConfig: LevelConfig): ScaleProblem {
  const template = randomInt(0, levelConfig.id >= 4 ? 1 : 0);

  if (template === 0) {
    const scale = pickScale();
    const cm = randomInt(2, 10);
    const answer = (cm * scale) / 100;
    return {
      prompt: `En un plano escala 1:${scale}, ${cm} cm representan ¿cuántos metros reales?`,
      operation: 'scale-conversion',
      answer,
      explanation: `Paso 1: ${cm} cm en plano × ${scale} = ${cm * scale} cm reales.\nPaso 2: ${cm * scale} cm = ${answer} m.`,
    };
  }

  const scale = pickScale();
  const meters = randomInt(2, 8);
  const answer = (meters * 100) / scale;
  return {
    prompt: `Escala 1:${scale}. ¿Cuántos cm en el plano representan ${meters} m reales?`,
    operation: 'scale-conversion',
    answer,
    explanation: `Paso 1: ${meters} m = ${meters * 100} cm reales.\nPaso 2: ${meters * 100} ÷ ${scale} = ${answer} cm en plano.`,
  };
}

function pickScale(): number {
  const scales = [100, 200, 500, 1000];
  return scales[randomInt(0, scales.length - 1)];
}
