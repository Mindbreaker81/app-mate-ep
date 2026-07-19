export const operationLabels = {
  addition: 'Sumas',
  subtraction: 'Restas',
  multiplication: 'Multiplicaciones',
  division: 'Divisiones',
  'fraction-addition': 'Fracciones (+)',
  'fraction-subtraction': 'Fracciones (-)',
  'fraction-multiplication': 'Fracciones (×)',
  'fraction-division': 'Fracciones (÷)',
  'decimal-addition': 'Decimales (+)',
  'decimal-subtraction': 'Decimales (-)',
  'decimal-multiplication': 'Decimales (×)',
  'decimal-division': 'Decimales (÷)',
  mixed: 'Operaciones mixtas',
  power: 'Potencias',
  percentage: 'Porcentajes',
  estimation: 'Estimación',
  factorization: 'Factorización',
} as const;

export function formatOperationLabel(operation: string): string {
  return operationLabels[operation as keyof typeof operationLabels] ?? operation;
}

export const gradeLabels: Record<string, string> = {
  '4t': '4.º de Primaria',
  '5e': '5.º de Primaria',
  '6e': '6.º de Primaria',
};

export function formatGradeLabel(grade: string): string {
  return gradeLabels[grade] ?? grade;
}
