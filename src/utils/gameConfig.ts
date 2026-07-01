import type { Achievement, GradeConfig, Level, Operation } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_correct',
    name: '¡Primer Acierto!',
    description: 'Resuelve tu primer ejercicio correctamente',
    icon: '🎯',
    unlocked: false
  },
  {
    id: 'addition_expert',
    name: 'Sumador Experto',
    description: 'Resuelve 10 sumas correctamente',
    icon: '➕',
    unlocked: false
  },
  {
    id: 'subtraction_expert',
    name: 'Rey de las Restas',
    description: 'Resuelve 10 restas correctamente',
    icon: '➖',
    unlocked: false
  },
  {
    id: 'multiplication_expert',
    name: 'Maestro de las Multiplicaciones',
    description: 'Resuelve 10 multiplicaciones correctamente',
    icon: '✖️',
    unlocked: false
  },
  {
    id: 'division_expert',
    name: 'Campeón de las Divisiones',
    description: 'Resuelve 10 divisiones correctamente',
    icon: '➗',
    unlocked: false
  },
  {
    id: 'streak_5',
    name: '¡En Racha!',
    description: 'Resuelve 5 ejercicios seguidos correctamente',
    icon: '🔥',
    unlocked: false
  },
  {
    id: 'streak_10',
    name: '¡Imparable!',
    description: 'Resuelve 10 ejercicios seguidos correctamente',
    icon: '⚡',
    unlocked: false
  },
  {
    id: 'score_50',
    name: 'Campeón de Matemáticas',
    description: 'Resuelve 50 ejercicios correctamente',
    icon: '🏆',
    unlocked: false
  },
  {
    id: 'perfect_20',
    name: '¡Puntuación Perfecta!',
    description: 'Resuelve 20 ejercicios sin fallar ninguno',
    icon: '💎',
    unlocked: false
  },
  {
    id: 'fraction_master',
    name: 'Maestro de Fracciones',
    description: 'Resuelve 10 ejercicios de fracciones correctamente',
    icon: '½',
    unlocked: false
  },
  {
    id: 'decimal_master',
    name: 'Experto en Decimales',
    description: 'Resuelve 10 ejercicios con decimales correctamente',
    icon: '1.5',
    unlocked: false
  },
  {
    id: 'word_problem_solver',
    name: 'Detective Matemático',
    description: 'Resuelve 10 problemas verbales correctamente',
    icon: '🔍',
    unlocked: false
  },
  {
    id: 'geometry_guru',
    name: 'Gurú de la Geometría',
    description: 'Resuelve 10 ejercicios de geometría correctamente',
    icon: '📐',
    unlocked: false
  },
  {
    id: 'percentage_pro',
    name: 'Pro de los Porcentajes',
    description: 'Resuelve 10 ejercicios de porcentajes correctamente',
    icon: '%',
    unlocked: false
  },
  {
    id: 'estimation_eye',
    name: 'Ojo Clínico',
    description: 'Resuelve 10 ejercicios de estimación correctamente',
    icon: '≈',
    unlocked: false
  },
  {
    id: 'number_theory_fan',
    name: 'Cazador de Primos',
    description: 'Resuelve 10 ejercicios de teoría de números correctamente',
    icon: '🧩',
    unlocked: false
  },
  {
    id: 'mixed_ops_hero',
    name: 'Héroe de las Mixtas',
    description: 'Resuelve 10 operaciones mixtas correctamente',
    icon: '🔀',
    unlocked: false
  },
  {
    id: 'streak_25',
    name: 'Imparable ×2.5',
    description: 'Resuelve 25 ejercicios seguidos correctamente',
    icon: '🚀',
    unlocked: false
  },
  {
    id: 'level_10',
    name: 'Nivel Máximo',
    description: 'Alcanza el nivel 10',
    icon: '👑',
    unlocked: false
  },
  {
    id: 'speed_demon',
    name: 'Relámpago',
    description: 'Resuelve 10 ejercicios correctos con temporizador activo',
    icon: '⏱️',
    unlocked: false
  },
  {
    id: 'all_modes_explorer',
    name: 'Explorador Total',
    description: 'Acierta al menos un ejercicio en cada bloque de 5.º',
    icon: '🗺️',
    unlocked: false
  },
  {
    id: 'integer_master',
    name: 'Maestro de Enteros',
    description: 'Resuelve 10 ejercicios con enteros correctamente',
    icon: '➖➕',
    unlocked: false
  },
  {
    id: 'equation_solver',
    name: 'Cazador de Incógnitas',
    description: 'Resuelve 10 ecuaciones correctamente',
    icon: '𝑥',
    unlocked: false
  },
  {
    id: 'ratio_expert',
    name: 'Experto en Proporciones',
    description: 'Resuelve 10 ejercicios de razones correctamente',
    icon: '⚖️',
    unlocked: false
  },
  {
    id: 'stats_complete',
    name: 'Estadístico Completo',
    description: 'Domina media, mediana, moda y rango',
    icon: '📊',
    unlocked: false
  },
  {
    id: 'probability_lucky',
    name: 'Suerte Calculada',
    description: 'Resuelve 10 ejercicios de probabilidad correctamente',
    icon: '🎲',
    unlocked: false
  },
  {
    id: 'circle_master',
    name: 'Amigo del Círculo',
    description: 'Resuelve 10 ejercicios de círculo correctamente',
    icon: '⭕',
    unlocked: false
  },
  {
    id: 'sixth_grade_explorer',
    name: 'Explorador 6.º',
    description: 'Prueba todos los modos exclusivos de 6.º',
    icon: '🎓',
    unlocked: false
  },
];

