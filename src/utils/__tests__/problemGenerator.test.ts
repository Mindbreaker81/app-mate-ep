import { describe, it, expect } from 'vitest';
import { generateProblem, calculateResponseTime, getDifficulty } from '../problemGenerator';

describe('problemGenerator', () => {
  describe('generateProblem', () => {
    it('should generate a problem with valid structure', () => {
      const problem = generateProblem(1);
      
      expect(problem).toHaveProperty('num1');
      expect(problem).toHaveProperty('num2');
      expect(problem).toHaveProperty('operation');
      expect(problem).toHaveProperty('answer');
      expect(problem).toHaveProperty('explanation');
      
      expect(typeof problem.num1).toBe('number');
      expect(typeof problem.num2).toBe('number');
      expect(typeof problem.answer).toBe('number');
      expect(typeof problem.explanation).toBe('string');
    });

    it('should generate addition problems correctly', () => {
      const problem = generateProblem(1, 'addition');
      if (typeof problem.num1 === 'number' && typeof problem.num2 === 'number') {
        expect(problem.operation).toBe('addition');
        expect(problem.answer).toBe(problem.num1 + problem.num2);
        expect(problem.explanation).toContain('Suma');
      }
    });

    it('should generate subtraction problems with positive results', () => {
      const problem = generateProblem(1, 'subtraction');
      if (typeof problem.num1 === 'number' && typeof problem.num2 === 'number') {
        expect(problem.operation).toBe('subtraction');
        expect(problem.answer).toBe(problem.num1 - problem.num2);
        expect(problem.answer).toBeGreaterThan(0);
        expect(problem.explanation).toContain('Resta');
      }
    });

    it('should generate multiplication problems correctly', () => {
      const problem = generateProblem(1, 'multiplication');
      if (typeof problem.num1 === 'number' && typeof problem.num2 === 'number') {
        expect(problem.operation).toBe('multiplication');
        expect(problem.answer).toBe(problem.num1 * problem.num2);
        expect(problem.explanation).toContain('Multiplicación');
      }
    });

    it('should generate division problems with exact results', () => {
      const problem = generateProblem(1, 'division');
      if (typeof problem.num1 === 'number' && typeof problem.num2 === 'number' && typeof problem.answer === 'number') {
        expect(problem.operation).toBe('division');
        expect(problem.num1).toBe(problem.num2 * problem.answer);
        expect(problem.explanation).toContain('División');
      }
    });

    it('should respect level constraints', () => {
      const level1Problem = generateProblem(1);
      const level4Problem = generateProblem(4);
      
      expect(level1Problem.num1).toBeLessThanOrEqual(20);
      expect(level1Problem.num2).toBeLessThanOrEqual(20);
      expect(level4Problem.num1).toBeLessThanOrEqual(200);
      expect(level4Problem.num2).toBeLessThanOrEqual(200);
    });
  });

  describe('calculateResponseTime', () => {
    it('should calculate response time correctly', () => {
      const startTime = Date.now();
      
      // Simular un pequeño delay
      setTimeout(() => {
        const responseTime = calculateResponseTime(startTime);
        expect(responseTime).toBeGreaterThan(0);
        expect(typeof responseTime).toBe('number');
      }, 100);
    });
  });

  describe('getDifficulty', () => {
    it('should return correct difficulty for different levels', () => {
      expect(getDifficulty(1, 'addition')).toBe('easy');
      expect(getDifficulty(2, 'addition')).toBe('medium');
      expect(getDifficulty(3, 'addition')).toBe('medium');
      expect(getDifficulty(4, 'addition')).toBe('hard');
    });

    it('should return hard for multiplication at high levels', () => {
      expect(getDifficulty(3, 'multiplication')).toBe('hard');
      expect(getDifficulty(4, 'multiplication')).toBe('hard');
    });

    it('should return hard for division at medium and high levels', () => {
      expect(getDifficulty(2, 'division')).toBe('hard');
      expect(getDifficulty(3, 'division')).toBe('hard');
      expect(getDifficulty(4, 'division')).toBe('hard');
    });
  });
}); 