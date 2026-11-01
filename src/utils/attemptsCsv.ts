import type { AttemptRecord, ChildOverview } from '../services/adminService';
import { formatGradeLabel, formatOperationLabel } from './operationLabels';
import { contentStageFor, contentStageLabel } from './contentStage';

const SEPARATOR = ';'; // Excel/LibreOffice en es-ES esperan punto y coma
const BOM = '﻿';

function escapeField(value: string): string {
  if (value.includes(SEPARATOR) || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** CSV de intentos para abrir en Excel/LibreOffice (BOM UTF-8, separador ;). */
export function attemptsToCsv(attempts: AttemptRecord[], children: ChildOverview[]): string {
  const usernameById = new Map(children.map((child) => [child.id, child.username]));

  // «curso» es el curso elegido (modo libre); «tramo» es el tramo del contenido,
  // derivado de la operación (T1/T2 ciclo 5.º–6.º, T3 ampliación ESO).
  const header = ['niño', 'curso', 'tramo', 'ejercicio', 'correcto', 'tiempo_s', 'fecha'].join(SEPARATOR);
  const rows = attempts.map((attempt) =>
    [
      escapeField(usernameById.get(attempt.userId) ?? attempt.userId),
      escapeField(formatGradeLabel(attempt.grade)),
      escapeField(contentStageLabel(contentStageFor(attempt.grade, attempt.operation))),
      escapeField(formatOperationLabel(attempt.operation)),
      attempt.isCorrect ? 'sí' : 'no',
      String(attempt.timeSpent),
      attempt.createdAt,
    ].join(SEPARATOR),
  );

  return `${BOM}${[header, ...rows].join('\r\n')}\r\n`;
}
