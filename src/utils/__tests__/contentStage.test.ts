import { describe, expect, it } from 'vitest';
import {
  contentStageFor,
  contentStageForTier,
  contentStageLabel,
} from '../contentStage';
import { GRADE_CONFIGS } from '../gameConfig';

describe('contentStageFor', () => {
  it('etiqueta T3 como ampliación ESO aunque el curso elegido sea 5.º o 6.º', () => {
    expect(contentStageFor('6e', 'two-step-equation')).toBe('eso-extension');
    expect(contentStageFor('5e', 'inverse-proportion')).toBe('eso-extension');
    // También con curso elegido 4.º (la habilidad vino de «Mi camino»).
    expect(contentStageFor('4t', 'two-step-equation')).toBe('eso-extension');
  });

  it('etiqueta T1/T2 como contenido del ciclo 5.º–6.º, nunca de un curso', () => {
    expect(contentStageFor('5e', 'addition')).toBe('cycle-start');
    expect(contentStageFor('6e', 'addition')).toBe('cycle-start');
    expect(contentStageFor('5e', 'decimal-addition')).toBe('cycle-consolidation');
    expect(contentStageFor('6e', 'simple-equation')).toBe('cycle-consolidation');
  });

  it('con curso elegido 4.º las operaciones T1 son repaso de 4.º', () => {
    expect(contentStageFor('4t', 'addition')).toBe('review-4');
    expect(contentStageFor('4t', 'mixed')).toBe('review-4');
    // Una op T2/T3 con curso 4.º solo pudo venir de «Mi camino»: su tramo manda.
    expect(contentStageFor('4t', 'decimal-addition')).toBe('cycle-consolidation');
  });

  it('todo lo que genera el modo libre de 4.º es repaso de 4.º', () => {
    for (const operation of GRADE_CONFIGS['4t'].availableOperations) {
      expect(contentStageFor('4t', operation)).toBe('review-4');
    }
  });

  it('devuelve null para operaciones fuera del catálogo', () => {
    expect(contentStageFor('5e', 'operacion-historica')).toBeNull();
  });
});

describe('contentStageForTier', () => {
  it('mapea cada tier del catálogo a su tramo', () => {
    expect(contentStageForTier(1)).toBe('cycle-start');
    expect(contentStageForTier(2)).toBe('cycle-consolidation');
    expect(contentStageForTier(3)).toBe('eso-extension');
  });
});

describe('contentStageLabel', () => {
  it('usa etiquetas de ciclo, nunca «5.º» o «6.º» aislados', () => {
    expect(contentStageLabel('review-4')).toBe('Repaso de 4.º');
    expect(contentStageLabel('cycle-start')).toBe('Inicio del ciclo 5.º–6.º');
    expect(contentStageLabel('cycle-consolidation')).toBe('Consolidación del ciclo 5.º–6.º');
    expect(contentStageLabel('eso-extension')).toBe('Ampliación ESO');
    expect(contentStageLabel(null)).toBe('Sin clasificar');
  });
});
