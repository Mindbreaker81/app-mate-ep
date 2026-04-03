import type { GradeId, PracticeMode, PracticeModeConfig } from '../types';
import { getGradeConfig } from './gameConfig';

export const PRACTICE_MODES: PracticeModeConfig[] = [
  {
    mode: 'all',
    label: 'Todas las Operaciones',
    icon: '🧮',
    description: 'Practica todas las operaciones disponibles para tu curso'
  },
  {
    mode: 'addition',
    label: 'Solo Sumas',
    icon: '➕',
    description: 'Enfócate en mejorar las sumas'
  },
  {
    mode: 'subtraction',
    label: 'Solo Restas',
    icon: '➖',
    description: 'Practica específicamente las restas'
  },
  {
    mode: 'multiplication',
    label: 'Solo Multiplicaciones',
    icon: '✖️',
    description: 'Mejora tus tablas de multiplicar'
  },
  {
    mode: 'division',
    label: 'Solo Divisiones',
    icon: '➗',
    description: 'Practica divisiones exactas'
  },
  {
    mode: 'fractions',
    label: 'Fracciones',
    icon: '½',
    description: 'Practica fracciones con suma, resta, multiplicación y división'
  },
  {
    mode: 'mixed',
    label: 'Operaciones Mixtas',
    icon: '🔀',
    description: 'Trabaja expresiones con múltiples operaciones y orden de operaciones'
  },
  {
    mode: 'decimals',
    label: 'Decimales',
    icon: '1.5',
    description: 'Suma, resta, multiplica y divide con decimales'
  },
  {
    mode: 'powers',
    label: 'Potencias',
    icon: '²',
    description: 'Practica cuadrados y cubos'
  },
  {
    mode: 'percentages',
    label: 'Porcentajes',
    icon: '%',
    description: 'Resuelve porcentajes y proporcionalidad directa'
  },
  {
    mode: 'estimation',
    label: 'Estimación',
    icon: '≈',
    description: 'Elige la mejor aproximación para cada cálculo'
  },
  {
    mode: 'factorization',
    label: 'Factorización',
    icon: '🧩',
    description: 'Descompón números en factores primos'
  }
];

export function getPracticeModesForGrade(grade: GradeId): PracticeModeConfig[] {
  const { availablePracticeModes } = getGradeConfig(grade);
  return PRACTICE_MODES.filter((mode) => availablePracticeModes.includes(mode.mode));
}

export function getPracticeModeConfig(mode: PracticeMode, grade?: GradeId): PracticeModeConfig {
  const configs = grade ? getPracticeModesForGrade(grade) : PRACTICE_MODES;
  return configs.find((config) => config.mode === mode) || PRACTICE_MODES[0];
} 