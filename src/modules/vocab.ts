/**
 * Vocabulary module for flashcard functionality
 */

import { SecureStorage } from '../utils/storage';
import { translateText } from '../utils/api';
import { validateInput, sanitizeHTML } from '../utils/validation';
import { CONFIG } from '../config/constants';

export interface VocabCard {
  word: string;
  translation?: string;
  loaded: boolean;
}

export class VocabManager {
  private vocabList: string[] = [];

  /**
   * Initialize vocab manager
   */
  constructor() {
    this.vocabList = SecureStorage.getJSON<string[]>(
      CONFIG.STORAGE_KEYS.VOCAB,
      [...CONFIG.DEFAULT_VOCAB]
    );
  }

  /**
   * Get all vocabulary words
   */
  getVocabList(): string[] {
    return [...this.vocabList];
  }

  /**
   * Add a new word to vocabulary
   */
  addWord(word: string): boolean {
    const sanitized = sanitizeHTML(word.trim());
    
    if (!validateInput(sanitized, 1, 100)) {
      return false;
    }

    if (this.vocabList.includes(sanitized)) {
      return false;
    }

    this.vocabList.unshift(sanitized);
    this.save();
    return true;
  }

  /**
   * Remove a word from vocabulary
   */
  removeWord(word: string): void {
    const index = this.vocabList.indexOf(word);
    if (index > -1) {
      this.vocabList.splice(index, 1);
      this.save();
    }
  }

  /**
   * Get translation for a word
   */
  async getTranslation(word: string): Promise<string> {
    try {
      const translation = await translateText(word);
      return translation;
    } catch (error) {
      console.error('Error getting translation:', error);
      throw error;
    }
  }

  /**
   * Increment word count
   */
  incrementWordCount(): void {
    const current = SecureStorage.getNumber(CONFIG.STORAGE_KEYS.WORDS, 0);
    SecureStorage.setNumber(CONFIG.STORAGE_KEYS.WORDS, current + 1);
  }

  /**
   * Get current word count
   */
  getWordCount(): number {
    return SecureStorage.getNumber(CONFIG.STORAGE_KEYS.WORDS, 0);
  }

  /**
   * Save vocabulary to storage
   */
  private save(): void {
    SecureStorage.setJSON(CONFIG.STORAGE_KEYS.VOCAB, this.vocabList);
  }

  /**
   * Reset vocabulary to default
   */
  reset(): void {
    this.vocabList = [...CONFIG.DEFAULT_VOCAB];
    this.save();
  }
}
