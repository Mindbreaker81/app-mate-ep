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

export const LEVELS: Level[] = [
  {
    id: 1,
    name: 'Nivel 1: Principiante',
    minScore: 0,
    operations: ['addition', 'subtraction'],
    maxNumber: 20,
    unlocked: true
  },
  {
    id: 2,
    name: 'Nivel 2: Intermedio',
    minScore: 10,
    operations: ['addition', 'subtraction', 'multiplication'],
    maxNumber: 50,
    unlocked: false
  },
  {
    id: 3,
    name: 'Nivel 3: Avanzado',
    minScore: 25,
    operations: ['addition', 'subtraction', 'multiplication', 'division'],
    maxNumber: 100,
    unlocked: false
  },
  {
    id: 4,
    name: 'Nivel 4: Experto',
    minScore: 50,
    operations: ['addition', 'subtraction', 'multiplication', 'division'],
    maxNumber: 200,
    unlocked: false
  }
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