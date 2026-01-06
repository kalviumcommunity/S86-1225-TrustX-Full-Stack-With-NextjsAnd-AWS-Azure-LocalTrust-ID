/**
 * Utils Unit Tests
 * 
 * Tests for utility functions
 */

import {
  sum,
  multiply,
  formatCurrency,
  capitalize,
  isValidEmail,
  generateId,
  truncate,
} from '../../src/lib/utils';

describe('Utility Functions', () => {
  describe('sum', () => {
    it('should add two positive numbers', () => {
      expect(sum(2, 3)).toBe(5);
    });

    it('should add negative numbers', () => {
      expect(sum(-5, -3)).toBe(-8);
    });

    it('should handle zero', () => {
      expect(sum(5, 0)).toBe(5);
      expect(sum(0, 0)).toBe(0);
    });

    it('should handle decimals', () => {
      expect(sum(1.5, 2.5)).toBe(4);
    });
  });

  describe('multiply', () => {
    it('should multiply two positive numbers', () => {
      expect(multiply(4, 5)).toBe(20);
    });

    it('should handle zero', () => {
      expect(multiply(5, 0)).toBe(0);
    });

    it('should handle negative numbers', () => {
      expect(multiply(-3, 4)).toBe(-12);
      expect(multiply(-3, -4)).toBe(12);
    });
  });

  describe('formatCurrency', () => {
    it('should format whole numbers', () => {
      expect(formatCurrency(100)).toBe('$100.00');
    });

    it('should format decimals', () => {
      expect(formatCurrency(99.99)).toBe('$99.99');
    });

    it('should round to 2 decimal places', () => {
      expect(formatCurrency(99.999)).toBe('$100.00');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should handle negative amounts', () => {
      expect(formatCurrency(-50)).toBe('$-50.00');
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('should lowercase rest of string', () => {
      expect(capitalize('HELLO')).toBe('Hello');
      expect(capitalize('hELLO')).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(capitalize('')).toBe('');
    });

    it('should handle single character', () => {
      expect(capitalize('a')).toBe('A');
    });

    it('should handle already capitalized strings', () => {
      expect(capitalize('Hello')).toBe('Hello');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('john.doe@company.co.uk')).toBe(true);
      expect(isValidEmail('test+tag@domain.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user@domain')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });

    it('should reject emails with spaces', () => {
      expect(isValidEmail('user name@example.com')).toBe(false);
    });
  });

  describe('generateId', () => {
    it('should generate a string', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('should contain only alphanumeric characters', () => {
      const id = generateId();
      expect(id).toMatch(/^[a-z0-9]+$/);
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      const text = 'This is a very long string that needs truncation';
      expect(truncate(text, 10)).toBe('This is a ...');
    });

    it('should not truncate short strings', () => {
      const text = 'Short';
      expect(truncate(text, 10)).toBe('Short');
    });

    it('should handle exact length match', () => {
      const text = 'Exactly10!';
      expect(truncate(text, 10)).toBe('Exactly10!');
    });

    it('should handle empty strings', () => {
      expect(truncate('', 10)).toBe('');
    });

    it('should add ellipsis when truncated', () => {
      const result = truncate('Hello World', 5);
      expect(result).toContain('...');
      expect(result.length).toBeGreaterThan(5); // 5 chars + '...'
    });
  });
});
