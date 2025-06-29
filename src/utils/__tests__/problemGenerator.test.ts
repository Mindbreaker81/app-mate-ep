import { describe, it, expect } from 'vitest';
import { generateProblem, getRandomOperation } from '../problemGenerator';
import type { Operation } from '../../types';

describe('problemGenerator', () => {
  describe('generateProblem', () => {
    it('should generate addition problems correctly', () => {
      const problem = generateProblem('add');
      
      expect(problem.operation).toBe('add');
      expect(problem.question).toMatch(/\d+ \+ \d+ = \?/);
      expect(typeof problem.answer).toBe('number');
      expect(problem.steps).toHaveLength(7);
      expect(problem.steps[0]).toContain('Paso 1: Escribe');
    });

    it('should generate subtraction problems correctly', () => {
      const problem = generateProblem('sub');
      
      expect(problem.operation).toBe('sub');
      expect(problem.question).toMatch(/\d+ - \d+ = \?/);
      expect(typeof problem.answer).toBe('number');
      expect(problem.answer).toBeGreaterThan(0);
      expect(problem.steps).toHaveLength(7);
    });

    it('should generate multiplication problems correctly', () => {
      const problem = generateProblem('mul');
      
      expect(problem.operation).toBe('mul');
      expect(problem.question).toMatch(/\d+ × \d+ = \?/);
      expect(typeof problem.answer).toBe('number');
      expect(problem.answer).toBeGreaterThan(0);
      expect(problem.steps).toHaveLength(4);
    });

    it('should generate division problems correctly', () => {
      const problem = generateProblem('div');
      
      expect(problem.operation).toBe('div');
      expect(problem.question).toMatch(/\d+ ÷ \d+ = \?/);
      expect(typeof problem.answer).toBe('number');
      expect(problem.answer).toBeGreaterThan(0);
      expect(problem.steps).toHaveLength(4);
      
      // Verificar que la división es exacta
      const numbers = problem.question.match(/\d+/g);
      if (numbers) {
        const dividend = parseInt(numbers[0]);
        const divisor = parseInt(numbers[1]);
        expect(dividend % divisor).toBe(0);
        expect(dividend / divisor).toBe(problem.answer);
      }
    });

    it('should throw error for invalid operation', () => {
      expect(() => {
        generateProblem('invalid' as Operation);
      }).toThrow('Operación no válida: invalid');
    });
  });

  describe('getRandomOperation', () => {
    it('should return a valid operation', () => {
      const operation = getRandomOperation();
      expect(['add', 'sub', 'mul', 'div']).toContain(operation);
    });

    it('should return different operations on multiple calls', () => {
      const operations = new Set();
      for (let i = 0; i < 10; i++) {
        operations.add(getRandomOperation());
      }
      // Debería generar al menos 2 operaciones diferentes
      expect(operations.size).toBeGreaterThan(1);
    });
  });
}); 