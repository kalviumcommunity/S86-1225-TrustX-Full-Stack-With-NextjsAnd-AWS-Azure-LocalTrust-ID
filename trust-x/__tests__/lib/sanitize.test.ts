/**
 * Sanitization Unit Tests
 * 
 * Tests for input sanitization utilities
 */

import { 
  sanitizeStrict, 
  sanitizeBasic, 
  sanitizeRichText,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeFilename
} from '../../src/lib/sanitize';

describe('Sanitization', () => {
  describe('sanitizeStrict', () => {
    it('should remove all HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeStrict(input);
      expect(result).toBe('Hello');
    });

    it('should remove HTML entities', () => {
      const input = 'Hello &lt;world&gt;';
      const result = sanitizeStrict(input);
      expect(result).not.toContain('&lt;');
      expect(result).not.toContain('&gt;');
    });

    it('should handle empty strings', () => {
      expect(sanitizeStrict('')).toBe('');
    });

    it('should handle plain text', () => {
      const input = 'Hello World';
      expect(sanitizeStrict(input)).toBe('Hello World');
    });

    it('should remove javascript: protocol', () => {
      const input = '<a href="javascript:alert(1)">Click</a>';
      const result = sanitizeStrict(input);
      expect(result).not.toContain('javascript:');
    });
  });

  describe('sanitizeBasic', () => {
    it('should allow basic formatting tags', () => {
      const input = '<p>Hello <strong>World</strong></p>';
      const result = sanitizeBasic(input);
      expect(result).toContain('<strong>');
      expect(result).toContain('</strong>');
    });

    it('should remove script tags', () => {
      const input = '<p>Hello</p><script>alert("xss")</script>';
      const result = sanitizeBasic(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    it('should allow safe links', () => {
      const input = '<a href="https://example.com">Link</a>';
      const result = sanitizeBasic(input);
      expect(result).toContain('href="https://example.com"');
    });

    it('should remove dangerous event handlers', () => {
      const input = '<a href="#" onclick="alert(1)">Click</a>';
      const result = sanitizeBasic(input);
      expect(result).not.toContain('onclick');
    });
  });

  describe('sanitizeRichText', () => {
    it('should allow rich text formatting', () => {
      const input = '<h1>Title</h1><p>Content</p><ul><li>Item</li></ul>';
      const result = sanitizeRichText(input);
      expect(result).toContain('<h1>');
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>');
    });

    it('should allow images with safe sources', () => {
      const input = '<img src="https://example.com/image.jpg" alt="Test">';
      const result = sanitizeRichText(input);
      expect(result).toContain('<img');
      expect(result).toContain('src="https://example.com/image.jpg"');
    });

    it('should remove script tags from rich text', () => {
      const input = '<h1>Title</h1><script>alert("xss")</script>';
      const result = sanitizeRichText(input);
      expect(result).not.toContain('<script>');
    });
  });

  describe('sanitizeEmail', () => {
    it('should preserve valid email addresses', () => {
      const email = 'user@example.com';
      expect(sanitizeEmail(email)).toBe(email);
    });

    it('should convert to lowercase', () => {
      const email = 'User@Example.COM';
      expect(sanitizeEmail(email)).toBe('user@example.com');
    });

    it('should trim whitespace', () => {
      const email = '  user@example.com  ';
      expect(sanitizeEmail(email)).toBe('user@example.com');
    });

    it('should remove HTML tags', () => {
      const email = '<script>alert(1)</script>user@example.com';
      const result = sanitizeEmail(email);
      expect(result).not.toContain('<script>');
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow http and https URLs', () => {
      const url = 'https://example.com/page';
      expect(sanitizeUrl(url)).toBe(url);
    });

    it('should remove javascript: protocol', () => {
      const url = 'javascript:alert(1)';
      const result = sanitizeUrl(url);
      expect(result).toBe('about:blank');
    });

    it('should remove data: protocol with scripts', () => {
      const url = 'data:text/html,<script>alert(1)</script>';
      const result = sanitizeUrl(url);
      expect(result).toBe('about:blank');
    });

    it('should handle relative URLs', () => {
      const url = '/path/to/page';
      expect(sanitizeUrl(url)).toBe(url);
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove path traversal attempts', () => {
      const filename = '../../../etc/passwd';
      const result = sanitizeFilename(filename);
      expect(result).not.toContain('..');
      expect(result).not.toContain('/');
    });

    it('should preserve valid filenames', () => {
      const filename = 'document.pdf';
      expect(sanitizeFilename(filename)).toBe(filename);
    });

    it('should remove special characters', () => {
      const filename = 'file<>name?.pdf';
      const result = sanitizeFilename(filename);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain('?');
    });

    it('should handle multiple extensions', () => {
      const filename = 'document.tar.gz';
      const result = sanitizeFilename(filename);
      expect(result).toContain('.tar.gz');
    });
  });
});
