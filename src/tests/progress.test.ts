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

  describe('streak', () => {
    it('should increment streak when daily XP target is reached', () => {
      const manager = new ProgressManager();
      manager.markTaskDone('t1'); // 20
      manager.markTaskDone('t2'); // 20
      manager.markTaskDone('t3'); // 15
      manager.markTaskDone('t4'); // 15 → total 70
      expect(manager.getStreak()).toBe(1);
    });

    it('should not double-increment streak on the same day', () => {
      const manager = new ProgressManager();
      // Complete all tasks (total 70 XP)
      manager.markTaskDone('t1');
      manager.markTaskDone('t2');
      manager.markTaskDone('t3');
      manager.markTaskDone('t4');
      expect(manager.getStreak()).toBe(1);
      // Creating a new manager on same day should not add another streak
      const manager2 = new ProgressManager();
      expect(manager2.getStreak()).toBe(1);
    });
  });

  describe('XP percentage', () => {
    it('should return 0% when XP is 0', () => {
      const manager = new ProgressManager();
      expect(manager.getXPPercentage()).toBe(0);
    });

    it('should return 50% when XP is half of target', () => {
      SecureStorage.setNumber(CONFIG.STORAGE_KEYS.XP, 35);
      const manager = new ProgressManager();
      expect(manager.getXPPercentage()).toBe(50);
    });

    it('should return 100% when XP reaches target', () => {
      SecureStorage.setNumber(CONFIG.STORAGE_KEYS.XP, CONFIG.DAILY_XP_TARGET);
      const manager = new ProgressManager();
      expect(manager.getXPPercentage()).toBe(100);
    });
  });

  describe('word tracking', () => {
    it('should increment word count', () => {
      const manager = new ProgressManager();
      manager.incrementWords();
      expect(manager.getWords()).toBe(1);
      manager.incrementWords();
      expect(manager.getWords()).toBe(2);
    });

    it('should persist word count to storage', () => {
      const manager = new ProgressManager();
      manager.incrementWords();
      expect(SecureStorage.getNumber(CONFIG.STORAGE_KEYS.WORDS, 0)).toBe(1);
    });
  });

  describe('start date', () => {
    it('should return today as start date for new users', () => {
      const manager = new ProgressManager();
      const today = new Date().toISOString().split('T')[0];
      expect(manager.getStartDate()).toBe(today);
    });

    it('should load saved start date', () => {
      SecureStorage.setItem(CONFIG.STORAGE_KEYS.START_DATE, '2025-01-01');
      const manager = new ProgressManager();
      expect(manager.getStartDate()).toBe('2025-01-01');
    });
  });

  describe('task with unknown ID', () => {
    it('should award 0 XP for unknown task IDs', () => {
      const manager = new ProgressManager();
      manager.markTaskDone('unknown_task');
      expect(manager.getXP()).toBe(0);
      expect(manager.isTaskDone('unknown_task')).toBe(true);
    });
  });

  describe('XP cap', () => {
    it('should cap XP at daily target', () => {
      const manager = new ProgressManager();
      manager.markTaskDone('t1'); // 20
      manager.markTaskDone('t2'); // 20
      manager.markTaskDone('t3'); // 15
      manager.markTaskDone('t4'); // 15
      expect(manager.getXP()).toBe(CONFIG.DAILY_XP_TARGET);
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

    it('should set start date to today on reset', () => {
      SecureStorage.setItem(CONFIG.STORAGE_KEYS.START_DATE, '2020-01-01');
      const manager = new ProgressManager();
      manager.reset();
      const today = new Date().toISOString().split('T')[0];
      expect(manager.getStartDate()).toBe(today);
    });
  });
});
