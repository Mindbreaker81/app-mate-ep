import { describe, expect, it } from 'vitest';
import { attemptsToCsv } from '../attemptsCsv';
import type { AttemptRecord, ChildOverview } from '../../services/adminService';

const children: ChildOverview[] = [
  {
    id: 'uuid-1',
    username: 'nico',
    avatar: '🦊',
    createdAt: '2026-01-01T00:00:00Z',
    totalAttempts: 2,
    correctAttempts: 1,
    lastActivity: null,
  },
];

const attempts: AttemptRecord[] = [
  {
    userId: 'uuid-1',
    operation: 'division',
    grade: '5e',
    isCorrect: true,
    timeSpent: 12,
    createdAt: '2026-07-18T10:00:00Z',
  },
  {
    userId: 'uuid-desconocido',
    operation: 'addition',
    grade: '4t',
    isCorrect: false,
    timeSpent: 5,
    createdAt: '2026-07-18T11:00:00Z',
  },
];

describe('attemptsToCsv', () => {
  it('genera CSV con BOM, separador ; y etiquetas humanas', () => {
    const csv = attemptsToCsv(attempts, children);
    const lines = csv.split('\r\n');

    expect(csv.startsWith('﻿')).toBe(true);
    expect(lines[0]).toBe('﻿niño;curso;ejercicio;correcto;tiempo_s;fecha');
    expect(lines[1]).toBe('nico;5.º de Primaria;Divisiones;sí;12;2026-07-18T10:00:00Z');
  });

  it('usa el id cuando no encuentra el username', () => {
    const csv = attemptsToCsv(attempts, children);

    expect(csv).toContain('uuid-desconocido;4.º de Primaria');
    expect(csv).toContain(';no;5;');
  });

  it('entrecomilla campos con separador o comillas', () => {
    const weird: ChildOverview[] = [{ ...children[0], username: 'ni;co "el rápido"' }];
    const csv = attemptsToCsv([attempts[0]], weird);

    expect(csv).toContain('"ni;co ""el rápido"""');
  });

  it('lista vacía produce solo la cabecera', () => {
    expect(attemptsToCsv([], children).trim().endsWith('fecha')).toBe(true);
  });
});
