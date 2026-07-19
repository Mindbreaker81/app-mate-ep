import type { AttemptRecord, ChildOverview } from '../services/adminService';
import { formatGradeLabel, formatOperationLabel } from './operationLabels';

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

  const header = ['niño', 'curso', 'ejercicio', 'correcto', 'tiempo_s', 'fecha'].join(SEPARATOR);
  const rows = attempts.map((attempt) =>
    [
      escapeField(usernameById.get(attempt.userId) ?? attempt.userId),
      escapeField(formatGradeLabel(attempt.grade)),
      escapeField(formatOperationLabel(attempt.operation)),
      attempt.isCorrect ? 'sí' : 'no',
      String(attempt.timeSpent),
      attempt.createdAt,
    ].join(SEPARATOR),
  );

  return `${BOM}${[header, ...rows].join('\r\n')}\r\n`;
}
