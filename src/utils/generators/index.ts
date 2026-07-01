import type { GradeId, Operation, PracticeMode, Problem } from '../../types';
import { LEVELS, getGradeConfig } from '../gameConfig';
import {
  generateAddition,
  generateDecimalProblem,
  generateDivision,
  generateDivisionRemainder,
  generateMultiplication,
  generateSubtraction,
} from './numeric';
import {
  generateCompareDecimals,
  generateCompareFractionDecimal,
  generateCompareFractions,
  generateOrderValues,
} from './comparison';
import {
  generateDecimalToFraction,
  generateFractionAddition,
  generateFractionDivision,
  generateFractionMultiplication,
  generateFractionSubtraction,
  generateFractionToDecimal,
  generateMixedNumberAddition,
  generateMixedNumberConvert,
  generateMixedNumberSubtraction,
} from './fractions';
import { generateEstimationProblem } from './estimation';
import {
  generateAngleType,
  generateAreaRectangle,
  generateAreaTriangle,
  generatePerimeterRectangle,
  generatePerimeterSquare,
} from './geometry';
import { generateMixedProblem } from './mixed';
import {
  generateFactorizationProblem,
  generateGcdProblem,
  generateLcmProblem,
} from './numberTheory';
import { generatePercentageProblem } from './percentages';
import { generatePowerProblem, generateSquareRootProblem } from './powers';
import { generateRoundDecimal } from './rounding';
import { pickRandom, type LevelConfig } from './shared';
import { generateSimpleEquation } from './equations';
import { generateGeometryAdvancedProblem } from './geometryAdvanced';
import {
  generateIntegerCompare,
  generateIntegerOrder,
  generateIntegerProblem,
} from './integers';
import { generateProbabilityProblem } from './probability';
import { generateProportionProblem, generateRatioProblem } from './ratios';
import { generateScaleConversion } from './scales';
import { generateStatisticsProblem } from './statistics';
import { generateUnitConversion } from './units';
import { generateWordProblem } from './wordProblems';

export const ALL_MODE_WEIGHTS: Partial<Record<Operation, number>> = {
  addition: 2,
  subtraction: 2,
  multiplication: 2,
  division: 2,
  'division-remainder': 1.5,
  'fraction-addition': 1.5,
  'fraction-subtraction': 1.5,
  'fraction-multiplication': 1.5,
  'fraction-division': 1.5,
  mixed: 1.5,
  'decimal-addition': 1.5,
  'decimal-subtraction': 1.5,
  'decimal-multiplication': 1.5,
  'decimal-division': 1.5,
  power: 1,
  'square-root': 1,
  percentage: 1,
  estimation: 1,
  factorization: 1,
  gcd: 1,
  lcm: 1,
  'word-problem': 1,
  mean: 1,
  'mixed-number-addition': 1,
  'mixed-number-subtraction': 1,
  'mixed-number-convert': 1,
  'fraction-to-decimal': 1,
  'decimal-to-fraction': 1,
  'compare-fractions': 1,
  'compare-decimals': 1,
  'compare-fraction-decimal': 1,
  'order-values': 1,
  'perimeter-rectangle': 0.8,
  'perimeter-square': 0.8,
  'area-rectangle': 0.8,
  'area-triangle': 0.8,
  'angle-type': 0.5,
  'unit-conversion': 1,
  'round-decimal': 1,
  'integer-addition': 1,
  'integer-subtraction': 1,
  'integer-multiplication': 1,
  'integer-division': 1,
  'integer-compare': 0.8,
  'integer-order': 0.8,
  'simple-equation': 0.8,
  ratio: 0.8,
  proportion: 0.8,
  median: 0.8,
  mode: 0.8,
  range: 0.8,
  'probability-simple': 0.6,
  'circle-area': 0.7,
  'circle-circumference': 0.7,
  'volume-rectangular-prism': 0.7,
  'triangle-angle-sum': 0.7,
  'scale-conversion': 0.7,
};

