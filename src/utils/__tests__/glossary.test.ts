import { describe, expect, it } from 'vitest';
import { MATH_GLOSSARY } from '../../data/mathGlossary';
import {
  getGlossaryTerm,
  glossaryTermsForOperation,
  normalizeGlossaryText,
  OPERATION_GLOSSARY_TERMS,
  searchGlossary,
} from '../glossary';
import { OPERATION_KEYS } from '../../types';

describe('catálogo del glosario', () => {
  it('tiene entre 30 y 40 términos', () => {
    expect(MATH_GLOSSARY.length).toBeGreaterThanOrEqual(30);
    expect(MATH_GLOSSARY.length).toBeLessThanOrEqual(40);
  });

  it('todos los términos tienen id, castellano, catalán, definición y ejemplo', () => {
    for (const term of MATH_GLOSSARY) {
      expect(term.id).toMatch(/^[a-z0-9-]+$/);
      expect(term.es.trim()).not.toBe('');
      expect(term.ca.trim()).not.toBe('');
      expect(term.definition.trim()).not.toBe('');
      expect(term.example.trim()).not.toBe('');
    }
  });

  it('los IDs son únicos', () => {
    const ids = MATH_GLOSSARY.map((term) => term.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('los términos relacionados apuntan a IDs existentes', () => {
    const ids = new Set(MATH_GLOSSARY.map((term) => term.id));
    for (const term of MATH_GLOSSARY) {
      for (const relatedId of term.related ?? []) {
        expect(ids.has(relatedId), `${term.id} → ${relatedId}`).toBe(true);
      }
    }
  });

  it('distingue los pares de conceptos que se confunden', () => {
    for (const id of ['media', 'mediana', 'circulo', 'circunferencia']) {
      expect(getGlossaryTerm(id)).not.toBeNull();
    }
    expect(getGlossaryTerm('media')?.ca).toBe('mitjana');
    expect(getGlossaryTerm('circulo')?.ca).toBe('cercle');
    expect(getGlossaryTerm('circunferencia')?.ca).toBe('circumferència');
  });
});

describe('normalizeGlossaryText', () => {
  it('quita tildes, diacríticos y mayúsculas', () => {
    expect(normalizeGlossaryText('Circumferència')).toBe('circumferencia');
    expect(normalizeGlossaryText('FRACCIÓN')).toBe('fraccion');
    expect(normalizeGlossaryText('seqüència')).toBe('sequencia');
    expect(normalizeGlossaryText('  Mitjana  ')).toBe('mitjana');
  });
});

describe('searchGlossary', () => {
  it('con la consulta vacía devuelve todo el glosario', () => {
    expect(searchGlossary('')).toHaveLength(MATH_GLOSSARY.length);
    expect(searchGlossary('   ')).toHaveLength(MATH_GLOSSARY.length);
  });

  it('encuentra por término catalán', () => {
    const results = searchGlossary('mitjana');
    expect(results.map((term) => term.id)).toContain('media');
  });

  it('encuentra por término castellano sin tildes', () => {
    const results = searchGlossary('circumferencia');
    expect(results.map((term) => term.id)).toContain('circunferencia');
  });

  it('encuentra variantes con acento en catalán', () => {
    const results = searchGlossary('circumferència');
    expect(results.map((term) => term.id)).toContain('circunferencia');
    expect(searchGlossary('PERÍMETRE').map((term) => term.id)).toContain('perimetro');
    expect(searchGlossary('arrel').map((term) => term.id)).toContain('raiz-cuadrada');
  });

  it('encuentra términos catalanes con «nombre» en lugar de «número»', () => {
    expect(searchGlossary('nombre enter').map((term) => term.id)).toContain('numero-entero');
    expect(searchGlossary('nombre primer').map((term) => term.id)).toContain('numero-primo');
  });

  it('devuelve vacío si no hay coincidencias', () => {
    expect(searchGlossary('xyzzy')).toHaveLength(0);
  });
});

describe('OPERATION_GLOSSARY_TERMS', () => {
  it('solo usa operaciones y términos existentes', () => {
    const ids = new Set(MATH_GLOSSARY.map((term) => term.id));
    const operations = new Set<string>(OPERATION_KEYS);
    for (const [operation, termIds] of Object.entries(OPERATION_GLOSSARY_TERMS)) {
      expect(operations.has(operation), `operación desconocida: ${operation}`).toBe(true);
      for (const termId of termIds) {
        expect(ids.has(termId), `${operation} → ${termId}`).toBe(true);
      }
    }
  });

  it('resuelve términos para operaciones enlazadas y devuelve vacío para el resto', () => {
    expect(glossaryTermsForOperation('mean').map((term) => term.id)).toContain('media');
    expect(glossaryTermsForOperation('median').map((term) => term.id)).toContain('mediana');
    expect(glossaryTermsForOperation('addition')).toHaveLength(0);
  });
});
