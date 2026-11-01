import type {
  FinanceProblem,
  InverseProportionProblem,
  PlaceValueProblem,
  ProbabilityCompareProblem,
  ProportionalityProblem,
  SequenceProblem,
  TwoStepEquationProblem,
} from '../../types';
import { formatMathNumber, roundToPrecision } from '../mathUtils';
import { randomInt, type LevelConfig } from './shared';

// — Valor posicional (hasta milésimas) —

type DigitPlace = { name: string; exponent: number; label: string };

const DECIMAL_PLACES: DigitPlace[] = [
  { name: 'décimas', exponent: -1, label: 'décimas' },
  { name: 'centésimas', exponent: -2, label: 'centésimas' },
  { name: 'milésimas', exponent: -3, label: 'milésimas' },
];

export function generatePlaceValueProblem(levelConfig: LevelConfig): PlaceValueProblem {
  const useDecimal = levelConfig.maxDecimalPlaces >= 2 && randomInt(0, 1) === 0;

  if (useDecimal) {
    // Cifra destacada en la parte decimal (décimas, centésimas o milésimas).
    const maxPlace = Math.min(DECIMAL_PLACES.length, Math.max(1, levelConfig.maxDecimalPlaces));
    const place = DECIMAL_PLACES[randomInt(0, maxPlace - 1)];
    const digit = randomInt(1, 9);
    const decimalDigits =
      place.exponent === -1
        ? `${digit}`
        : place.exponent === -2
          ? `${randomInt(1, 9)}${digit}`
          : `${randomInt(1, 9)}${randomInt(0, 9)}${digit}`;
    const whole = randomInt(1, levelConfig.maxDecimalWhole);
    const number = Number(`${whole}.${decimalDigits}`);
    const answer = roundToPrecision(digit * 10 ** place.exponent, 3);
    return {
      prompt: `En el número ${formatMathNumber(number)}, ¿cuánto vale la cifra ${digit}? (Escribe su valor)`,
      operation: 'place-value',
      answer,
      explanation: `La cifra ${digit} ocupa el lugar de las ${place.label}: vale ${digit} × ${formatMathNumber(10 ** place.exponent)} = ${formatMathNumber(answer)}.`,
    };
  }

  // Parte entera: unidades, decenas o centenas.
  const places: DigitPlace[] = [
    { name: 'unidades', exponent: 0, label: 'unidades' },
    { name: 'decenas', exponent: 1, label: 'decenas' },
    { name: 'centenas', exponent: 2, label: 'centenas' },
  ];
  const place = places[randomInt(0, Math.min(2, Math.max(1, levelConfig.id - 1)))];
  const digit = randomInt(1, 9);
  const after = randomInt(0, 10 ** place.exponent - 1);
  const before = place.exponent === 0 ? 0 : randomInt(1, 99);
  const number = before * 10 ** (place.exponent + 1) + digit * 10 ** place.exponent + after;
  const answer = digit * 10 ** place.exponent;
  return {
    prompt: `En el número ${number}, ¿cuánto vale la cifra ${digit}? (Escribe su valor)`,
    operation: 'place-value',
    answer,
    explanation: `La cifra ${digit} ocupa el lugar de las ${place.label}: vale ${digit} × ${formatMathNumber(10 ** place.exponent)} = ${answer}.`,
  };
}

// — Secuencias —