const OPERATION_MAP: Record<PracticeMode, Operation[]> = {
  all: [],
  addition: ['addition'],
  subtraction: ['subtraction'],
  multiplication: ['multiplication'],
  division: ['division', 'division-remainder'],
  fractions: [
    'fraction-addition',
    'fraction-subtraction',
    'fraction-multiplication',
    'fraction-division',
  ],
  mixed: ['mixed'],
  decimals: ['decimal-addition', 'decimal-subtraction', 'decimal-multiplication', 'decimal-division'],
  powers: ['power', 'square-root'],
  percentages: ['percentage'],
  estimation: ['estimation'],
  factorization: ['factorization'],
  'word-problems': ['word-problem'],
  comparison: ['compare-fractions', 'compare-decimals', 'compare-fraction-decimal', 'order-values'],
  conversions: [
    'mixed-number-addition',
    'mixed-number-subtraction',
    'mixed-number-convert',
    'fraction-to-decimal',
    'decimal-to-fraction',
  ],
  'number-theory': ['factorization', 'gcd', 'lcm'],
  geometry: ['perimeter-rectangle', 'perimeter-square', 'area-rectangle', 'area-triangle', 'angle-type'],
  units: ['unit-conversion'],
  statistics: ['mean', 'median', 'mode', 'range'],
  rounding: ['round-decimal'],
  integers: [
    'integer-addition',
    'integer-subtraction',
    'integer-multiplication',
    'integer-division',
    'integer-compare',
    'integer-order',
  ],
  equations: ['simple-equation'],
  ratios: ['ratio', 'proportion'],
  probability: ['probability-simple'],
  'geometry-advanced': [
    'circle-area',
    'circle-circumference',
    'volume-rectangular-prism',
    'triangle-angle-sum',
  ],
  scales: ['scale-conversion'],
};

function pickWeightedOperation(operations: Operation[]): Operation {
  const weights = operations.map((operation) => ALL_MODE_WEIGHTS[operation] ?? 1);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = Math.random() * total;
  for (let index = 0; index < operations.length; index += 1) {
    roll -= weights[index];
    if (roll <= 0) {
      return operations[index];
    }
  }
  return operations[operations.length - 1];
}

export function getAvailableOperations(
  levelConfig: LevelConfig,
  practiceMode: PracticeMode,
  grade: GradeId,
): Operation[] {
  const gradeOperations = levelConfig.operations.filter((operation) =>
    getGradeConfig(grade).availableOperations.includes(operation),
  );

  const modeOperations = OPERATION_MAP[practiceMode];
  const selected =
    practiceMode === 'all'
      ? gradeOperations
      : modeOperations.filter((operation) => gradeOperations.includes(operation));

  return selected.length > 0 ? selected : gradeOperations;
}

function generateByOperation(operation: Operation, level: number, levelConfig: LevelConfig): Problem {
  switch (operation) {
    case 'addition':
      return generateAddition(levelConfig);
    case 'subtraction':
      return generateSubtraction(levelConfig);
    case 'multiplication':
      return generateMultiplication(levelConfig);
    case 'division':
      return generateDivision(levelConfig);
    case 'division-remainder':
      return generateDivisionRemainder(levelConfig);
    case 'decimal-addition':
      return generateDecimalProblem(levelConfig, 'decimal-addition');
    case 'decimal-subtraction':
      return generateDecimalProblem(levelConfig, 'decimal-subtraction');
    case 'decimal-multiplication':
      return generateDecimalProblem(levelConfig, 'decimal-multiplication');
    case 'decimal-division':
      return generateDecimalProblem(levelConfig, 'decimal-division');
    case 'fraction-addition':
      return generateFractionAddition(levelConfig);
    case 'fraction-subtraction':
      return generateFractionSubtraction(levelConfig);
    case 'fraction-multiplication':
      return generateFractionMultiplication(levelConfig);
    case 'fraction-division':
      return generateFractionDivision(levelConfig);
    case 'mixed-number-addition':
      return generateMixedNumberAddition(levelConfig);
    case 'mixed-number-subtraction':
      return generateMixedNumberSubtraction(levelConfig);
    case 'mixed-number-convert':
      return generateMixedNumberConvert(levelConfig);
    case 'fraction-to-decimal':
      return generateFractionToDecimal(levelConfig);
    case 'decimal-to-fraction':
      return generateDecimalToFraction(levelConfig);
    case 'compare-fractions':
      return generateCompareFractions(levelConfig);
    case 'compare-decimals':
      return generateCompareDecimals(levelConfig);
    case 'compare-fraction-decimal':
      return generateCompareFractionDecimal(levelConfig);
    case 'order-values':
      return generateOrderValues(levelConfig);
    case 'mixed':
      return generateMixedProblem(level, levelConfig);
    case 'power':
      return generatePowerProblem(levelConfig);
    case 'square-root':
      return generateSquareRootProblem(levelConfig);
    case 'percentage':
      return generatePercentageProblem(levelConfig);
    case 'estimation':
      return generateEstimationProblem(levelConfig);
    case 'factorization':
      return generateFactorizationProblem(levelConfig);
    case 'gcd':
      return generateGcdProblem(levelConfig);
    case 'lcm':
      return generateLcmProblem(levelConfig);
    case 'word-problem':
      return generateWordProblem(levelConfig);
    case 'mean':
      return generateStatisticsProblem(levelConfig, 'mean');
    case 'median':
      return generateStatisticsProblem(levelConfig, 'median');
    case 'mode':
      return generateStatisticsProblem(levelConfig, 'mode');
    case 'range':
      return generateStatisticsProblem(levelConfig, 'range');
    case 'perimeter-rectangle':
      return generatePerimeterRectangle(levelConfig);
    case 'perimeter-square':
      return generatePerimeterSquare(levelConfig);
    case 'area-rectangle':
      return generateAreaRectangle(levelConfig);
    case 'area-triangle':
      return generateAreaTriangle(levelConfig);
    case 'angle-type':
      return generateAngleType(levelConfig);
    case 'unit-conversion':
      return generateUnitConversion(levelConfig);
    case 'round-decimal':
      return generateRoundDecimal(levelConfig);
    case 'integer-addition':
      return generateIntegerProblem(levelConfig, 'integer-addition');
    case 'integer-subtraction':
      return generateIntegerProblem(levelConfig, 'integer-subtraction');
    case 'integer-multiplication':
      return generateIntegerProblem(levelConfig, 'integer-multiplication');
    case 'integer-division':
      return generateIntegerProblem(levelConfig, 'integer-division');
    case 'integer-compare':
      return generateIntegerCompare(levelConfig);
    case 'integer-order':
      return generateIntegerOrder(levelConfig);
    case 'simple-equation':
      return generateSimpleEquation(levelConfig);
    case 'ratio':
      return generateRatioProblem(levelConfig);
    case 'proportion':
      return generateProportionProblem(levelConfig);
    case 'probability-simple':
      return generateProbabilityProblem(levelConfig);
    case 'circle-area':
    case 'circle-circumference':
    case 'volume-rectangular-prism':
    case 'triangle-angle-sum':
      return generateGeometryAdvancedProblem(levelConfig, operation);
    case 'scale-conversion':
      return generateScaleConversion(levelConfig);
    default: {
      const exhaustive: never = operation;
      throw new Error(`Operación no soportada: ${exhaustive}`);
    }
  }
}

