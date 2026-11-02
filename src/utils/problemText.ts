import type {
  ComparisonOperator,
  MixedNumber,
  Problem,
} from '../types';
import {
  angleTypeLabel,
  compareOperatorLabel,
  isAngleProblem,
  isCompareProblem,
  isEstimationProblem,
  isFactorizationProblem,
  isFractionProblem,
  isIntegerArithmeticProblem,
  isNumberLineProblem,
  isIntegerCompareProblem,
  isIntegerOrderProblem,
  isMixedNumberProblem,
  isMixedProblem,
  isOrderValuesProblem,
  isPowerGeneralProblem,
  isPowerOfTenProblem,
  isPowerProblem,
  isProbabilityCompareProblem,
  isProbabilityProblem,
  isProportionalityProblem,
  isRemainderProblem,
  isSquareRootProblem,
  isDataChartProblem,
  isCoordinateValueProblem,
  isPlaneTransformProblem,
  isShapeClassificationProblem,
} from './problemUtils';
import { formatMathNumber } from './mathUtils';
import { numberLineAltText } from './generators/numberLine';

/**
 * Verbalización de enunciados para la lectura en voz alta (PIT-31).
 * Funciones puras: construyen el texto a partir de la estructura del problema.
 * NUNCA incluyen `answer` ni `explanation`: la lectura es una ayuda de acceso,
 * no debe leer la solución antes de tiempo.
 */

/** Fracciones con denominador común se leen como habla un niño: «tres cuartos». */
const DENOMINATOR_WORDS: Record<number, [string, string]> = {
  2: ['medio', 'medios'],
  3: ['tercio', 'tercios'],
  4: ['cuarto', 'cuartos'],
  5: ['quinto', 'quintos'],
  6: ['sexto', 'sextos'],
  7: ['séptimo', 'séptimos'],
  8: ['octavo', 'octavos'],
  9: ['noveno', 'novenos'],
  10: ['décimo', 'décimos'],
};

const NUMERATOR_WORDS: Record<number, string> = {
  2: 'dos',
  3: 'tres',
  4: 'cuatro',
  5: 'cinco',
  6: 'seis',
  7: 'siete',
  8: 'ocho',
  9: 'nueve',
  10: 'diez',
  11: 'once',
  12: 'doce',
};

function fractionSpeech(numerator: number, denominator: number): string {
  const names = DENOMINATOR_WORDS[denominator];
  if (!names) {
    return `${numerator} entre ${denominator}`;
  }
  if (numerator === 1) {
    return `un ${names[0]}`;
  }
  return `${NUMERATOR_WORDS[numerator] ?? numerator} ${names[1]}`;
}

function mixedNumberSpeech(value: MixedNumber): string {
  if (value.numerator === 0 || value.whole === 0) {
    return value.whole === 0
      ? fractionSpeech(value.numerator, value.denominator)
      : String(value.whole);
  }
  return `${value.whole} y ${fractionSpeech(value.numerator, value.denominator)}`;
}

/** Número hablado: decimales con «coma» y negativos con «menos». */
function numberSpeech(value: number): string {
  const formatted = formatMathNumber(Math.abs(value)).replace('.', ' coma ');
  return value < 0 ? `menos ${formatted}` : formatted;
}

const UNIT_WORDS: Record<string, string> = {
  km: 'kilómetros',
  hm: 'hectómetros',
  dam: 'decámetros',
  m: 'metros',
  dm: 'decímetros',
  cm: 'centímetros',
  mm: 'milímetros',
  kg: 'kilogramos',
  g: 'gramos',
  mg: 'miligramos',
  t: 'toneladas',
  L: 'litros',
  dL: 'decilitros',
  cL: 'centilitros',
  mL: 'mililitros',
  h: 'horas',
};

const SQUARE_UNIT_WORDS: Record<string, string> = {
  m: 'metros cuadrados',
  dm: 'decímetros cuadrados',
  cm: 'centímetros cuadrados',
  mm: 'milímetros cuadrados',
};

const CUBIC_UNIT_WORDS: Record<string, string> = {
  m: 'metros cúbicos',
  dm: 'decímetros cúbicos',
  cm: 'centímetros cúbicos',
  mm: 'milímetros cúbicos',
};

function replaceUnits(text: string): string {
  let result = text;
  // km/h antes que cada unidad por separado.
  result = result.replace(/km\/h/g, 'kilómetros por hora');
  // Unidades cuadradas/cúbicas antes que las simples (cm² ≠ cm + superíndice).
  result = result.replace(
    /\b(mm|cm|dm|m)(²|³)/g,
    (_, unit: keyof typeof SQUARE_UNIT_WORDS & keyof typeof CUBIC_UNIT_WORDS, mark: string) =>
      mark === '²' ? SQUARE_UNIT_WORDS[unit] : CUBIC_UNIT_WORDS[unit],
  );
  return result.replace(
    /\b(dam|mL|cL|dL|mg|mm|cm|dm|hm|km|kg|h|L|m|g|t)\b/g,
    (unit) => UNIT_WORDS[unit] ?? unit,
  );
}

