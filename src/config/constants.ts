/**
 * Application constants
 */

export const CONFIG = {
  DAILY_XP_TARGET: 70,
  TOTAL_DAYS: 180,
  DEFAULT_LANGUAGE: 'English',
  DEFAULT_VOCAB: [
    'Hello',
    'Thank you',
    'Meeting',
    'Deadline',
    'Performance',
    'Dashboard',
    'I need help',
    'Good morning',
    'See you later',
    'Well done'
  ],
  GROQ_API_URL: 'https://api.groq.com/openai/v1/chat/completions',
  GROQ_MODEL: 'llama-3.3-70b-versatile',
  MAX_TOKENS: 500,
  STORAGE_KEYS: {
    XP: 'mf_xp',
    STREAK: 'mf_streak',
    WORDS: 'mf_words',
    START_DATE: 'mf_start',
    VOCAB: 'mf_vocab',
    API_KEY: 'mf_apikey',
    DEFAULT_LANG: 'mf_deflang',
    DONE_TASKS_PREFIX: 'mf_done_',
    STREAK_DATE_PREFIX: 'mf_streak_'
  }
} as const;

export const LANGUAGE_LABELS: Record<string, string> = {
  English: 'Inglês',
  Spanish: 'Espanhol',
  French: 'Francês',
  Italian: 'Italiano',
  German: 'Alemão',
  'Mandarin Chinese': 'Mandarim',
  Japanese: 'Japonês'
} as const;

export const TASK_POINTS: Record<string, number> = {
  t1: 20,
  t2: 20,
  t3: 15,
  t4: 15
} as const;
