import type { Operation } from '../types';

/**
 * Catálogo de habilidades del camino de aprendizaje.
 *
 * El decreto organiza 5.º y 6.º como un ciclo; los tiers describen el recorrido
 * dentro del ciclo, NO cursos exactos:
 *  - T1: inicio del ciclo (5.º–6.º en conjunto).
 *  - T2: consolidación del ciclo (5.º–6.º en conjunto).
 *  - T3: ampliación hacia la ESO ("Ampliació ESO"), solo con prerrequisitos.
 */
export type SkillTier = 1 | 2 | 3;

export type SkillAreaId =
  | 'calculo'
  | 'numero'
  | 'fracciones'
  | 'aplicaciones'
  | 'medidas'
  | 'datos'
  | 'ampliacion';

export interface SkillArea {
  id: SkillAreaId;
  name: string;
  icon: string;
}

export interface Skill {
  id: string;
  name: string;
  areaId: SkillAreaId;
  tier: SkillTier;
  /** Operaciones del generador que entrenan esta habilidad (propiedad exclusiva). */
  operations: Operation[];
  /** Habilidades que deben estar dominadas antes de practicar esta. */
  prerequisites: string[];
  icon: string;
}

export const SKILL_AREAS: Record<SkillAreaId, SkillArea> = {
  calculo: { id: 'calculo', name: 'Cálculo y operaciones', icon: '🧮' },
  numero: { id: 'numero', name: 'Número y decimales', icon: '🔢' },
  fracciones: { id: 'fracciones', name: 'Fracciones y equivalencias', icon: '½' },
  aplicaciones: { id: 'aplicaciones', name: 'Porcentajes y problemas', icon: '🛒' },
  medidas: { id: 'medidas', name: 'Medidas y geometría', icon: '📐' },
  datos: { id: 'datos', name: 'Datos y azar', icon: '📊' },
  ampliacion: { id: 'ampliacion', name: 'Ampliación', icon: '🚀' },
};

export const TIER_LABELS: Record<SkillTier, string> = {
  1: 'Ciclo 5.º–6.º · inicio',
  2: 'Ciclo 5.º–6.º · consolidación',
  3: 'Ampliació ESO',
};