const FOURTH_GRADE_OPERATIONS: Operation[] = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
  'fraction-addition',
  'fraction-subtraction',
  'mixed',
];

const FIFTH_GRADE_OPERATIONS: Operation[] = [
  ...FOURTH_GRADE_OPERATIONS,
  'division-remainder',
  'fraction-multiplication',
  'fraction-division',
  'mixed-number-addition',
  'mixed-number-subtraction',
  'mixed-number-convert',
  'fraction-to-decimal',
  'decimal-to-fraction',
  'compare-fractions',
  'compare-decimals',
  'compare-fraction-decimal',
  'order-values',
  'decimal-addition',
  'decimal-subtraction',
  'decimal-multiplication',
  'decimal-division',
  'power',
  'square-root',
  'percentage',
  'estimation',
  'factorization',
  'gcd',
  'lcm',
  'word-problem',
  'mean',
  'perimeter-rectangle',
  'perimeter-square',
  'area-rectangle',
  'area-triangle',
  'angle-type',
  'unit-conversion',
  'round-decimal',
];

const SIXTH_GRADE_ONLY_OPERATIONS: Operation[] = [
  'integer-addition',
  'integer-subtraction',
  'integer-multiplication',
  'integer-division',
  'integer-compare',
  'integer-order',
  'simple-equation',
  'ratio',
  'proportion',
  'median',
  'mode',
  'range',
  'probability-simple',
  'circle-area',
  'circle-circumference',
  'volume-rectangular-prism',
  'triangle-angle-sum',
  'scale-conversion',
];

const SIXTH_GRADE_OPERATIONS: Operation[] = [...FIFTH_GRADE_OPERATIONS, ...SIXTH_GRADE_ONLY_OPERATIONS];

export const GRADE_CONFIGS: Record<'4t' | '5e' | '6e', GradeConfig> = {
  '4t': {
    id: '4t',
    name: '4.º de Primaria',
    description: 'Operaciones base, fracciones sencillas y expresiones mixtas.',
    availableOperations: FOURTH_GRADE_OPERATIONS,
    availablePracticeModes: ['all', 'addition', 'subtraction', 'multiplication', 'division', 'fractions', 'mixed'],
  },
  '5e': {
    id: '5e',
    name: '5.º de Primaria',
    description: 'Decimales, fracciones avanzadas, problemas, geometría, medidas y más.',
    availableOperations: FIFTH_GRADE_OPERATIONS,
    availablePracticeModes: [
      'all',
      'addition',
      'subtraction',
      'multiplication',
      'division',
      'fractions',
      'mixed',
      'decimals',
      'powers',
      'percentages',
      'estimation',
      'factorization',
      'word-problems',
      'comparison',
      'conversions',
      'number-theory',
      'geometry',
      'units',
      'statistics',
      'rounding',
    ],
  },
  '6e': {
    id: '6e',
    name: '6.º de Primaria',
    description: 'Enteros, ecuaciones, proporcionalidad, probabilidad y geometría avanzada.',
    availableOperations: SIXTH_GRADE_OPERATIONS,
    availablePracticeModes: [
      'all',
      'addition',
      'subtraction',
      'multiplication',
      'division',
      'fractions',
      'mixed',
      'decimals',
      'powers',
      'percentages',
      'estimation',
      'factorization',
      'word-problems',
      'comparison',
      'conversions',
      'number-theory',
      'geometry',
      'units',
      'statistics',
      'rounding',
      'integers',
      'equations',
      'ratios',
      'probability',
      'geometry-advanced',
      'scales',
    ],
  },
};

