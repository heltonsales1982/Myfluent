/**
 * SecureStorage tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SecureStorage } from '../utils/storage';
import { CONFIG } from '../config/constants';

describe('SecureStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getItem / setItem', () => {
    it('should store and retrieve a value', () => {
      SecureStorage.setItem('key', 'value');
      expect(SecureStorage.getItem('key')).toBe('value');
    });

    it('should return null for missing keys', () => {
      expect(SecureStorage.getItem('nonexistent')).toBeNull();
    });

    it('should handle localStorage errors in getItem gracefully', () => {
      const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('quota exceeded');
      });
      expect(SecureStorage.getItem('key')).toBeNull();
      spy.mockRestore();
    });

    it('should handle localStorage errors in setItem gracefully', () => {
      const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota exceeded');
      });
      // Should not throw
      SecureStorage.setItem('key', 'value');
      spy.mockRestore();
    });
  });

  describe('removeItem', () => {
    it('should remove an item from storage', () => {
      SecureStorage.setItem('key', 'value');
      SecureStorage.removeItem('key');
      expect(SecureStorage.getItem('key')).toBeNull();
    });

    it('should handle localStorage errors in removeItem gracefully', () => {
      const spy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('error');
      });
      // Should not throw
      SecureStorage.removeItem('key');
      spy.mockRestore();
    });
  });

  describe('API key encryption', () => {
    it('should encrypt and decrypt API key correctly', () => {
      const apiKey = 'gsk_test1234567890abcdef';
      SecureStorage.setApiKey(apiKey);
      expect(SecureStorage.getApiKey()).toBe(apiKey);
    });

    it('should return empty string when no API key is stored', () => {
      expect(SecureStorage.getApiKey()).toBe('');
    });

    it('should not store the key in plaintext', () => {
      const apiKey = 'gsk_test1234567890abcdef';
      SecureStorage.setApiKey(apiKey);
      const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.API_KEY);
      expect(raw).not.toBe(apiKey);
      expect(raw).not.toBeNull();
    });
  });

  describe('getNumber / setNumber', () => {
    it('should store and retrieve a number', () => {
      SecureStorage.setNumber('count', 42);
      expect(SecureStorage.getNumber('count', 0)).toBe(42);
    });

    it('should return default when key does not exist', () => {
      expect(SecureStorage.getNumber('missing', 99)).toBe(99);
    });
  });

  describe('getJSON / setJSON', () => {
    it('should store and retrieve a JSON object', () => {
      const data = { name: 'test', items: [1, 2, 3] };
      SecureStorage.setJSON('data', data);
      expect(SecureStorage.getJSON('data', {})).toEqual(data);
    });

    it('should store and retrieve a JSON array', () => {
      const list = ['apple', 'banana'];
      SecureStorage.setJSON('list', list);
      expect(SecureStorage.getJSON<string[]>('list', [])).toEqual(list);
    });

    it('should return default for missing key', () => {
      expect(SecureStorage.getJSON('missing', [1, 2])).toEqual([1, 2]);
    });

    it('should return default for invalid JSON', () => {
      localStorage.setItem('bad', 'not{json');
      expect(SecureStorage.getJSON('bad', 'fallback')).toBe('fallback');
    });
  });
});
