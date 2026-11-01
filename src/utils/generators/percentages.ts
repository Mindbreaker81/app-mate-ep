import type { PercentageProblem } from '../../types';
import { formatMathNumber, roundToPrecision } from '../mathUtils';
import { PERCENT_OPTIONS, pickRandom, randomInt, type LevelConfig } from './shared';

export function generatePercentageProblem(levelConfig: LevelConfig): PercentageProblem {
  const template = randomInt(0, 7);
  const percent = pickRandom(PERCENT_OPTIONS);

  if (template === 0) {
    const divisor = getPercentDivisor(percent);
    const base = divisor * randomInt(2, Math.max(2, Math.floor(levelConfig.maxPercentageBase / divisor)));
    const answer = roundToPrecision((base * percent) / 100, 3);
    return {
      prompt: `¿Cuánto es el ${percent}% de ${base}?`,
      operation: 'percentage',
      answer,
      explanation: `Paso 1: ${percent}% de ${base} = ${base} × ${percent}/100 = ${formatMathNumber(answer)}.`,
    };
  }

  if (template === 1) {
    const divisor = getPercentDivisor(percent);
    const total = divisor * randomInt(2, Math.max(2, Math.floor(levelConfig.maxPercentageBase / divisor)));
    const part = roundToPrecision((total * percent) / 100, 3);
    return {
      prompt: `¿Qué porcentaje de ${total} es ${formatMathNumber(part)}?`,
      operation: 'percentage',
      answer: percent,
      explanation: `Paso 1: ${formatMathNumber(part)} ÷ ${total} × 100 = ${percent}%.`,
    };
  }

  if (template === 2) {
    const quantity1 = randomInt(2, 6);
    const pricePerItem = randomInt(1, Math.max(2, Math.min(levelConfig.maxNumberMult, 12)));
    const quantity2 = quantity1 + randomInt(1, 5);
    const total1 = quantity1 * pricePerItem;
    const answer = quantity2 * pricePerItem;
    return {
      prompt: `Si ${quantity1} cuadernos cuestan ${total1} €, ¿cuánto cuestan ${quantity2}?`,
      operation: 'percentage',
      answer,
      explanation: `Paso 1: Precio unitario ${pricePerItem} €.\nPaso 2: ${quantity2} × ${pricePerItem} = ${answer} €.`,
    };
  }

  if (template === 3) {
    // Precio divisible por el porcentaje: descuento y precio final sin céntimos raros.
    const divisor = getPercentDivisor(percent);
    const price = divisor * randomInt(2, Math.max(3, Math.floor(levelConfig.maxPercentageBase / divisor)));
    const answer = roundToPrecision(price * (1 - percent / 100), 2);
    return {
      prompt: `Una bici cuesta ${price} € y tiene un ${percent}% de descuento. ¿Cuánto pagas?`,
      operation: 'percentage',
      answer,
      explanation: `Paso 1: Descuento ${percent}% de ${price} = ${formatMathNumber(price * percent / 100)}.\nPaso 2: Precio final ${formatMathNumber(answer)} €.`,
    };
  }

  if (template === 4) {
    const price = randomInt(10, Math.max(10, Math.floor(levelConfig.maxPercentageBase / 2)));
    const answer = roundToPrecision(price * (1 + percent / 100), 2);
    return {
      prompt: `Un producto de ${price} € sube un ${percent}%. ¿Cuál es el nuevo precio?`,
      operation: 'percentage',
      answer,
      explanation: `Paso 1: Aumento ${percent}% de ${price} = ${formatMathNumber(price * percent / 100)}.\nPaso 2: Nuevo precio ${formatMathNumber(answer)} €.`,
    };
  }

  if (template === 5) {
    const divisor = getPercentDivisor(percent);
    const answer = divisor * randomInt(2, Math.max(2, Math.floor(levelConfig.maxPercentageBase / divisor)));
    const part = roundToPrecision((answer * percent) / 100, 3);
    return {
      prompt: `El ${percent}% de un número es ${formatMathNumber(part)}. ¿Cuál es el número?`,
      operation: 'percentage',
      answer,
      explanation: `Paso 1: ${formatMathNumber(part)} = ${percent}% de x.\nPaso 2: x = ${formatMathNumber(part)} ÷ ${percent/100} = ${answer}.`,
    };
  }

  if (template === 6) {
    const base1 = randomInt(20, levelConfig.maxPercentageBase);
    const base2 = randomInt(20, levelConfig.maxPercentageBase);
    const p1 = pickRandom(PERCENT_OPTIONS);
    const p2 = pickRandom(PERCENT_OPTIONS);
    const v1 = roundToPrecision(base1 * p1 / 100, 2);
    const v2 = roundToPrecision(base2 * p2 / 100, 2);
    // Sin empates: el enunciado comparativo exige un único valor mayor claro.
    if (v1 === v2) {
      return generatePercentageProblem(levelConfig);
    }
    const answer = Math.max(v1, v2);
    return {
      prompt: `¿Qué es más: el ${p1}% de ${base1} o el ${p2}% de ${base2}? Escribe el valor más grande.`,
      operation: 'percentage',
      answer,
      explanation: `${p1}% de ${base1} = ${formatMathNumber(v1)}. ${p2}% de ${base2} = ${formatMathNumber(v2)}. Mayor: ${formatMathNumber(answer)}.`,
    };
  }

  // Rebaja exacta: el precio inicial es múltiplo que hace entero el porcentaje.
  const gcdPct = gcdForPercent(percent);
  const step = 100 / gcdPct;
  const maxK = Math.max(2, Math.floor(levelConfig.maxPercentageBase / step));
  const from = step * randomInt(2, maxK);
  const to = from - (from * percent) / 100;
  const answer = percent;
  return {
    prompt: `Un artículo pasa de ${formatMathNumber(from)} € a ${formatMathNumber(to)} €. ¿Qué porcentaje de descuento es?`,
    operation: 'percentage',
    answer,
    explanation: `Paso 1: Descuento ${formatMathNumber(from - to)} € sobre ${formatMathNumber(from)} €.\nPaso 2: (${formatMathNumber(from - to)}/${formatMathNumber(from)}) × 100 = ${answer}%.`,
  };
}

function gcdForPercent(percent: number): number {
  let a = percent;
  let b = 100;
  while (b !== 0) {
    const temp = a % b;
    a = b;
    b = temp;
  }
  return a || 100;
}

function getPercentDivisor(percent: number): number {
  if (percent === 25 || percent === 75) return 4;
  if (percent === 20 || percent === 40) return 5;
  if (percent === 15 || percent === 30) return 20;
  return 10;
}
