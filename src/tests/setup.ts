/**
 * Vitest setup file
 */

import { afterEach } from 'vitest';

// Polyfill btoa/atob to handle binary strings correctly in jsdom
// jsdom's btoa rejects some valid Latin1 control characters
globalThis.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
globalThis.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Cleanup after each test
afterEach(() => {
  localStorageMock.clear();
});
