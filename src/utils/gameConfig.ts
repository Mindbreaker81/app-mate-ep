import type { Achievement, Level, Operation } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_correct',
    name: '¡Primer Acierto!',
    description: 'Resuelve tu primer ejercicio correctamente',
    icon: '🎯',
    unlocked: false,
    progress: 0,
    target: 1
  },
  {
    id: 'sum_master',
    name: 'Sumador Experto',
    description: 'Resuelve 10 sumas correctamente',
    icon: '➕',
    unlocked: false,
    progress: 0,
    target: 10
  },
  {
    id: 'sub_master',
    name: 'Rey de las Restas',
    description: 'Resuelve 10 restas correctamente',
    icon: '➖',
    unlocked: false,
    progress: 0,
    target: 10
  },
  {
    id: 'mul_master',
    name: 'Maestro de las Multiplicaciones',
    description: 'Resuelve 10 multiplicaciones correctamente',
    icon: '✖️',
    unlocked: false,
    progress: 0,
    target: 10
  },
  {
    id: 'div_master',
    name: 'Campeón de las Divisiones',
    description: 'Resuelve 10 divisiones correctamente',
    icon: '➗',
    unlocked: false,
    progress: 0,
    target: 10
  },
  {
    id: 'streak_5',
    name: '¡En Racha!',
    description: 'Resuelve 5 ejercicios seguidos correctamente',
    icon: '🔥',
    unlocked: false,
    progress: 0,
    target: 5
  },
  {
    id: 'streak_10',
    name: '¡Imparable!',
    description: 'Resuelve 10 ejercicios seguidos correctamente',
    icon: '⚡',
    unlocked: false,
    progress: 0,
    target: 10
  },
  {
    id: 'math_champion',
    name: 'Campeón de Matemáticas',
    description: 'Resuelve 50 ejercicios correctamente',
    icon: '🏆',
    unlocked: false,
    progress: 0,
    target: 50
  },
  {
    id: 'perfect_score',
    name: '¡Puntuación Perfecta!',
    description: 'Resuelve 20 ejercicios sin fallar ninguno',
    icon: '💎',
    unlocked: false,
    progress: 0,
    target: 20
  }
];

export const LEVELS: Level[] = [
  {
    id: 1,
    name: 'Nivel 1: Principiante',
    description: 'Sumas y restas simples',
    unlocked: true,
    operations: ['add', 'sub'],
    maxNumber: 20,
    requiredScore: 0
  },
  {
    id: 2,
    name: 'Nivel 2: Intermedio',
    description: 'Sumas, restas y multiplicaciones',
    unlocked: false,
    operations: ['add', 'sub', 'mul'],
    maxNumber: 50,
    requiredScore: 10
  },
  {
    id: 3,
    name: 'Nivel 3: Avanzado',
    description: 'Todas las operaciones',
    unlocked: false,
    operations: ['add', 'sub', 'mul', 'div'],
    maxNumber: 100,
    requiredScore: 25
  },
  {
    id: 4,
    name: 'Nivel 4: Experto',
    description: 'Operaciones complejas',
    unlocked: false,
    operations: ['add', 'sub', 'mul', 'div'],
    maxNumber: 200,
    requiredScore: 50
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