/**
 * Convierte símbolos matemáticos de un texto en castellano hablado.
 * Los paréntesis se omiten (en los enunciados son incisos); las expresiones
 * con paréntesis significativos se verbalizan aparte con `parentheses: 'spoken'`.
 */
export function verbalizeMathText(
  text: string,
  options: { parentheses?: 'drop' | 'spoken' } = {},
): string {
  let result = text;

  result = replaceUnits(result);

  // Número mixto escrito «2 1/3» antes que la fracción suelta.
  result = result.replace(
    /(\d+)\s+(\d+)\s*\/\s*(\d+)/g,
    (_, whole, numerator, denominator) =>
      `${whole} y ${fractionSpeech(Number(numerator), Number(denominator))}`,
  );
  result = result.replace(
    /(\d+)\s*\/\s*(\d+)/g,
    (_, numerator, denominator) =>
      fractionSpeech(Number(numerator), Number(denominator)),
  );

  // Escalas («escala 1:100» → «escala 1 a 100») antes que la razón general.
  result = result.replace(
    /\b(escala\s*)(\d+)\s*:\s*(\d+)/gi,
    (_, prefix, left, right) => `${prefix}${left} a ${right}`,
  );
  result = result.replace(/(\d+)\s*:\s*(\w)/g, '$1 es a $2');

  // Incógnita: «3x» → «3 equis», «x» → «equis».
  result = result.replace(/(\d)\s*x\b/g, '$1 equis');
  result = result.replace(/\bx\b/g, 'equis');

  const SYMBOLS: Array<[RegExp, string]> = [
    [/\bkm\/h\b/g, 'kilómetros por hora'],
    [/√/g, ' raíz cuadrada de '],
    [/×/g, ' por '],
    [/÷/g, ' entre '],
    [/π/g, ' pi '],
    [/°/g, ' grados'],
    [/%/g, ' por ciento'],
    [/€/g, ' euros'],
    [/≤/g, ' menor o igual que '],
    [/≥/g, ' mayor o igual que '],
    [/≠/g, ' distinto de '],
    [/=/g, ' igual '],
    [/</g, ' menor que '],
    [/>/g, ' mayor que '],
    [/\+/g, ' más '],
    [/[-−]/g, ' menos '],
    [/²/g, ' al cuadrado'],
    [/³/g, ' al cubo'],
    [/·/g, ' por '],
    [/–|—/g, ', '],
  ];
  for (const [pattern, replacement] of SYMBOLS) {
    result = result.replace(pattern, replacement);
  }

  if (options.parentheses === 'spoken') {
    result = result.replace(/\(/g, ' abre paréntesis ').replace(/\)/g, ' cierra paréntesis ');
  } else {
    result = result.replace(/[()]/g, ' ');
  }

  // Decimales con punto → «coma» (el formato interno usa punto).
  result = result.replace(/(\d)\.(\d)/g, '$1 coma $2');

  return result.replace(/\s+/g, ' ').trim();
}

const OPERATION_WORDS: Record<string, string> = {
  addition: 'más',
  subtraction: 'menos',
  multiplication: 'por',
  division: 'entre',
  'decimal-addition': 'más',
  'decimal-subtraction': 'menos',
  'decimal-multiplication': 'por',
  'decimal-division': 'entre',
  'fraction-addition': 'más',
  'fraction-subtraction': 'menos',
  'fraction-multiplication': 'por',
  'fraction-division': 'entre',
  'mixed-number-addition': 'más',
  'mixed-number-subtraction': 'menos',
  'integer-addition': 'más',
  'integer-subtraction': 'menos',
  'integer-multiplication': 'por',
  'integer-division': 'entre',
};

/** Opciones visibles de un problema de opción múltiple, ya verbalizadas. */
function speechOptions(problem: Problem): string[] {
  if (isIntegerCompareProblem(problem)) {
    return ['<', '>'].map((operator) => compareOperatorLabel(operator as ComparisonOperator));
  }
  if (isCompareProblem(problem)) {
    return ['<', '>', '='].map((operator) => compareOperatorLabel(operator as ComparisonOperator));
  }
  if (isAngleProblem(problem)) {
    return problem.options.map((option) => angleTypeLabel(option));
  }
  if (
    isOrderValuesProblem(problem) ||
    isIntegerOrderProblem(problem) ||
    isProportionalityProblem(problem) ||
    isProbabilityCompareProblem(problem)
  ) {
    return problem.options.map((option) => verbalizeMathText(option));
  }
  if (isEstimationProblem(problem) || isProbabilityProblem(problem)) {
    return problem.options.map((option) => numberSpeech(option));
  }
  if (isDataChartProblem(problem)) {
    return (problem.options ?? []).map((option) => verbalizeMathText(option));
  }
  if (isPlaneTransformProblem(problem)) {
    return [...problem.options];
  }
  if (isShapeClassificationProblem(problem)) {
    return problem.options.map((option) => verbalizeMathText(option));
  }
  return [];
}