export function generateSequenceProblem(levelConfig: LevelConfig): SequenceProblem {
  const geometric = levelConfig.id >= 4 && randomInt(0, 1) === 0;
  const terms: number[] = [];

  if (geometric) {
    const factor = randomInt(2, 3);
    let current = randomInt(1, 4);
    for (let index = 0; index < 4; index += 1) {
      terms.push(current);
      current *= factor;
    }
    return {
      prompt: `Secuencia: ${terms.join(', ')}, ... ¿Qué número viene después?`,
      operation: 'sequence',
      answer: terms[3] * factor,
      explanation: `Cada término se multiplica por ${factor}: ${terms[3]} × ${factor} = ${terms[3] * factor}.`,
    };
  }

  const step = randomInt(2, Math.max(2, Math.min(levelConfig.maxNumberMult, 12)));
  const start = randomInt(1, Math.max(2, Math.floor(levelConfig.maxNumber / 2)));
  for (let index = 0; index < 4; index += 1) {
    terms.push(start + index * step);
  }
  return {
    prompt: `Secuencia: ${terms.join(', ')}, ... ¿Qué número viene después?`,
    operation: 'sequence',
    answer: terms[3] + step,
    explanation: `Cada término suma ${step}: ${terms[3]} + ${step} = ${terms[3] + step}.`,
  };
}

// — Proporcionalidad sí/no —

interface ProportionalityScenario {
  situation: string;
  proportional: boolean;
}

const PROPORTIONALITY_SCENARIOS: ProportionalityScenario[] = [
  { situation: 'Los litros de pintura necesarios para pintar más superficies iguales', proportional: true },
  { situation: 'Los kilómetros que recorre un coche a velocidad constante y las horas', proportional: true },
  { situation: 'El precio de las naranjas y los kilos que compras (al mismo precio por kilo)', proportional: true },
  { situation: 'Los lápices que puedes comprar con 5 € si cada lápiz cuesta 0,50 € y el precio no cambia', proportional: true },
  { situation: 'La edad de un niño y su estatura', proportional: false },
  { situation: 'El número de libros que lee y su color favorito', proportional: false },
  { situation: 'La edad de una persona y los años que tiene', proportional: false },
  { situation: 'El precio de un taxi con bajada de bandera fija y los kilómetros', proportional: false },
];

export function generateProportionalityProblem(): ProportionalityProblem {
  const scenario = PROPORTIONALITY_SCENARIOS[randomInt(0, PROPORTIONALITY_SCENARIOS.length - 1)];
  return {
    prompt: `¿Hay proporcionalidad directa? ${scenario.situation}.`,
    options: ['Sí', 'No'],
    operation: 'proportionality-check',
    answer: scenario.proportional ? 'Sí' : 'No',
    explanation: scenario.proportional
      ? 'Al duplicar una cantidad se duplica la otra: hay proporcionalidad directa.'
      : 'Al cambiar una cantidad la otra no cambia de forma constante: no hay proporcionalidad directa.',
  };
}

// — Finanzas (IVA, mejor precio, rebajas, interés simple) —

