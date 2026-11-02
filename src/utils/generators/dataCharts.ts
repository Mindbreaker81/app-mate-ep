import type { DataChartProblem } from '../../types';
import { randomInt, shuffle, type LevelConfig } from './shared';

/**
 * Gráficos de barras y pictogramas con preguntas (PIT-17). Frecuencias
 * enteras, símbolos completos (sin medias figuras) y preguntas de lectura:
 * frecuencia, total, diferencia y «el más frecuente» (solo con máximo único).
 * La tabla textual equivalente la construye el componente a partir del
 * payload; nunca se generan datos en el render.
 */

interface ChartTheme {
  title: string;
  unit: string;
  symbol: string;
  categories: string[];
}

const THEMES: ChartTheme[] = [
  {
    title: 'Deporte favorito de la clase',
    unit: 'votos',
    symbol: '🏅',
    categories: ['fútbol', 'baloncesto', 'natación', 'atletismo', 'ciclismo'],
  },
  {
    title: 'Fruta favorita del cole',
    unit: 'votos',
    symbol: '🍎',
    categories: ['manzana', 'plátano', 'naranja', 'uva', 'pera'],
  },
  {
    title: 'Animales favoritos',
    unit: 'votos',
    symbol: '🐾',
    categories: ['perro', 'gato', 'conejo', 'caballo', 'tortuga'],
  },
];

const QUESTION_TYPES = ['frequency', 'total', 'difference', 'most-frequent'] as const;
type QuestionType = (typeof QUESTION_TYPES)[number];

/** Elige una pregunta válida para los datos; «diferencia» exige un resultado que no esté en la tabla. */
function pickQuestion(values: number[]): { question: QuestionType; indexes: number[] } {
  const validDifferencePairs: number[][] = [];
  for (let a = 0; a < values.length; a += 1) {
    for (let b = 0; b < values.length; b += 1) {
      if (a === b) {
        continue;
      }
      const difference = Math.abs(values[a] - values[b]);
      if (difference > 0 && !values.includes(difference)) {
        validDifferencePairs.push(values[a] > values[b] ? [a, b] : [b, a]);
      }
    }
  }

  const options = QUESTION_TYPES.filter((question) => question !== 'difference' || validDifferencePairs.length > 0);
  const question = options[randomInt(0, options.length - 1)];
  if (question === 'frequency') {
    return { question, indexes: [randomInt(0, values.length - 1)] };
  }
  if (question === 'difference') {
    const [a, b] = validDifferencePairs[randomInt(0, validDifferencePairs.length - 1)];
    return { question, indexes: [a, b] };
  }
  if (question === 'most-frequent') {
    return { question, indexes: [values.indexOf(Math.max(...values))] };
  }
  return { question, indexes: [] };
}

function buildProblem(
  operation: DataChartProblem['operation'],
  theme: ChartTheme,
  values: number[],
  symbolValue: 1 | 2 | 5,
): DataChartProblem {
  const categories = shuffle(theme.categories).slice(0, values.length);
  const { question, indexes } = pickQuestion(values);
  const total = values.reduce((sum, value) => sum + value, 0);

  let prompt: string;
  let answer: number | string;
  let explanation: string;
  let options: string[] | undefined;

  switch (question) {
    case 'frequency': {
      const [index] = indexes;
      answer = values[index];
      prompt = `¿Cuántos ${theme.unit} reúne «${categories[index]}»?`;
      explanation =
        operation === 'pictogram-reading'
          ? `«${categories[index]}» tiene ${values[index] / symbolValue} símbolos y cada símbolo vale ${symbolValue}: ${values[index] / symbolValue} × ${symbolValue} = ${values[index]}.`
          : `La barra de «${categories[index]}» llega hasta ${values[index]}.`;
      break;
    }
    case 'total':
      answer = total;
      prompt = `¿Cuántos ${theme.unit} hay en total entre todas las categorías?`;
      explanation = `Suma todas las frecuencias: ${values.join(' + ')} = ${total}.`;
      break;
    case 'difference': {
      const [a, b] = indexes;
      answer = values[a] - values[b];
      prompt = `¿Cuántos ${theme.unit} más reúne «${categories[a]}» que «${categories[b]}»?`;
      explanation = `«${categories[a]}» tiene ${values[a]} y «${categories[b]}» tiene ${values[b]}: ${values[a]} − ${values[b]} = ${answer}.`;
      break;
    }
    case 'most-frequent': {
      const [index] = indexes;
      answer = categories[index];
      prompt = `¿Cuál es la categoría que más ${theme.unit} reúne?`;
      options = shuffle(categories);
      explanation = `«${categories[index]}» es la más alta: ${values[index]} ${theme.unit}, más que ninguna otra.`;
      break;
    }
  }

  return {
    prompt,
    operation,
    title: theme.title,
    unit: theme.unit,
    categories,
    values,
    symbolValue,
    symbol: theme.symbol,
    question,
    questionIndexes: indexes,
    answer,
    options,
    explanation,
  };
}

/** Gráfico de barras: frecuencias enteras distintas (el máximo es único). */
export function generateBarChartReading(levelConfig: LevelConfig): DataChartProblem {
  const maxValue = Math.min(6 + levelConfig.id, 12);
  const possibleValues = shuffle(Array.from({ length: maxValue - 1 }, (_, index) => index + 2));
  const categoryCount = randomInt(3, 5);
  return buildProblem('bar-chart-reading', THEMES[randomInt(0, THEMES.length - 1)], possibleValues.slice(0, categoryCount), 1);
}

/** Pictograma: símbolos completos, frecuencias múltiplo exacto de la leyenda. */
export function generatePictogramReading(levelConfig: LevelConfig): DataChartProblem {
  const symbolValue = ([1, 2, 5] as const)[randomInt(0, 2)];
  const categoryCount = randomInt(3, 5);
  // Recuentos de símbolos distintos 1..N: máximo único garantizado.
  const maxSymbolCount = Math.min(4 + levelConfig.id, 6);
  const symbolCounts = shuffle(
    Array.from({ length: maxSymbolCount }, (_, index) => index + 1),
  ).slice(0, categoryCount);
  const values = symbolCounts.map((count) => count * symbolValue);
  return buildProblem('pictogram-reading', THEMES[randomInt(0, THEMES.length - 1)], values, symbolValue);
}
