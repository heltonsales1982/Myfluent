/**
 * Validation utilities tests
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeHTML,
  validateApiKey,
  validateInput,
  isValidLanguage,
  isValidChatMode,
} from '../utils/validation';

describe('Validation Utilities', () => {
  describe('sanitizeHTML', () => {
    it('should sanitize HTML tags', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeHTML(input);
      expect(result).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
    });

    it('should handle normal text', () => {
      const input = 'Hello World';
      const result = sanitizeHTML(input);
      expect(result).toBe('Hello World');
    });
  });

  describe('validateApiKey', () => {
    it('should validate correct Groq API key format', () => {
      const validKey = 'gsk_1234567890abcdefghijklmnopqrstuvwxyz123456';
      expect(validateApiKey(validKey)).toBe(true);
    });

    it('should reject invalid API key format', () => {
      const invalidKey = 'invalid-key';
      expect(validateApiKey(invalidKey)).toBe(false);
    });
  });

  describe('validateInput', () => {
    it('should validate input within bounds', () => {
      expect(validateInput('test', 1, 100)).toBe(true);
    });

    it('should reject empty input', () => {
      expect(validateInput('', 1, 100)).toBe(false);
    });

    it('should reject input too short', () => {
      expect(validateInput('a', 5, 100)).toBe(false);
    });

    it('should reject input too long', () => {
      expect(validateInput('a'.repeat(101), 1, 100)).toBe(false);
    });
  });

  describe('isValidLanguage', () => {
    it('should accept valid languages', () => {
      expect(isValidLanguage('English')).toBe(true);
      expect(isValidLanguage('Spanish')).toBe(true);
    });

    it('should reject invalid languages', () => {
      expect(isValidLanguage('Invalid')).toBe(false);
    });
  });

  describe('isValidChatMode', () => {
    it('should accept valid chat modes', () => {
      expect(isValidChatMode('casual')).toBe(true);
      expect(isValidChatMode('business')).toBe(true);
      expect(isValidChatMode('correct')).toBe(true);
    });

    it('should reject invalid chat modes', () => {
      expect(isValidChatMode('invalid')).toBe(false);
    });
  });
});
