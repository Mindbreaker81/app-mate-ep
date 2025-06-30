import type { Achievement, Level } from '../types';

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

export const LEVELS = [
  { id: 1, minScore: 0, maxNumber: 10, maxNumberMult: 5, maxNumberDiv: 5, maxDenominator: 5, operations: ['addition', 'subtraction', 'multiplication', 'division', 'fraction-addition', 'fraction-subtraction'] },
  { id: 2, minScore: 10, maxNumber: 15, maxNumberMult: 7, maxNumberDiv: 7, maxDenominator: 6, operations: ['addition', 'subtraction', 'multiplication', 'division', 'fraction-addition', 'fraction-subtraction'] },
  { id: 3, minScore: 20, maxNumber: 20, maxNumberMult: 10, maxNumberDiv: 10, maxDenominator: 8, operations: ['addition', 'subtraction', 'multiplication', 'division', 'fraction-addition', 'fraction-subtraction'] },
  { id: 4, minScore: 35, maxNumber: 30, maxNumberMult: 12, maxNumberDiv: 12, maxDenominator: 10, operations: ['addition', 'subtraction', 'multiplication', 'division', 'fraction-addition', 'fraction-subtraction'] },
  { id: 5, minScore: 50, maxNumber: 50, maxNumberMult: 15, maxNumberDiv: 15, maxDenominator: 12, operations: ['addition', 'subtraction', 'multiplication', 'division', 'fraction-addition', 'fraction-subtraction'] },
  { id: 6, minScore: 70, maxNumber: 75, maxNumberMult: 20, maxNumberDiv: 20, maxDenominator: 15, operations: ['addition', 'subtraction', 'multiplication', 'division', 'fraction-addition', 'fraction-subtraction'] },
  { id: 7, minScore: 100, maxNumber: 100, maxNumberMult: 25, maxNumberDiv: 25, maxDenominator: 18, operations: ['addition', 'subtraction', 'multiplication', 'division', 'fraction-addition', 'fraction-subtraction'] },
  { id: 8, minScore: 130, maxNumber: 150, maxNumberMult: 30, maxNumberDiv: 30, maxDenominator: 20, operations: ['addition', 'subtraction', 'multiplication', 'division', 'fraction-addition', 'fraction-subtraction'] },
  { id: 9, minScore: 170, maxNumber: 200, maxNumberMult: 40, maxNumberDiv: 40, maxDenominator: 25, operations: ['addition', 'subtraction', 'multiplication', 'division', 'fraction-addition', 'fraction-subtraction'] },
  { id: 10, minScore: 220, maxNumber: 300, maxNumberMult: 50, maxNumberDiv: 50, maxDenominator: 30, operations: ['addition', 'subtraction', 'multiplication', 'division', 'fraction-addition', 'fraction-subtraction'] },
];

export function getDifficultyForLevel(level: number): 'easy' | 'medium' | 'hard' {
  switch (level) {
    case 1: return 'easy';
    case 2: return 'medium';
    case 3: return 'medium';
    case 4: return 'hard';
    default: return 'easy';
  }
} 