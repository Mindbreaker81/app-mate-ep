import type { Problem } from '../types';
import { isFractionProblem, isMeanProblem, isRemainderProblem, parseFullNumber } from './problemUtils';
import { numbersEqual } from './mathUtils';
import { isSimplifiedFraction, simplifyFraction } from './fractionUtils';

/**
 * Pistas graduales (nivel 1: orientación; nivel 2: planteamiento casi completo).
 * Devuelve null si la operación no tiene pista específica.
 */
export function buildHint(problem: Problem, level: 1 | 2): string | null {
  const operation = problem.operation;

  const HINTS: Record<string, [string, string]> = {
    addition: [
      'Coloca los números en columna, alineando las unidades.',
      'Suma primero las unidades y arrastra la llevada a las decenas.',
    ],
    subtraction: [
      'Coloca los números en columna con el mayor arriba.',
      'Si la cifra de arriba es menor, pide prestada una decena.',
    ],
    multiplication: [
      'Descompón en unidades, decenas... y multiplica cada parte.',
      'Multiplica por las unidades, luego por las decenas y suma los resultados.',
    ],
    division: [
      'Piensa: ¿por cuánto puedo multiplicar el divisor para acercarme al dividendo?',
      'Prueba el cociente multiplicándolo por el divisor y ajusta.',
    ],
    'division-remainder': [
      'Busca primero cuántas veces cabe el divisor.',
      'El resto debe ser menor que el divisor.',
    ],
    'decimal-addition': ['Alinea las comas decimales en columna.', 'Rellena con ceros si hace falta y suma como enteros.'],
    'decimal-subtraction': ['Alinea las comas decimales en columna.', 'Rellena con ceros y resta como enteros.'],
    'decimal-multiplication': [
      'Multiplica primero como si fueran enteros.',
      'Cuenta las cifras decimales de los dos números: esas son las del resultado.',
    ],
    'decimal-division': ['Convierte el divisor en entero moviendo la coma.', 'Mueve la coma del dividendo los mismos sitios.'],
    'fraction-addition': ['Para sumar, los denominadores deben ser iguales.', 'Busca un denominador común y después suma los numeradores.'],
    'fraction-subtraction': ['Para restar, los denominadores deben ser iguales.', 'Busca un denominador común y después resta los numeradores.'],
    'fraction-multiplication': ['Multiplica numeradores entre sí y denominadores entre sí.', 'Antes de multiplicar, simplifica cruzado si puedes.'],
    'fraction-division': ['Dividir es multiplicar por el inverso.', 'Dale la vuelta a la segunda fracción y multiplica.'],
    mean: ['Suma todos los valores primero.', 'Divide la suma entre cuántos datos hay.'],
    median: ['Ordena los datos de menor a mayor.', 'Si hay un número par de datos, haz la media de los dos centrales.'],
    mode: ['Busca el valor que más veces se repite.', 'Si ningún valor se repite, no hay moda clara.'],
    range: ['Encuentra el valor mayor y el menor.', 'Rango = mayor − menor.'],
    percentage: ['El símbolo % significa «por cada 100».', 'Multiplica la cantidad por el porcentaje y divide entre 100.'],
    estimation: ['Redondea cada número antes de operar.', 'Usa redondeos que hagan el cálculo fácil (decenas o centenas).'],
    'round-decimal': ['Mira la cifra que está justo a la derecha del lugar al que redondeas.', 'Si esa cifra es 5 o más, redondea hacia arriba.'],
    'word-problem': ['Lee otra vez: ¿qué te piden exactamente?', 'Decide la operación: ¿juntar (suma), quitar (resta), repetir (multiplicar) o repartir (dividir)?'],
    'perimeter-rectangle': ['El perímetro es la suma de los cuatro lados.', 'Perímetro = 2 × (largo + ancho).'],
    'perimeter-square': ['Un cuadrado tiene cuatro lados iguales.', 'Perímetro = 4 × lado.'],
    'area-rectangle': ['El área se cubre con cuadraditos: base por altura.', 'Área = largo × ancho.'],
    'area-triangle': ['Un triángulo es la mitad de un rectángulo.', 'Área = (base × altura) ÷ 2.'],
    'circle-area': ['El área depende del radio al cuadrado.', 'Área = π × r².'],
    'circle-circumference': ['La longitud de la circunferencia crece con el diámetro.', 'Longitud = 2 × π × r.'],
    'volume-rectangular-prism': ['Cuenta cuántos cubitos caben.', 'Volumen = largo × ancho × alto.'],
    'triangle-angle-sum': ['Los tres ángulos suman siempre 180°.', 'Resta a 180 los dos ángulos conocidos.'],
    'unit-conversion': ['Piensa si la unidad destino es mayor o menor.', 'A unidad menor, multiplica; a unidad mayor, divide.'],
    gcd: ['Busca los divisores comunes de los dos números.', 'El mayor divisor compartido es el MCD.'],
    lcm: ['Piensa en los múltiplos de cada número.', 'El menor múltiplo compartido es el MCM.'],
    power: ['Una potencia es una multiplicación repetida.', 'Multiplica la base por sí misma tantas veces como dice el exponente.'],
    'power-general': ['El exponente dice cuántas veces se multiplica la base por sí misma.', 'Exponente 0 da 1 y exponente 1 deja la base igual; para el resto, multiplica la base paso a paso.'],
    'square-root': ['Busca qué número multiplicado por sí mismo da el radicando.', 'Prueba con las tablas: n × n.'],
    'integer-addition': ['Piensa en una recta numérica: avanzar o retroceder.', 'Sumas de signos iguales: suma y conserva el signo; de signos distintos, resta y gana el signo del mayor.'],
    'integer-subtraction': ['Restar es sumar el opuesto.', 'Convierte a − b en a + (−b) y aplica las reglas de la suma.'],
    'integer-multiplication': ['Multiplica los valores sin signo primero.', 'Dos signos iguales dan más; signos distintos, menos.'],
    'integer-division': ['Divide los valores sin signo primero.', 'Dos signos iguales dan más; signos distintos, menos.'],
    'simple-equation': ['Deja la x sola en un lado.', 'Deshaz las operaciones al revés, en ambos lados.'],
    ratio: ['Compara cuántas veces contiene un número al otro.', 'Multiplica por el mismo factor en los dos términos.'],
    proportion: ['Primero halla el valor de una unidad.', 'Después multiplica por la cantidad pedida.'],
    'scale-conversion': ['La escala te dice cuántas unidades reales vale cada unidad del plano.', 'Multiplica o divide por el denominador de la escala.'],
    'number-line-decimal': ['Cuenta las marcas desde el 0 y fíjate cuánto vale cada una.', 'Cada marca vale una décima (o una centésima): multiplica el paso por las marcas que hay hasta el punto.'],
    'number-line-integer': ['Cuenta las marcas desde el principio de la recta.', 'Si el punto está a la izquierda del 0 el número es negativo; a la derecha, positivo.'],
  };

  const hints = HINTS[operation];
  if (!hints) {
    return level === 1 ? 'Descompón el problema en pasos pequeños y comprueba cada paso.' : 'Repite el cálculo despacio y comprueba las unidades del resultado.';
  }
  return hints[level - 1];
}