export const SKILLS: Skill[] = [
  // — Cálculo y operaciones —
  {
    id: 'sumas-restas',
    name: 'Sumas y restas',
    areaId: 'calculo',
    tier: 1,
    operations: ['addition', 'subtraction'],
    prerequisites: [],
    icon: '➕',
  },
  {
    id: 'multiplicacion-division',
    name: 'Multiplicación y división',
    areaId: 'calculo',
    tier: 1,
    operations: ['multiplication', 'division'],
    prerequisites: [],
    icon: '✖️',
  },
  {
    id: 'division-con-resto',
    name: 'Divisiones con resto',
    areaId: 'calculo',
    tier: 1,
    operations: ['division-remainder'],
    prerequisites: [],
    icon: '➗',
  },
  {
    id: 'operaciones-mixtas',
    name: 'Operaciones combinadas',
    areaId: 'calculo',
    tier: 1,
    operations: ['mixed'],
    prerequisites: [],
    icon: '🔀',
  },
  // — Número y decimales —
  {
    id: 'decimales',
    name: 'Decimales',
    areaId: 'numero',
    tier: 2,
    operations: ['decimal-addition', 'decimal-subtraction', 'decimal-multiplication', 'decimal-division'],
    prerequisites: ['multiplicacion-division'],
    icon: '🔟',
  },
  {
    id: 'estimacion-redondeo',
    name: 'Estimación y redondeo',
    areaId: 'numero',
    tier: 2,
    operations: ['estimation', 'round-decimal'],
    prerequisites: ['decimales'],
    icon: '≈',
  },
  {
    id: 'potencias-raices',
    name: 'Potencias y raíces',
    areaId: 'numero',
    tier: 2,
    operations: ['power', 'square-root'],
    prerequisites: ['multiplicacion-division'],
    icon: '²',
  },
  // — Fracciones y equivalencias —
  {
    id: 'fracciones-basicas',
    name: 'Fracciones: sumar y restar',
    areaId: 'fracciones',
    tier: 1,
    operations: ['fraction-addition', 'fraction-subtraction'],
    prerequisites: [],
    icon: '½',
  },
  {
    id: 'fracciones-avanzadas',
    name: 'Fracciones: multiplicar y dividir',
    areaId: 'fracciones',
    tier: 2,
    operations: ['fraction-multiplication', 'fraction-division', 'mixed-number-addition', 'mixed-number-subtraction', 'mixed-number-convert'],
    prerequisites: ['fracciones-basicas'],
    icon: '⅔',
  },
  {
    id: 'equivalencias',
    name: 'Fracción–decimal–porcentaje',
    areaId: 'fracciones',
    tier: 2,
    operations: [
      'fraction-to-decimal',
      'decimal-to-fraction',
      'fraction-percent',
      'compare-fractions',
      'compare-decimals',
      'compare-fraction-decimal',
      'order-values',
    ],
    prerequisites: ['fracciones-basicas', 'decimales'],
    icon: '🔁',
  },
  {
    id: 'valor-posicional',
    name: 'Valor posicional hasta milésimas',
    areaId: 'numero',
    tier: 2,
    operations: ['place-value'],
    prerequisites: ['decimales'],
    icon: '🔎',
  },
  {
    id: 'recta-decimales',
    name: 'La recta numérica: décimas y centésimas',
    areaId: 'numero',
    tier: 1,
    operations: ['number-line-decimal'],
    prerequisites: [],
    icon: '📏',
  },
  {
    id: 'secuencias',
    name: 'Secuencias',
    areaId: 'numero',
    tier: 2,
    operations: ['sequence'],
    prerequisites: ['multiplicacion-division'],
    icon: '🪜',
  },
  // — Porcentajes y problemas —
  {
    id: 'porcentajes',
    name: 'Porcentajes',
    areaId: 'aplicaciones',
    tier: 2,
    operations: ['percentage'],
    prerequisites: ['equivalencias'],
    icon: '%',
  },
  {
    id: 'problemas',
    name: 'Problemas verbales',
    areaId: 'aplicaciones',
    tier: 2,
    operations: ['word-problem'],
    prerequisites: ['multiplicacion-division'],
    icon: '🧩',
  },
  // — Medidas y geometría —
  {
    id: 'unidades',
    name: 'Unidades y conversiones',
    areaId: 'medidas',
    tier: 2,
    operations: ['unit-conversion'],
    prerequisites: ['multiplicacion-division'],
    icon: '⚖️',
  },
  {
    id: 'geometria-basica',
    name: 'Perímetros, áreas y ángulos',
    areaId: 'medidas',
    tier: 1,
    operations: ['perimeter-rectangle', 'perimeter-square', 'area-rectangle', 'area-triangle', 'angle-type'],
    prerequisites: [],
    icon: '📐',
  },
  {
    id: 'geometria-avanzada',
    name: 'Círculo, volumen y escalas',
    areaId: 'medidas',
    tier: 2,
    operations: ['circle-area', 'circle-circumference', 'volume-rectangular-prism', 'triangle-angle-sum', 'scale-conversion'],
    prerequisites: ['geometria-basica'],
    icon: '⭕',
  },
  // — Datos y azar —
  {
    id: 'estadistica',
    name: 'Media, mediana, moda y rango',
    areaId: 'datos',
    tier: 2,
    operations: ['mean', 'median', 'mode', 'range'],
    prerequisites: ['division-con-resto'],
    icon: '📊',
  },
  {
    id: 'probabilidad',
    name: 'Probabilidad',
    areaId: 'datos',
    tier: 2,
    operations: ['probability-simple', 'probability-compare'],
    prerequisites: ['fracciones-basicas'],
    icon: '🎲',
  },
  {
    id: 'teoria-numeros',
    name: 'Divisibilidad, MCD y MCM',
    areaId: 'numero',
    tier: 2,
    operations: ['factorization', 'gcd', 'lcm'],
    prerequisites: ['multiplicacion-division'],
    icon: '🧮',
  },
  // — Ciclo: enteros y ecuaciones sencillas —
  {
    id: 'enteros',
    name: 'Números enteros',
    areaId: 'calculo',
    tier: 2,
    operations: ['integer-addition', 'integer-subtraction', 'integer-multiplication', 'integer-division', 'integer-compare', 'integer-order'],
    prerequisites: ['operaciones-mixtas', 'decimales'],
    icon: '🌡️',
  },
  {
    id: 'recta-enteros',
    name: 'La recta numérica: enteros',
    areaId: 'calculo',
    tier: 2,
    operations: ['number-line-integer'],
    prerequisites: ['enteros'],
    icon: '📏',
  },
  {
    id: 'razones-proporciones',
    name: 'Razones y proporcionalidad',
    areaId: 'aplicaciones',
    tier: 2,
    operations: ['ratio', 'proportion', 'proportionality-check'],
    prerequisites: ['multiplicacion-division'],
    icon: '⚖️',
  },
  {
    id: 'finanzas',
    name: 'Finanzas: IVA, precios e interés',
    areaId: 'aplicaciones',
    tier: 2,
    operations: ['finance'],
    prerequisites: ['porcentajes'],
    icon: '🛒',
  },
  {
    id: 'ecuaciones',
    name: 'Ecuaciones sencillas',
    areaId: 'ampliacion',
    tier: 2,
    operations: ['simple-equation'],
    prerequisites: ['enteros'],
    icon: '𝑥',
  },
  // — Puente T3: Ampliació ESO (solo con prerrequisitos dominados) —
  {
    id: 'ecuaciones-dos-pasos',
    name: 'Ecuaciones de dos pasos',
    areaId: 'ampliacion',
    tier: 3,
    operations: ['two-step-equation'],
    prerequisites: ['ecuaciones', 'decimales'],
    icon: '🧗',
  },
  {
    id: 'proporcionalidad-inversa',
    name: 'Proporcionalidad inversa',
    areaId: 'ampliacion',
    tier: 3,
    operations: ['inverse-proportion'],
    prerequisites: ['razones-proporciones', 'division-con-resto'],
    icon: '🔄',
  },
  {
    id: 'potencias-eso',
    name: 'Potencias con cualquier exponente',
    areaId: 'ampliacion',
    tier: 3,
    operations: ['power-general'],
    prerequisites: ['potencias-raices'],
    icon: 'ⁿ',
  },
  {
    id: 'potencias-de-diez',
    name: 'Potencias de base 10',
    areaId: 'ampliacion',
    tier: 3,
    operations: ['power-of-ten'],
    prerequisites: ['potencias-raices'],
    icon: '🔟',
  },
];

export const SKILL_IDS = SKILLS.map((skill) => skill.id);

const SKILLS_BY_OPERATION = new Map<string, string>();
for (const skill of SKILLS) {
  for (const operation of skill.operations) {
    if (SKILLS_BY_OPERATION.has(operation)) {
      throw new Error(`Operación duplicada en el catálogo: ${operation}`);
    }
    SKILLS_BY_OPERATION.set(operation, skill.id);
  }
}

/** Habilidad propietaria de una operación (las operaciones pertenecen a una sola habilidad). */
export function skillIdForOperation(operation: Operation): string | null {
  return SKILLS_BY_OPERATION.get(operation) ?? null;
}

export function getSkillById(id: string): Skill | null {
  return SKILLS.find((skill) => skill.id === id) ?? null;
}

export function skillTierLabel(tier: SkillTier): string {
  return TIER_LABELS[tier];
}
