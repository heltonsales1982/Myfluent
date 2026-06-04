/**
 * Progress module for tracking user learning progress
 */

import { SecureStorage } from '../utils/storage';
import { CONFIG, TASK_POINTS } from '../config/constants';

export class ProgressManager {
  private xp = 0;
  private streak = 0;
  private words = 0;
  private startDate: string;
  private doneTasks: string[] = [];

  /**
   * Initialize progress manager
   */
  constructor() {
    this.xp = SecureStorage.getNumber(CONFIG.STORAGE_KEYS.XP, 0);
    this.streak = SecureStorage.getNumber(CONFIG.STORAGE_KEYS.STREAK, 0);
    this.words = SecureStorage.getNumber(CONFIG.STORAGE_KEYS.WORDS, 0);
    this.startDate =
      SecureStorage.getItem(CONFIG.STORAGE_KEYS.START_DATE) ||
      new Date().toISOString().split('T')[0];
    this.doneTasks = this.loadTodayTasks();

    if (!SecureStorage.getItem(CONFIG.STORAGE_KEYS.START_DATE)) {
      SecureStorage.setItem(CONFIG.STORAGE_KEYS.START_DATE, this.startDate);
    }
  }

  /**
   * Get current XP
   */
  getXP(): number {
    return this.xp;
  }

  /**
   * Get current streak
   */
  getStreak(): number {
    return this.streak;
  }

  /**
   * Get word count
   */
  getWords(): number {
    return this.words;
  }

  /**
   * Get start date
   */
  getStartDate(): string {
    return this.startDate;
  }

  /**
   * Calculate current day number (1-180)
   */
  getDayNumber(): number {
    const d1 = new Date(this.startDate);
    const d2 = new Date();
    const days = Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1;
    return Math.max(1, Math.min(CONFIG.TOTAL_DAYS, days));
  }

  /**
   * Get today's date string
   */
  private getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Load today's completed tasks
   */
  private loadTodayTasks(): string[] {
    return SecureStorage.getJSON<string[]>(
      CONFIG.STORAGE_KEYS.DONE_TASKS_PREFIX + this.getToday(),
      []
    );
  }

  /**
   * Check if task is already done today
   */
  isTaskDone(taskId: string): boolean {
    return this.doneTasks.includes(taskId);
  }

  /**
   * Mark task as done
   */
  markTaskDone(taskId: string): void {
    if (this.doneTasks.includes(taskId)) {
      return;
    }

    const points = TASK_POINTS[taskId] || 0;
    this.doneTasks.push(taskId);

    // Save to storage
    SecureStorage.setJSON(CONFIG.STORAGE_KEYS.DONE_TASKS_PREFIX + this.getToday(), this.doneTasks);

    // Add XP
    this.xp = Math.min(CONFIG.DAILY_XP_TARGET, this.xp + points);
    SecureStorage.setNumber(CONFIG.STORAGE_KEYS.XP, this.xp);

    // Check if daily goal is complete
    if (this.xp >= CONFIG.DAILY_XP_TARGET) {
      this.incrementStreak();
    }
  }

  /**
   * Increment streak
   */
  private incrementStreak(): void {
    const today = this.getToday();
    const streakKey = CONFIG.STORAGE_KEYS.STREAK_DATE_PREFIX + today;

    if (!SecureStorage.getItem(streakKey)) {
      this.streak++;
      SecureStorage.setNumber(CONFIG.STORAGE_KEYS.STREAK, this.streak);
      SecureStorage.setItem(streakKey, '1');
    }
  }

  /**
   * Increment word count
   */
  incrementWords(): void {
    this.words++;
    SecureStorage.setNumber(CONFIG.STORAGE_KEYS.WORDS, this.words);
  }

  /**
   * Reset all progress
   */
  reset(): void {
    this.xp = 0;
    this.streak = 0;
    this.words = 0;
    this.doneTasks = [];
    this.startDate = this.getToday();

    SecureStorage.setNumber(CONFIG.STORAGE_KEYS.XP, 0);
    SecureStorage.setNumber(CONFIG.STORAGE_KEYS.STREAK, 0);
    SecureStorage.setNumber(CONFIG.STORAGE_KEYS.WORDS, 0);
    SecureStorage.setItem(CONFIG.STORAGE_KEYS.START_DATE, this.startDate);
  }

  /**
   * Get XP percentage
   */
  getXPPercentage(): number {
    return Math.round((this.xp / CONFIG.DAILY_XP_TARGET) * 100);
  }
}