/**
 * Mensaje para errores típicos detectables comparando la respuesta con la
 * correcta. Devuelve null si no se identifica un error conocido.
 */
export function typicalMistakeMessage(problem: Problem, userAnswer: string): string | null {
  const parsed = typeof userAnswer === 'string' ? parseFullNumber(userAnswer) : null;
  if (parsed === null) {
    return null;
  }

  const answer = (problem as { answer: number }).answer;
  if (typeof answer !== 'number' || numbersEqual(parsed, answer)) {
    return null;
  }

  // Error de coma decimal.
  if (parsed !== 0 && (numbersEqual(parsed, answer * 10) || numbersEqual(parsed, answer / 10))) {
    return 'Parece un error con la coma decimal. Revisa las posiciones.';
  }

  // Restas al revés (2 − a en lugar de a − b).
  if (problem.operation === 'subtraction' || problem.operation === 'decimal-subtraction') {
    const { num1, num2 } = problem as { num1: number; num2: number };
    if (numbersEqual(parsed, num2 - num1)) {
      return 'Parece que restaste al revés: el número mayor va primero.';
    }
  }

  // División: confundir el dividendo con el cociente.
  if (problem.operation === 'division') {
    const { num1, num2 } = problem as { num1: number; num2: number };
    if (numbersEqual(parsed, num1)) {
      return `Ese es el dividendo. Tienes que repartir ${num1} entre ${num2}.`;
    }
  }

  // Media sin dividir.
  if (isMeanProblem(problem)) {
    const sum = problem.values.reduce((total, value) => total + value, 0);
    if (numbersEqual(parsed, sum)) {
      return 'Esa es la suma de los datos. La media es la suma dividida entre cuántos datos hay.';
    }
  }

  // Perímetro sin doblar lados.
  if (problem.operation === 'perimeter-rectangle') {
    const match = problem.prompt.match(/(\d+)\D+(\d+)/);
    if (match) {
      const a = Number(match[1]);
      const b = Number(match[2]);
      if (numbersEqual(parsed, a + b)) {
        return 'Faltan los otros dos lados: el perímetro es 2 × (largo + ancho).';
      }
    }
  }

  // División con resto: resto y cociente intercambiados.
  if (isRemainderProblem(problem) && typeof userAnswer === 'string') {
    const match = userAnswer.trim().match(/^(\d+)\s*(?:resto|r)\s*(\d+)$/i);
    if (match) {
      const quotient = Number(match[1]);
      const remainder = Number(match[2]);
      if (quotient === problem.answer.remainder && remainder === problem.answer.quotient) {
        return 'Has intercambiado el cociente y el resto.';
      }
    }
  }

  return null;
}

/** true si la respuesta correcta admite además una forma simplificada distinta. */
export function simplifiableFractionNote(problem: Problem, userNumerator: number, userDenominator: number): string | null {
  if (!isFractionProblem(problem)) {
    return null;
  }
  if (isSimplifiedFraction({ numerator: userNumerator, denominator: userDenominator })) {
    return null;
  }
  const simplified = simplifyFraction({ numerator: userNumerator, denominator: userDenominator });
  return `¡Correcto! Además se puede simplificar: ${simplified.numerator}/${simplified.denominator}.`;
}
