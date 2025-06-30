import type { TimeModeConfig } from '../types';

export const TIME_MODES: TimeModeConfig[] = [
  {
    mode: 'no-limit',
    label: 'Sin Límite',
    seconds: 0,
    description: 'Tómate tu tiempo para pensar'
  },
  {
    mode: '30s',
    label: '30 Segundos',
    seconds: 30,
    description: '¡Rápido! Tienes 30 segundos'
  },
  {
    mode: '1min',
    label: '1 Minuto',
    seconds: 60,
    description: 'Un minuto para resolver'
  },
  {
    mode: '2min',
    label: '2 Minutos',
    seconds: 120,
    description: 'Dos minutos de tiempo'
  }
];

export function getTimeModeConfig(mode: string): TimeModeConfig {
  return TIME_MODES.find(config => config.mode === mode) || TIME_MODES[0];
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
} 