export function generateFinanceProblem(levelConfig: LevelConfig): FinanceProblem {
  const template = randomInt(0, 3);

  if (template === 0) {
    // IVA: precio sin IVA entero (el IVA sale exacto en céntimos).
    const rate = randomInt(0, 1) === 0 ? 21 : 10;
    const basePrice = randomInt(2, Math.max(3, Math.floor(levelConfig.maxPercentageBase / 2)));
    const iva = roundToPrecision((basePrice * rate) / 100, 2);
    const answer = roundToPrecision(basePrice + iva, 2);
    return {
      prompt: `Un menú cuesta ${basePrice} € sin IVA. Con el ${rate}% de IVA, ¿cuál es el precio final en euros?`,
      operation: 'finance',
      answer,
      explanation: `Paso 1: IVA = ${basePrice} × ${rate}/100 = ${formatMathNumber(iva)}.\nPaso 2: Precio final = ${basePrice} + ${formatMathNumber(iva)} = ${formatMathNumber(answer)} €.`,
    };
  }

  if (template === 1) {
    // Mejor precio: comparar dos tamaños con precio por unidad exacto y sin empates.
    const smallCount = randomInt(2, 4);
    const smallUnit = randomInt(3, 6);
    const smallPrice = smallCount * smallUnit;
    const bigCount = smallCount * 2 + randomInt(1, 3);
    const bigUnit = smallUnit - randomInt(1, 2);
    const bigPrice = bigCount * bigUnit;
    // El pack grande sale mejor por unidad (bigUnit < smallUnit).
    const answer = bigPrice;
    return {
      prompt: `Un pack de ${smallCount} bolis cuesta ${smallPrice} € y otro de ${bigCount} bolis cuesta ${bigPrice} €. ¿Cuánto cuesta el pack que sale mejor por boli?`,
      operation: 'finance',
      answer,
      explanation: `Paso 1: Pack pequeño: ${smallPrice} ÷ ${smallCount} = ${formatMathNumber(smallPrice / smallCount)} €/boli.\nPaso 2: Pack grande: ${bigPrice} ÷ ${bigCount} = ${formatMathNumber(bigPrice / bigCount)} €/boli.\nPaso 3: Mejor por boli: el grande, que cuesta ${answer} €.`,
    };
  }

  if (template === 2) {
    // Interés simple apto para edad: 2 %, 5 % al año, sin capitalización.
    const rate = randomInt(0, 1) === 0 ? 2 : 5;
    const capital = randomInt(2, Math.max(3, Math.floor(levelConfig.maxPercentageBase / rate)));
    const years = randomInt(2, 5);
    const interest = roundToPrecision((capital * rate / 100) * years, 2);
    return {
      prompt: `Abres ${capital} € en el banco con un ${rate}% de interés simple al año. ¿Cuántos euros de interés reúnes en ${years} años?`,
      operation: 'finance',
      answer: interest,
      explanation: `Paso 1: Interés de un año: ${capital} × ${rate}/100 = ${formatMathNumber(capital * rate / 100)}.\nPaso 2: En ${years} años: ${formatMathNumber(capital * rate / 100)} × ${years} = ${formatMathNumber(interest)} €.`,
    };
  }

  // Rebajas: precio final limpio (porcentajes 20 % y 50 %).
  const percent = randomInt(0, 1) === 0 ? 20 : 50;
  const price = percent === 20 ? 5 * randomInt(2, Math.max(3, Math.floor(levelConfig.maxPercentageBase / 5))) : 2 * randomInt(2, Math.max(3, Math.floor(levelConfig.maxPercentageBase / 2)));
  const finalPrice = roundToPrecision(price * (1 - percent / 100), 2);
  return {
    prompt: `En las rebajas, unos patines de ${formatMathNumber(price)} € bajan un ${percent}%. ¿Cuál es su precio final en euros?`,
    operation: 'finance',
    answer: finalPrice,
    explanation: `Paso 1: Rebaja = ${formatMathNumber(price)} × ${percent}/100 = ${formatMathNumber(price * percent / 100)}.\nPaso 2: Precio final = ${formatMathNumber(price)} - ${formatMathNumber(price * percent / 100)} = ${formatMathNumber(finalPrice)} €.`,
  };
}

// — Comparación cualitativa de probabilidades —

interface ProbabilityCompareScenario {
  prompt: string;
  moreLikelyOption: string;
  otherOption: string;
  explanation: string;
}

const PROBABILITY_SCENARIOS: ProbabilityCompareScenario[] = [
  {
    prompt: 'En una bolsa hay 5 bolas rojas y 2 azules. ¿Qué es más probable sacar?',
    moreLikelyOption: 'Sacar bola roja',
    otherOption: 'Sacar bola azul',
    explanation: 'Hay más rojas (5) que azules (2): sacar roja es más probable.',
  },
  {
    prompt: 'Lanzas un dado de 6 caras. ¿Qué es más probable?',
    moreLikelyOption: 'Sacar un número par',
    otherOption: 'Sacar el 6',
    explanation: 'Hay 3 pares (2, 4, 6) y solo un 6: sacar un par es más probable.',
  },
  {
    prompt: 'Lanzas una moneda. ¿Qué es más probable?',
    moreLikelyOption: 'Las dos opciones son igual de probables',
    otherOption: 'Sacar cara es más probable que cruz',
    explanation: 'Cara y cruz tienen la misma probabilidad: 1/2 cada una.',
  },
  {
    prompt: 'En una caja hay 3 bolígrafos azules, 3 rojos y 3 verdes. ¿Qué es más probable sacar a ciegas?',
    moreLikelyOption: 'Las tres opciones son igual de probables',
    otherOption: 'Sacar un bolígrafo azul',
    explanation: 'Hay la misma cantidad de cada color: los tres casos son igual de probables.',
  },
  {
    prompt: 'El metro de Barcelona pasa cada 5 minutos en domingo y cada 2 minutos en hora punta. ¿Cuándo es más probable llegar justo cuando pasa?',
    moreLikelyOption: 'En hora punta (cada 2 min)',
    otherOption: 'El domingo (cada 5 min)',
    explanation: 'Cuanto más seguido pasa (cada 2 min), más probable es llegar justo cuando pasa.',
  },
];

