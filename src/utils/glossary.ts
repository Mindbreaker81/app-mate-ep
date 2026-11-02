import { MATH_GLOSSARY, type GlossaryTerm } from '../data/mathGlossary';
import type { Operation } from '../types';

/**
 * Normaliza texto para la búsqueda del glosario: minúsculas, sin tildes ni
 * diacríticos (NFD + marcas combinantes) y sin espacios extremos.
 */
export function normalizeGlossaryText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function getGlossaryTerm(id: string): GlossaryTerm | null {
  return MATH_GLOSSARY.find((term) => term.id === id) ?? null;
}

/**
 * Filtra el glosario por término castellano, catalán y definición, sin
 * distinguir mayúsculas ni tildes. Devuelve las entradas en el orden editorial
 * del archivo de datos.
 */
export function searchGlossary(
  query: string,
  terms: readonly GlossaryTerm[] = MATH_GLOSSARY,
): GlossaryTerm[] {
  const needle = normalizeGlossaryText(query);
  if (needle === '') {
    return [...terms];
  }
  return terms.filter((term) =>
    [term.es, term.ca, term.definition].some((field) =>
      normalizeGlossaryText(field).includes(needle),
    ),
  );
}

/**
 * Términos del glosario que se enlazan desde la explicación de cada
 * operación. Son IDs explícitos: no se buscan palabras dentro del texto de la
 * explicación. Las operaciones sin entrada no muestran enlaces.
 */
export const OPERATION_GLOSSARY_TERMS: Partial<Record<Operation, string[]>> = {
  division: ['dividendo-divisor', 'cociente'],
  'division-remainder': ['cociente', 'resto'],
  factorization: ['descomposicion-factores', 'numero-primo'],
  gcd: ['mcd'],
  lcm: ['mcm'],
  'integer-addition': ['numero-entero'],
  'integer-subtraction': ['numero-entero'],
  'integer-multiplication': ['numero-entero'],
  'integer-division': ['numero-entero'],
  'integer-compare': ['numero-entero'],
  'integer-order': ['numero-entero'],
  'decimal-addition': ['numero-decimal'],
  'decimal-subtraction': ['numero-decimal'],
  'decimal-multiplication': ['numero-decimal'],
  'decimal-division': ['numero-decimal'],
  'compare-decimals': ['numero-decimal'],
  'place-value': ['valor-posicional'],
  'round-decimal': ['redondeo'],
  estimation: ['redondeo'],
  sequence: ['secuencia'],
  power: ['potencia', 'exponente'],
  'power-general': ['potencia', 'exponente'],
  'power-of-ten': ['potencia', 'exponente'],
  'square-root': ['raiz-cuadrada'],
  'fraction-addition': ['fraccion', 'numerador', 'denominador'],
  'fraction-subtraction': ['fraccion', 'numerador', 'denominador'],
  'fraction-multiplication': ['fraccion', 'numerador', 'denominador'],
  'fraction-division': ['fraccion', 'numerador', 'denominador'],
  'compare-fractions': ['fraccion', 'fraccion-equivalente'],
  'mixed-number-addition': ['numero-mixto', 'fraccion'],
  'mixed-number-subtraction': ['numero-mixto', 'fraccion'],
  'mixed-number-convert': ['numero-mixto', 'fraccion'],
  'fraction-to-decimal': ['fraccion-equivalente', 'numero-decimal'],
  'decimal-to-fraction': ['fraccion-equivalente', 'numero-decimal'],
  'compare-fraction-decimal': ['fraccion-equivalente', 'numero-decimal'],
  'order-values': ['fraccion-equivalente'],
  'fraction-percent': ['fraccion-equivalente', 'porcentaje'],
  percentage: ['porcentaje', 'fraccion-equivalente'],
  finance: ['porcentaje'],
  ratio: ['razon'],
  proportion: ['proporcionalidad', 'razon'],
  'proportionality-check': ['proporcionalidad'],
  'inverse-proportion': ['proporcionalidad-inversa'],
  'unit-conversion': ['conversion-unidades'],
  mean: ['media', 'mediana'],
  median: ['mediana', 'media'],
  mode: ['moda'],
  range: ['rango'],
  'probability-simple': ['probabilidad'],
  'probability-compare': ['probabilidad'],
  'perimeter-rectangle': ['perimetro'],
  'perimeter-square': ['perimetro'],
  'area-rectangle': ['area'],
  'area-triangle': ['area'],
  'volume-rectangular-prism': ['volumen'],
  'circle-area': ['circulo', 'area'],
  'circle-circumference': ['circunferencia', 'circulo'],
  'triangle-angle-sum': ['angulo'],
  'angle-type': ['angulo'],
  'simple-equation': ['ecuacion', 'incognita'],
  'two-step-equation': ['ecuacion', 'incognita'],
};

/**
 * Términos resueltos para una operación (se salta los IDs que no existan).
 * Devuelve [] si la operación no tiene enlaces.
 */
export function glossaryTermsForOperation(operation: Operation): GlossaryTerm[] {
  return (OPERATION_GLOSSARY_TERMS[operation] ?? [])
    .map((id) => getGlossaryTerm(id))
    .filter((term): term is GlossaryTerm => term !== null);
}