export function generateProblem(
  level: number,
  practiceMode: PracticeMode = 'all',
  grade: GradeId = '4t',
): Problem {
  const levelConfig = LEVELS.find((entry) => entry.id === level) || LEVELS[0];
  const availableOperations = getAvailableOperations(levelConfig, practiceMode, grade);
  const operation =
    practiceMode === 'all'
      ? pickWeightedOperation(availableOperations)
      : pickRandom(availableOperations);

  return generateByOperation(operation, level, levelConfig);
}

export function calculateResponseTime(startTime: number): number {
  return Math.round((Date.now() - startTime) / 1000);
}

export function getDifficulty(level: number, operation: Operation): 'easy' | 'medium' | 'hard' {
  if (operation === 'multiplication' && level >= 3) return 'hard';
  if (operation === 'division' && level >= 2) return 'hard';
  if (operation === 'division-remainder') return level >= 4 ? 'hard' : 'medium';
  if (operation === 'mixed') return level >= 4 ? 'hard' : level >= 2 ? 'medium' : 'easy';
  if (operation.startsWith('decimal-')) return level >= 4 ? 'hard' : 'medium';
  if (operation === 'fraction-multiplication' || operation === 'fraction-division') {
    return level >= 4 ? 'hard' : 'medium';
  }
  if (operation.startsWith('mixed-number-') || operation.startsWith('compare-') || operation === 'order-values') {
    return level >= 4 ? 'hard' : 'medium';
  }
  if (operation === 'power' || operation === 'square-root') return level >= 5 ? 'medium' : 'easy';
  if (
    operation === 'percentage' ||
    operation === 'estimation' ||
    operation === 'factorization' ||
    operation === 'gcd' ||
    operation === 'lcm' ||
    operation === 'word-problem' ||
    operation === 'mean' ||
    operation.startsWith('perimeter-') ||
    operation.startsWith('area-') ||
    operation === 'angle-type' ||
    operation === 'unit-conversion' ||
    operation === 'round-decimal' ||
    operation === 'fraction-to-decimal' ||
    operation === 'decimal-to-fraction' ||
    operation.startsWith('integer-') ||
    operation === 'simple-equation' ||
    operation === 'ratio' ||
    operation === 'proportion' ||
    operation === 'median' ||
    operation === 'mode' ||
    operation === 'range' ||
    operation === 'probability-simple' ||
    operation.startsWith('circle-') ||
    operation === 'volume-rectangular-prism' ||
    operation === 'triangle-angle-sum' ||
    operation === 'scale-conversion'
  ) {
    return level >= 4 ? 'hard' : 'medium';
  }

  if (level === 1) return 'easy';
  if (level === 2 || level === 3) return 'medium';
  if (level >= 4) return 'hard';
  return 'medium';
}
