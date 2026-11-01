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
    source: 'free',
  },
  {
    userId: 'uuid-desconocido',
    operation: 'addition',
    grade: '4t',
    isCorrect: false,
    timeSpent: 5,
    createdAt: '2026-07-18T11:00:00Z',
    source: 'free',
  },
  {
    userId: 'uuid-1',
    operation: 'two-step-equation',
    grade: '6e',
    isCorrect: true,
    timeSpent: 20,
    createdAt: '2026-07-18T12:00:00Z',
    source: 'daily-session',
  },
];

describe('attemptsToCsv', () => {
  it('genera CSV con BOM, separador ; y etiquetas humanas', () => {
    const csv = attemptsToCsv(attempts, children);
    const lines = csv.split('\r\n');

    expect(csv.startsWith('﻿')).toBe(true);
    expect(lines[0]).toBe('﻿niño;curso;tramo;procedencia;ejercicio;correcto;tiempo_s;fecha');
    expect(lines[1]).toBe(
      'nico;5.º de Primaria;Inicio del ciclo 5.º–6.º;Modo libre;Divisiones;sí;12;2026-07-18T10:00:00Z',
    );
  });

  it('distingue el curso elegido del tramo del contenido y la procedencia', () => {
    const csv = attemptsToCsv(attempts, children);
    const lines = csv.split('\r\n');

    // Curso elegido 4.º + operación T1 → repaso de 4.º (sin source → modo libre).
    expect(lines[2]).toContain('uuid-desconocido;4.º de Primaria;Repaso de 4.º;Modo libre');
    // Curso elegido 6.º + operación T3 → ampliación ESO, nunca «6.º».
    expect(lines[3]).toBe(
      'nico;6.º de Primaria;Ampliación ESO;Mi camino (sesión diaria);Ecuaciones de dos pasos;sí;20;2026-07-18T12:00:00Z',
    );
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
