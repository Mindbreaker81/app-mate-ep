import type { WordProblem } from '../../types';
import { formatMathNumber } from '../mathUtils';
import { randomInt, type LevelConfig } from './shared';

type WordTemplate = (config: LevelConfig) => WordProblem;

const templates: WordTemplate[] = [
  (config) => {
    const total = randomInt(12, config.maxNumber);
    const friends = randomInt(2, 6);
    const answer = Math.floor(total / friends);
    return {
      prompt: `Tienes ${total} caramelos y los repartes entre ${friends} amigos por igual. ¿Cuántos recibe cada uno?`,
      operation: 'word-problem',
      answer,
      explanation: `Paso 1: ${total} ÷ ${friends} = ${answer}.`,
    };
  },
  (config) => {
    const count = randomInt(2, 8);
    const price = randomInt(1, Math.min(config.maxNumberMult, 10));
    const answer = count * price;
    return {
      prompt: `Compras ${count} bolis a ${price} € cada uno. ¿Cuánto pagas en total?`,
      operation: 'word-problem',
      answer,
      explanation: `Paso 1: ${count} × ${price} = ${answer} €.`,
    };
  },
  (config) => {
    const bill = randomInt(10, Math.min(config.maxNumber, 50));
    const spent = randomInt(1, bill - 1);
    const answer = bill - spent;
    return {
      prompt: `Pagas con un billete de ${bill} € y gastas ${spent} €. ¿Cuánto te devuelven?`,
      operation: 'word-problem',
      answer,
      explanation: `Paso 1: ${bill} - ${spent} = ${answer} €.`,
    };
  },
  (config) => {
    const a = randomInt(5, config.maxNumber);
    const b = randomInt(5, config.maxNumber);
    const answer = a + b;
    return {
      prompt: `María tiene ${a} pegatinas y Pedro ${b}. ¿Cuántas tienen entre los dos?`,
      operation: 'word-problem',
      answer,
      explanation: `Paso 1: ${a} + ${b} = ${answer}.`,
    };
  },
  (config) => {
    const a = randomInt(10, config.maxNumber);
    const b = randomInt(1, a - 1);
    const answer = a - b;
    return {
      prompt: `Ana tiene ${a} cartas y regala ${b}. ¿Cuántas le quedan?`,
      operation: 'word-problem',
      answer,
      explanation: `Paso 1: ${a} - ${b} = ${answer}.`,
    };
  },
  (config) => {
    const price = randomInt(2, Math.min(config.maxNumberMult, 10));
    const count = randomInt(2, 5);
    const bill = price * count + randomInt(1, 5);
    const answer = bill - price * count;
    return {
      prompt: `Compras ${count} libros a ${price} € y pagas con ${bill} €. ¿Cuánto te devuelven?`,
      operation: 'word-problem',
      answer,
      explanation: `Paso 1: ${count} × ${price} = ${price * count}.\nPaso 2: ${bill} - ${price * count} = ${answer} €.`,
    };
  },
  (config) => {
    const speed = randomInt(2, Math.min(config.maxNumberMult, 10));
    const hours = randomInt(2, Math.min(config.maxNumberDiv, 6));
    const answer = speed * hours;
    return {
      prompt: `Un coche va a ${speed} km/h durante ${hours} horas. ¿Cuántos km recorre?`,
      operation: 'word-problem',
      answer,
      explanation: `Paso 1: ${speed} × ${hours} = ${answer} km.`,
    };
  },
  (config) => {
    const target = randomInt(20, config.maxNumber);
    const current = randomInt(1, target - 1);
    const answer = target - current;
    return {
      prompt: `Necesitas ${target} puntos y tienes ${current}. ¿Cuántos te faltan?`,
      operation: 'word-problem',
      answer,
      explanation: `Paso 1: ${target} - ${current} = ${answer}.`,
    };
  },
  (config) => {
    const divisor = randomInt(3, Math.min(config.maxNumberDiv, 9));
    const quotient = randomInt(2, 8);
    const remainder = randomInt(1, divisor - 1);
    const total = divisor * quotient + remainder;
    return {
      prompt: `Repartes ${total} galletas entre ${divisor} niños. ¿Cuántas recibe cada uno?`,
      operation: 'word-problem',
      answer: quotient,
      explanation: `Paso 1: ${total} ÷ ${divisor} = ${quotient} resto ${remainder}. Cada uno recibe ${quotient}.`,
    };
  },
  (config) => {
    const q1 = randomInt(2, Math.min(config.maxNumberDiv, 5));
    const price = randomInt(2, Math.min(config.maxNumberMult, 10));
    const q2 = q1 + randomInt(1, 4);
    const answer = q2 * price;
    return {
      prompt: `Si ${q1} cuadernos cuestan ${q1 * price} €, ¿cuánto cuestan ${q2}?`,
      operation: 'word-problem',
      answer,
      explanation: `Paso 1: Precio unitario ${price} €.\nPaso 2: ${q2} × ${price} = ${answer} €.`,
    };
  },
  (config) => {
    const price = roundCents(randomInt(150, config.maxDecimalWhole * 100) / 100);
    const count = randomInt(2, 5);
    const answer = roundCents(price * count);
    return {
      prompt: `Cada manzana cuesta ${formatMathNumber(price)} €. Compras ${count}. ¿Cuánto pagas?`,
      operation: 'word-problem',
      answer,
      explanation: `Paso 1: ${formatMathNumber(price)} × ${count} = ${formatMathNumber(answer)} €.`,
    };
  },
  (config) => {
    const total = randomInt(8, config.maxNumber);
    const half = Math.floor(total / 2);
    return {
      prompt: `En una fiesta hay ${total} invitados. La mitad son niños. ¿Cuántos niños hay?`,
      operation: 'word-problem',
      answer: half,
      explanation: `Paso 1: La mitad de ${total} es ${half}.`,
    };
  },
  // — Dos pasos —
  (config) => {
    const rows = randomInt(3, Math.min(config.maxNumberMult, 8));
    const seats = randomInt(4, Math.min(config.maxNumberMult, 10));
    const total = rows * seats;
    const occupied = randomInt(1, total - 1);
    const answer = total - occupied;
    return {
      prompt: `Un cine tiene ${rows} filas de ${seats} butacas y hay ${occupied} personas sentadas. ¿Cuántas butacas quedan libres?`,
      operation: 'word-problem',
      answer,
      explanation: `Paso 1: ${rows} × ${seats} = ${total} butacas.\nPaso 2: ${total} - ${occupied} = ${answer} libres.`,
    };
  },
  (config) => {
    const weekly = randomInt(2, Math.min(config.maxNumberMult, 10));
    const weeks = randomInt(3, Math.min(config.maxNumberDiv, 8));
    const saved = weekly * weeks;
    const price = randomInt(1, saved - 1);
    const answer = saved - price;
    return {
      prompt: `Ahorras ${weekly} € cada semana durante ${weeks} semanas y te compras un juego de ${price} €. ¿Cuánto dinero te queda?`,
      operation: 'word-problem',
      answer,
      explanation: `Paso 1: ${weekly} × ${weeks} = ${saved} € ahorrados.\nPaso 2: ${saved} - ${price} = ${answer} €.`,
    };
  },
  (config) => {
    const packs = randomInt(2, Math.min(config.maxNumberDiv, 6));
    const perPack = randomInt(4, Math.min(config.maxNumberMult, 10));
    const eaten = randomInt(1, packs * perPack - 1);
    const answer = packs * perPack - eaten;
    return {
      prompt: `Compras ${packs} paquetes de ${perPack} galletas y en la merienda os coméis ${eaten}. ¿Cuántas galletas quedan?`,
      operation: 'word-problem',
      answer,
      explanation: `Paso 1: ${packs} × ${perPack} = ${packs * perPack} galletas.\nPaso 2: ${packs * perPack} - ${eaten} = ${answer}.`,
    };
  },
  // — Con datos distractores (hay que ignorar un dato) —
  (config) => {
    const pets = randomInt(1, 4);
    const friends = randomInt(2, 6);
    const perFriend = randomInt(2, Math.min(config.maxNumberMult, 9));
    const candies = friends * perFriend;
    return {
      prompt: `María tiene ${pets} perros y ${candies} caramelos. Reparte los caramelos entre ${friends} amigos por igual. ¿Cuántos caramelos recibe cada amigo?`,
      operation: 'word-problem',
      answer: perFriend,
      explanation: `Los perros no importan.\nPaso 1: ${candies} ÷ ${friends} = ${perFriend}.`,
    };
  },
  (config) => {
    const seats = randomInt(30, Math.max(config.maxNumber, 40));
    const passengers = randomInt(1, seats - 1);
    const km = randomInt(5, Math.max(config.maxNumber, 20));
    const answer = seats - passengers;
    return {
      prompt: `Un autobús con ${seats} plazas lleva ${passengers} viajeros y recorre ${km} km. ¿Cuántas plazas libres quedan?`,
      operation: 'word-problem',
      answer,
      explanation: `Los km no importan.\nPaso 1: ${seats} - ${passengers} = ${answer} plazas libres.`,
    };
  },
  (config) => {
    const age = randomInt(8, 12);
    const stickers = randomInt(10, config.maxNumber + 10);
    const given = randomInt(1, stickers - 1);
    const answer = stickers - given;
    return {
      prompt: `Pablo tiene ${age} años y ${stickers} cromos. Regala ${given} cromos a su hermana. ¿Cuántos cromos le quedan?`,
      operation: 'word-problem',
      answer,
      explanation: `La edad no importa.\nPaso 1: ${stickers} - ${given} = ${answer} cromos.`,
    };
  },
];

/** Solo para tests: valida cada plantilla por separado. */
export const __templates = templates;

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

export function generateWordProblem(levelConfig: LevelConfig): WordProblem {
  const template = templates[randomInt(0, templates.length - 1)];
  return template(levelConfig);
}
