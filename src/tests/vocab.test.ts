/**
 * VocabManager tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { VocabManager } from '../modules/vocab';
import { SecureStorage } from '../utils/storage';
import { CONFIG } from '../config/constants';

function stubApiKey() {
  vi.spyOn(SecureStorage, 'getApiKey').mockReturnValue('gsk_testkey123');
}

function mockFetch(response: Partial<Response>) {
  const fn = vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', fn);
  return fn;
}

describe('VocabManager', () => {
  let vocab: VocabManager;

  beforeEach(() => {
    localStorage.clear();
    vocab = new VocabManager();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should load default vocabulary when storage is empty', () => {
      const list = vocab.getVocabList();
      expect(list).toEqual(CONFIG.DEFAULT_VOCAB);
    });

    it('should load saved vocabulary from storage', () => {
      SecureStorage.setJSON(CONFIG.STORAGE_KEYS.VOCAB, ['Custom', 'Words']);
      const v = new VocabManager();
      expect(v.getVocabList()).toEqual(['Custom', 'Words']);
    });

    it('should return a copy of the list, not the internal reference', () => {
      const list = vocab.getVocabList();
      list.push('Extra');
      expect(vocab.getVocabList()).toEqual(CONFIG.DEFAULT_VOCAB);
    });
  });

  describe('addWord', () => {
    it('should add a new word to the front of the list', () => {
      const result = vocab.addWord('NewWord');
      expect(result).toBe(true);
      expect(vocab.getVocabList()[0]).toBe('NewWord');
    });

    it('should persist the word to storage', () => {
      vocab.addWord('Persisted');
      const stored = SecureStorage.getJSON<string[]>(CONFIG.STORAGE_KEYS.VOCAB, []);
      expect(stored).toContain('Persisted');
    });

    it('should reject empty input', () => {
      const result = vocab.addWord('');
      expect(result).toBe(false);
    });

    it('should reject whitespace-only input', () => {
      const result = vocab.addWord('   ');
      expect(result).toBe(false);
    });

    it('should reject duplicate words', () => {
      vocab.addWord('Unique');
      const result = vocab.addWord('Unique');
      expect(result).toBe(false);
    });

    it('should trim and sanitize input', () => {
      vocab.addWord('  Hello World  ');
      expect(vocab.getVocabList()[0]).toBe('Hello World');
    });
  });

  describe('removeWord', () => {
    it('should remove an existing word', () => {
      vocab.addWord('ToRemove');
      vocab.removeWord('ToRemove');
      expect(vocab.getVocabList()).not.toContain('ToRemove');
    });

    it('should do nothing for a non-existent word', () => {
      const before = vocab.getVocabList().length;
      vocab.removeWord('NonExistent');
      expect(vocab.getVocabList().length).toBe(before);
    });

    it('should persist the removal to storage', () => {
      vocab.addWord('Temporary');
      vocab.removeWord('Temporary');
      const stored = SecureStorage.getJSON<string[]>(CONFIG.STORAGE_KEYS.VOCAB, []);
      expect(stored).not.toContain('Temporary');
    });
  });

  describe('getTranslation', () => {
    it('should return translation from API', async () => {
      stubApiKey();
      mockFetch({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Translation: Gato | Ex: The cat' } }],
        }),
      } as Response);

      const result = await vocab.getTranslation('Cat');
      expect(result).toBe('Translation: Gato | Ex: The cat');
    });

    it('should throw when API fails', async () => {
      stubApiKey();
      mockFetch({
        ok: false, status: 500,
        json: () => Promise.resolve({ error: { message: 'fail' } }),
      } as Response);

      await expect(vocab.getTranslation('Cat')).rejects.toThrow();
    });
  });

  describe('word count', () => {
    it('should start at 0', () => {
      expect(vocab.getWordCount()).toBe(0);
    });

    it('should increment word count', () => {
      vocab.incrementWordCount();
      expect(vocab.getWordCount()).toBe(1);
      vocab.incrementWordCount();
      expect(vocab.getWordCount()).toBe(2);
    });

    it('should persist count to storage', () => {
      vocab.incrementWordCount();
      const stored = SecureStorage.getNumber(CONFIG.STORAGE_KEYS.WORDS, 0);
      expect(stored).toBe(1);
    });
  });

  describe('reset', () => {
    it('should reset vocabulary to defaults', () => {
      vocab.addWord('Extra1');
      vocab.addWord('Extra2');
      vocab.reset();
      expect(vocab.getVocabList()).toEqual(CONFIG.DEFAULT_VOCAB);
    });

    it('should persist reset to storage', () => {
      vocab.addWord('Temp');
      vocab.reset();
      const stored = SecureStorage.getJSON<string[]>(CONFIG.STORAGE_KEYS.VOCAB, []);
      expect(stored).toEqual(CONFIG.DEFAULT_VOCAB);
    });
  });
});