export const LEVELS: Level[] = [
  {
    id: 1,
    name: 'Nivel 1',
    minScore: 0,
    maxNumber: 10,
    maxNumberMult: 5,
    maxNumberDiv: 5,
    maxDenominator: 5,
    maxDecimalWhole: 10,
    maxDecimalPlaces: 1,
    maxPowerBase: 5,
    maxPercentageBase: 40,
    maxEstimationValue: 50,
    maxFactorizationNumber: 24,
    operations: SIXTH_GRADE_OPERATIONS,
  },
  {
    id: 2,
    name: 'Nivel 2',
    minScore: 10,
    maxNumber: 15,
    maxNumberMult: 7,
    maxNumberDiv: 7,
    maxDenominator: 6,
    maxDecimalWhole: 15,
    maxDecimalPlaces: 1,
    maxPowerBase: 6,
    maxPercentageBase: 60,
    maxEstimationValue: 80,
    maxFactorizationNumber: 30,
    operations: SIXTH_GRADE_OPERATIONS,
  },
  {
    id: 3,
    name: 'Nivel 3',
    minScore: 20,
    maxNumber: 20,
    maxNumberMult: 10,
    maxNumberDiv: 10,
    maxDenominator: 8,
    maxDecimalWhole: 20,
    maxDecimalPlaces: 1,
    maxPowerBase: 8,
    maxPercentageBase: 80,
    maxEstimationValue: 120,
    maxFactorizationNumber: 36,
    operations: SIXTH_GRADE_OPERATIONS,
  },
  {
    id: 4,
    name: 'Nivel 4',
    minScore: 35,
    maxNumber: 30,
    maxNumberMult: 12,
    maxNumberDiv: 12,
    maxDenominator: 10,
    maxDecimalWhole: 30,
    maxDecimalPlaces: 2,
    maxPowerBase: 10,
    maxPercentageBase: 100,
    maxEstimationValue: 200,
    maxFactorizationNumber: 48,
    operations: SIXTH_GRADE_OPERATIONS,
  },
  {
    id: 5,
    name: 'Nivel 5',
    minScore: 50,
    maxNumber: 50,
    maxNumberMult: 15,
    maxNumberDiv: 15,
    maxDenominator: 12,
    maxDecimalWhole: 50,
    maxDecimalPlaces: 2,
    maxPowerBase: 12,
    maxPercentageBase: 120,
    maxEstimationValue: 300,
    maxFactorizationNumber: 60,
    operations: SIXTH_GRADE_OPERATIONS,
  },
  {
    id: 6,
    name: 'Nivel 6',
    minScore: 70,
    maxNumber: 75,
    maxNumberMult: 20,
    maxNumberDiv: 20,
    maxDenominator: 15,
    maxDecimalWhole: 75,
    maxDecimalPlaces: 2,
    maxPowerBase: 15,
    maxPercentageBase: 150,
    maxEstimationValue: 450,
    maxFactorizationNumber: 72,
    operations: SIXTH_GRADE_OPERATIONS,
  },
  {
    id: 7,
    name: 'Nivel 7',
    minScore: 100,
    maxNumber: 100,
    maxNumberMult: 25,
    maxNumberDiv: 25,
    maxDenominator: 18,
    maxDecimalWhole: 100,
    maxDecimalPlaces: 2,
    maxPowerBase: 18,
    maxPercentageBase: 180,
    maxEstimationValue: 600,
    maxFactorizationNumber: 84,
    operations: SIXTH_GRADE_OPERATIONS,
  },
  {
    id: 8,
    name: 'Nivel 8',
    minScore: 130,
    maxNumber: 150,
    maxNumberMult: 30,
    maxNumberDiv: 30,
    maxDenominator: 20,
    maxDecimalWhole: 150,
    maxDecimalPlaces: 3,
    maxPowerBase: 20,
    maxPercentageBase: 220,
    maxEstimationValue: 900,
    maxFactorizationNumber: 96,
    operations: SIXTH_GRADE_OPERATIONS,
  },
  {
    id: 9,
    name: 'Nivel 9',
    minScore: 170,
    maxNumber: 200,
    maxNumberMult: 40,
    maxNumberDiv: 40,
    maxDenominator: 25,
    maxDecimalWhole: 200,
    maxDecimalPlaces: 3,
    maxPowerBase: 25,
    maxPercentageBase: 260,
    maxEstimationValue: 1200,
    maxFactorizationNumber: 108,
    operations: SIXTH_GRADE_OPERATIONS,
  },
  {
    id: 10,
    name: 'Nivel 10',
    minScore: 220,
    maxNumber: 300,
    maxNumberMult: 50,
    maxNumberDiv: 50,
    maxDenominator: 30,
    maxDecimalWhole: 300,
    maxDecimalPlaces: 3,
    maxPowerBase: 30,
    maxPercentageBase: 320,
    maxEstimationValue: 1600,
    maxFactorizationNumber: 120,
    operations: SIXTH_GRADE_OPERATIONS,
  },
];

export function getGradeConfig(grade: '4t' | '5e' | '6e'): GradeConfig {
  return GRADE_CONFIGS[grade];
}

export function getDifficultyForLevel(level: number): 'easy' | 'medium' | 'hard' {
  switch (level) {
    case 1: return 'easy';
    case 2: return 'medium';
    case 3: return 'medium';
    case 4: return 'hard';
    default: return 'easy';
  }
} 