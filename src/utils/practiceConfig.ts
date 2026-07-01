import type { GradeId, PracticeMode, PracticeModeCategory, PracticeModeConfig } from '../types';
import { getGradeConfig } from './gameConfig';

export const PRACTICE_MODES: PracticeModeConfig[] = [
  {
    mode: 'all',
    label: 'Todas las Operaciones',
    icon: '🧮',
    description: 'Practica todas las operaciones disponibles para tu curso',
    category: 'basic',
  },
  {
    mode: 'addition',
    label: 'Solo Sumas',
    icon: '➕',
    description: 'Enfócate en mejorar las sumas',
    category: 'basic',
  },
  {
    mode: 'subtraction',
    label: 'Solo Restas',
    icon: '➖',
    description: 'Practica específicamente las restas',
    category: 'basic',
  },
  {
    mode: 'multiplication',
    label: 'Solo Multiplicaciones',
    icon: '✖️',
    description: 'Mejora tus tablas de multiplicar',
    category: 'basic',
  },
  {
    mode: 'division',
    label: 'Solo Divisiones',
    icon: '➗',
    description: 'Practica divisiones exactas y con resto',
    category: 'basic',
  },
  {
    mode: 'fractions',
    label: 'Fracciones',
    icon: '½',
    description: 'Practica fracciones con suma, resta, multiplicación y división',
    category: 'fractions-decimals',
  },
  {
    mode: 'decimals',
    label: 'Decimales',
    icon: '1.5',
    description: 'Suma, resta, multiplica y divide con decimales',
    category: 'fractions-decimals',
  },
  {
    mode: 'conversions',
    label: 'Conversiones',
    icon: '🔄',
    description: 'Fracciones mixtas y conversiones fracción ↔ decimal',
    category: 'fractions-decimals',
  },
  {
    mode: 'mixed',
    label: 'Operaciones Mixtas',
    icon: '🔀',
    description: 'Expresiones con múltiples operaciones y orden de operaciones',
    category: 'fractions-decimals',
  },
  {
    mode: 'powers',
    label: 'Potencias y Raíces',
    icon: '²',
    description: 'Practica cuadrados, cubos y raíces cuadradas exactas',
    category: 'advanced',
  },
  {
    mode: 'percentages',
    label: 'Porcentajes',
    icon: '%',
    description: 'Porcentajes, descuentos, aumentos y proporcionalidad',
    category: 'advanced',
  },
  {
    mode: 'estimation',
    label: 'Estimación',
    icon: '≈',
    description: 'Elige la mejor aproximación para cada cálculo',
    category: 'advanced',
  },
  {
    mode: 'factorization',
    label: 'Factorización',
    icon: '🧩',
    description: 'Descompón números en factores primos',
    category: 'advanced',
  },
  {
    mode: 'number-theory',
    label: 'Teoría de Números',
    icon: '🔢',
    description: 'Factorización, MCD y MCM',
    category: 'advanced',
  },
  {
    mode: 'word-problems',
    label: 'Problemas Verbales',
    icon: '📝',
    description: 'Resuelve enunciados con contexto real',
    category: 'application',
  },
  {
    mode: 'comparison',
    label: 'Comparar y Ordenar',
    icon: '⚖️',
    description: 'Compara fracciones, decimales y ordena valores',
    category: 'application',
  },
  {
    mode: 'geometry',
    label: 'Geometría',
    icon: '📐',
    description: 'Perímetros, áreas y tipos de ángulos',
    category: 'application',
  },
  {
    mode: 'units',
    label: 'Unidades de Medida',
    icon: '📏',
    description: 'Conversiones de longitud, masa, capacidad y tiempo',
    category: 'application',
  },
  {
    mode: 'statistics',
    label: 'Estadística',
    icon: '📊',
    description: 'Calcula medias aritméticas',
    category: 'application',
  },
  {
    mode: 'rounding',
    label: 'Redondeo',
    icon: '🎯',
    description: 'Redondea números decimales',
    category: 'application',
  },
];

export const PRACTICE_MODE_CATEGORIES: Record<PracticeModeCategory, string> = {
  basic: 'Operaciones básicas',
  'fractions-decimals': 'Fracciones y decimales',
  advanced: '5.º avanzado',
  application: 'Aplicación y contexto',
};

export function getPracticeModesForGrade(grade: GradeId): PracticeModeConfig[] {
  const { availablePracticeModes } = getGradeConfig(grade);
  return PRACTICE_MODES.filter((mode) => availablePracticeModes.includes(mode.mode));
}

export function getPracticeModeConfig(mode: PracticeMode, grade?: GradeId): PracticeModeConfig {
  const configs = grade ? getPracticeModesForGrade(grade) : PRACTICE_MODES;
  return configs.find((config) => config.mode === mode) || PRACTICE_MODES[0];
}

export function groupPracticeModesByCategory(modes: PracticeModeConfig[]): Record<PracticeModeCategory, PracticeModeConfig[]> {
  const grouped: Record<PracticeModeCategory, PracticeModeConfig[]> = {
    basic: [],
    'fractions-decimals': [],
    advanced: [],
    application: [],
  };

  modes.forEach((mode) => {
    const category = mode.category ?? 'basic';
    grouped[category].push(mode);
  });

  return grouped;
}
