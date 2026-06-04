/**
 * Progress manager tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ProgressManager } from '../modules/progress';
import { SecureStorage } from '../utils/storage';
import { CONFIG } from '../config/constants';

describe('ProgressManager', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const manager = new ProgressManager();
      expect(manager.getXP()).toBe(0);
      expect(manager.getStreak()).toBe(0);
      expect(manager.getWords()).toBe(0);
    });

    it('should load saved values from storage', () => {
      SecureStorage.setNumber(CONFIG.STORAGE_KEYS.XP, 50);
      SecureStorage.setNumber(CONFIG.STORAGE_KEYS.STREAK, 5);
      SecureStorage.setNumber(CONFIG.STORAGE_KEYS.WORDS, 100);

      const manager = new ProgressManager();
      expect(manager.getXP()).toBe(50);
      expect(manager.getStreak()).toBe(5);
      expect(manager.getWords()).toBe(100);
    });
  });

  describe('day calculation', () => {
    it('should calculate day number correctly', () => {
      const manager = new ProgressManager();
      const dayNumber = manager.getDayNumber();
      expect(dayNumber).toBeGreaterThanOrEqual(1);
      expect(dayNumber).toBeLessThanOrEqual(CONFIG.TOTAL_DAYS);
    });
  });

  describe('task completion', () => {
    it('should mark task as done', () => {
      const manager = new ProgressManager();
      manager.markTaskDone('t1');
      expect(manager.isTaskDone('t1')).toBe(true);
    });

    it('should not mark same task twice', () => {
      const manager = new ProgressManager();
      manager.markTaskDone('t1');
      const initialXP = manager.getXP();
      manager.markTaskDone('t1');
      expect(manager.getXP()).toBe(initialXP);
    });

    it('should add XP when task is completed', () => {
      const manager = new ProgressManager();
      manager.markTaskDone('t1');
      expect(manager.getXP()).toBe(20);
    });
  });

  describe('reset', () => {
    it('should reset all progress', () => {
      const manager = new ProgressManager();
      manager.markTaskDone('t1');
      manager.incrementWords();
      manager.reset();

      expect(manager.getXP()).toBe(0);
      expect(manager.getStreak()).toBe(0);
      expect(manager.getWords()).toBe(0);
    });
  });
});
