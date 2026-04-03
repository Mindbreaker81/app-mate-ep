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
  }
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
  'fraction-multiplication',
  'fraction-division',
  'decimal-addition',
  'decimal-subtraction',
  'decimal-multiplication',
  'decimal-division',
  'power',
  'percentage',
  'estimation',
  'factorization',
];

export const GRADE_CONFIGS: Record<'4t' | '5e', GradeConfig> = {
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
    description: 'Añade decimales, potencias, porcentajes, estimación y factorización.',
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
    operations: FIFTH_GRADE_OPERATIONS,
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
    operations: FIFTH_GRADE_OPERATIONS,
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
    operations: FIFTH_GRADE_OPERATIONS,
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
    operations: FIFTH_GRADE_OPERATIONS,
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
    operations: FIFTH_GRADE_OPERATIONS,
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
    operations: FIFTH_GRADE_OPERATIONS,
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
    operations: FIFTH_GRADE_OPERATIONS,
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
    operations: FIFTH_GRADE_OPERATIONS,
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
    operations: FIFTH_GRADE_OPERATIONS,
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
    operations: FIFTH_GRADE_OPERATIONS,
  },
];

export function getGradeConfig(grade: '4t' | '5e'): GradeConfig {
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