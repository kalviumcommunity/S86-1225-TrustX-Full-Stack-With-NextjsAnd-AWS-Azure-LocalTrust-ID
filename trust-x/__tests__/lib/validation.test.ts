/**
 * Validation Schema Unit Tests
 * 
 * Tests for Zod validation schemas
 */

import {
  userRegistrationSchema,
  userLoginSchema,
  userUpdateSchema,
} from '../../src/lib/validation';

describe('Validation Schemas', () => {
  describe('userRegistrationSchema', () => {
    it('should validate correct user registration data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'StrongPass123',
        role: 'USER' as const,
      };

      const result = userRegistrationSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('john@example.com');
      }
    });

    it('should reject short names', () => {
      const invalidData = {
        name: 'J',
        email: 'john@example.com',
        password: 'StrongPass123',
      };

      const result = userRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2 characters');
      }
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'StrongPass123',
      };

      const result = userRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid email');
      }
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'short',              // Too short
        'nouppercase123',     // No uppercase
        'NOLOWERCASE123',     // No lowercase
        'NoNumbers',          // No numbers
      ];

      weakPasswords.forEach(password => {
        const invalidData = {
          name: 'John Doe',
          email: 'john@example.com',
          password,
        };

        const result = userRegistrationSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    it('should accept valid roles', () => {
      const roles = ['ADMIN', 'EDITOR', 'USER', 'VIEWER'] as const;

      roles.forEach(role => {
        const validData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'StrongPass123',
          role,
        };

        const result = userRegistrationSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    it('should sanitize input strings', () => {
      const dataWithHtml = {
        name: '<script>alert("xss")</script>John Doe',
        email: 'john@example.com',
        password: 'StrongPass123',
      };

      const result = userRegistrationSchema.safeParse(dataWithHtml);
      if (result.success) {
        expect(result.data.name).not.toContain('<script>');
      }
    });
  });

  describe('userLoginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'user@example.com',
        password: 'password123',
      };

      const result = userLoginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'password123',
      };

      const result = userLoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const invalidData = {
        email: 'user@example.com',
        password: '',
      };

      const result = userLoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required');
      }
    });

    it('should trim and lowercase email', () => {
      const data = {
        email: '  User@Example.COM  ',
        password: 'password123',
      };

      const result = userLoginSchema.safeParse(data);
      if (result.success) {
        expect(result.data.email).toBe('user@example.com');
      }
    });
  });

  describe('userUpdateSchema', () => {
    it('should validate partial updates', () => {
      const validData = {
        name: 'Jane Doe',
      };

      const result = userUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow empty object for no updates', () => {
      const result = userUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate email if provided', () => {
      const invalidData = {
        email: 'invalid-email',
      };

      const result = userUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate role if provided', () => {
      const validData = {
        role: 'EDITOR' as const,
      };

      const result = userUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