function baseSpeechText(problem: Problem): string {
  if (isMixedNumberProblem(problem)) {
    return `${mixedNumberSpeech(problem.num1)} ${OPERATION_WORDS[problem.operation]} ${mixedNumberSpeech(problem.num2)}`;
  }
  if (isFractionProblem(problem)) {
    return `${fractionSpeech(problem.num1.numerator, problem.num1.denominator)} ${OPERATION_WORDS[problem.operation]} ${fractionSpeech(problem.num2.numerator, problem.num2.denominator)}`;
  }
  if (isRemainderProblem(problem)) {
    return `${problem.num1} entre ${problem.num2}: escribe el cociente y el resto`;
  }
  if (isIntegerArithmeticProblem(problem)) {
    return `${numberSpeech(problem.num1)} ${OPERATION_WORDS[problem.operation]} ${numberSpeech(problem.num2)}`;
  }
  if (isMixedProblem(problem)) {
    return verbalizeMathText(problem.expression, { parentheses: 'spoken' });
  }
  if (isPowerProblem(problem)) {
    return `${problem.base} al ${problem.exponent === 2 ? 'cuadrado' : 'cubo'}`;
  }
  if (isPowerGeneralProblem(problem) || isPowerOfTenProblem(problem)) {
    const word = problem.exponent === 2 ? 'al cuadrado' : problem.exponent === 3 ? 'al cubo' : `elevado a ${problem.exponent}`;
    return `${problem.base} ${word}`;
  }
  if (isSquareRootProblem(problem)) {
    return `raíz cuadrada de ${problem.radicand}`;
  }
  if (isFactorizationProblem(problem)) {
    // Misma consigna que se muestra en pantalla.
    return `Descompón ${problem.target} en factores primos`;
  }
  if (isNumberLineProblem(problem)) {
    // Misma información que la alternativa textual del SVG, sin el resultado.
    return `${numberLineAltText(problem)} ¿Qué número marca el punto?`;
  }
  if (isDataChartProblem(problem)) {
    // Misma información que la tabla textual equivalente, sin el resultado.
    const data = problem.categories
      .map((category, index) => `${category}: ${problem.values[index]}`)
      .join(', ');
    return `Gráfico: ${problem.title}. Datos: ${data}. ${verbalizeMathText(problem.prompt)}`;
  }
  if (isCoordinateValueProblem(problem)) {
    // Misma información que la alternativa textual del SVG, sin el resultado.
    return `Cuadrícula de 0 a 10. Punto ${problem.pointLabel} marcado. ${verbalizeMathText(problem.prompt)}`;
  }
  if (isPlaneTransformProblem(problem)) {
    // La figura y las opciones A/B/C se describen, pero no cuál es la correcta.
    const line = problem.mirrorLine
      ? ` Recta de ${problem.mirrorLine.axis === 'x' ? 'simetría vertical' : 'simetría horizontal'} en ${problem.mirrorLine.value}.`
      : ` Traslación de ${problem.translation?.x ?? 0} casillas en horizontal y ${problem.translation?.y ?? 0} en vertical.`;
    return `Figura original con ${problem.vertices.length} vértices en la cuadrícula.${line} ${verbalizeMathText(problem.prompt)} Opciones: A, B y C.`;
  }
  if (isShapeClassificationProblem(problem)) {
    // No se dice el número de vértices: contar lados es justo la tarea.
    return 'Figura cerrada dibujada en la cuadrícula. Recorre su borde y cuenta los lados. ' + verbalizeMathText(problem.prompt);
  }
  if (isOrderValuesProblem(problem) || isIntegerOrderProblem(problem)) {
    const values = problem.values.map((value) => verbalizeMathText(value)).join(', ');
    return `${verbalizeMathText(problem.prompt)} ${values}`;
  }
  if ('prompt' in problem) {
    return verbalizeMathText(problem.prompt);
  }
  if ('num1' in problem && typeof problem.num1 === 'number' && typeof problem.num2 === 'number') {
    return `${numberSpeech(problem.num1)} ${OPERATION_WORDS[problem.operation] ?? ''} ${numberSpeech(problem.num2)}`;
  }
  return '';
}

/**
 * Texto a leer en voz alta para un problema: enunciado (y opciones visibles,
 * si las hay) sin respuesta ni explicación. Cadena vacía si no hay nada que leer.
 */
export function problemSpeechText(problem: Problem): string {
  const base = baseSpeechText(problem);
  const options = speechOptions(problem);
  return options.length > 0 ? `${base} Opciones: ${options.join(', ')}.` : base;
}
