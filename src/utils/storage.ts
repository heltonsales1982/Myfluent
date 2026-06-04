/**
 * Storage utilities with encryption for sensitive data
 */

import { CONFIG } from '../config/constants';

/**
 * Simple XOR encryption for API keys (not production-grade, but better than plaintext)
 * In production, use Web Crypto API or a proper encryption library
 */
function xorEncrypt(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
}

function xorDecrypt(encrypted: string, key: string): string {
  try {
    const text = atob(encrypted);
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch (error) {
    console.warn('Failed to decrypt stored API key — data may be corrupt:', error);
    return '';
  }
}

const ENCRYPTION_KEY = 'myfluent-secure-key-2024';

export class SecureStorage {
  /**
   * Get item from localStorage
   */
  static getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  /**
   * Set item in localStorage
   */
  static setItem(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      if (
        error instanceof DOMException &&
        (error.name === 'QuotaExceededError' || error.code === 22)
      ) {
        SecureStorage.onStorageFull?.();
      }
      return false;
    }
  }

  static onStorageFull: (() => void) | null = null;

  /**
   * Remove item from localStorage
   */
  static removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }

  /**
   * Get encrypted API key
   */
  static getApiKey(): string {
    const encrypted = this.getItem(CONFIG.STORAGE_KEYS.API_KEY);
    if (!encrypted) return '';
    return xorDecrypt(encrypted, ENCRYPTION_KEY);
  }

  /**
   * Set encrypted API key
   */
  static setApiKey(apiKey: string): void {
    const encrypted = xorEncrypt(apiKey, ENCRYPTION_KEY);
    this.setItem(CONFIG.STORAGE_KEYS.API_KEY, encrypted);
  }

  /**
   * Get number from localStorage with default
   */
  static getNumber(key: string, defaultValue: number): number {
    const value = this.getItem(key);
    if (value === null) return defaultValue;
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      console.warn(`Corrupt numeric value in localStorage key "${key}", using default`);
      return defaultValue;
    }
    return parsed;
  }

  /**
   * Set number in localStorage
   */
  static setNumber(key: string, value: number): void {
    this.setItem(key, value.toString());
  }

  /**
   * Get JSON from localStorage with default
   */
  static getJSON<T>(key: string, defaultValue: T): T {
    const value = this.getItem(key);
    if (!value) return defaultValue;
    try {
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Set JSON in localStorage
   */
  static setJSON<T>(key: string, value: T): void {
    this.setItem(key, JSON.stringify(value));
  }
}
