import { PracticeModeConfig } from '../types';

export const PRACTICE_MODES: PracticeModeConfig[] = [
  {
    mode: 'all',
    label: 'Todas las Operaciones',
    icon: '🧮',
    description: 'Practica sumas, restas, multiplicaciones y divisiones'
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
  }
];

export function getPracticeModeConfig(mode: string): PracticeModeConfig {
  return PRACTICE_MODES.find(config => config.mode === mode) || PRACTICE_MODES[0];
} 