export function generateProbabilityCompareProblem(): ProbabilityCompareProblem {
  const scenario = PROBABILITY_SCENARIOS[randomInt(0, PROBABILITY_SCENARIOS.length - 1)];
  return {
    prompt: scenario.prompt,
    options: [scenario.moreLikelyOption, scenario.otherOption],
    operation: 'probability-compare',
    answer: scenario.moreLikelyOption,
    explanation: scenario.explanation,
  };
}

// — Puente T3: ecuaciones de dos pasos (Ampliació ESO) —

export function generateTwoStepEquationProblem(levelConfig: LevelConfig): TwoStepEquationProblem {
  const factor = randomInt(2, Math.max(2, Math.min(levelConfig.maxNumberMult, 9)));
  const x = randomInt(1, Math.max(2, Math.min(levelConfig.maxNumber, 20)));
  const addend = randomInt(1, Math.max(2, Math.min(levelConfig.maxNumber, 15)));
  const result = factor * x + addend;
  return {
    prompt: `Resuelve: ${factor}x + ${addend} = ${result}. ¿Cuánto vale x?`,
    operation: 'two-step-equation',
    answer: x,
    explanation:
      `Paso 1: ${result} - ${addend} = ${result - addend}, así que ${factor}x = ${result - addend}.\n` +
      `Paso 2: x = ${result - addend} ÷ ${factor} = ${x}.`,
  };
}

// — Puente T3: proporcionalidad inversa (Ampliació ESO) —

export function generateInverseProportionProblem(levelConfig: LevelConfig): InverseProportionProblem {
  void levelConfig; // los rangos son acotados por el propio problema
  // Trabajo constante: obreros × días. Se busca un reparto con todos los valores
  // razonables (≥ 2) y resultado exacto.
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const workers = randomInt(2, 6);
    const days = randomInt(2, 6);
    const total = workers * days;
    const candidates = Array.from({ length: 5 }, (_, index) => index + 2).filter(
      (candidate) => total % candidate === 0 && candidate !== workers && total / candidate >= 2,
    );
    if (candidates.length === 0) {
      continue;
    }
    const newWorkers = candidates[randomInt(0, candidates.length - 1)];
    const answer = total / newWorkers;
    return {
      prompt: `${workers} obreros pintan una escuela en ${days} días. Si trabajan ${newWorkers} obreros a la misma velocidad, ¿en cuántos días acabarán?`,
      operation: 'inverse-proportion',
      answer,
      explanation:
        `Paso 1: Trabajo total: ${workers} × ${days} = ${total} jornadas.\n` +
        `Paso 2: Con ${newWorkers} obreros: ${total} ÷ ${newWorkers} = ${formatMathNumber(answer)} días.`,
    };
  }
  // Escenario garantizado.
  return {
    prompt: '4 obreros pintan una escuela en 6 días. Si trabajan 8 obreros a la misma velocidad, ¿en cuántos días acabarán?',
    operation: 'inverse-proportion',
    answer: 3,
    explanation: 'Paso 1: Trabajo total: 4 × 6 = 24 jornadas.\nPaso 2: Con 8 obreros: 24 ÷ 8 = 3 días.',
  };
}
