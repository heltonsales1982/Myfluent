/**
 * Application constants
 */

export interface Language {
  value: string;
  label: string;
}

export const LANGUAGES: Language[] = [
  { value: 'English', label: 'Inglês' },
  { value: 'Spanish', label: 'Espanhol' },
  { value: 'French', label: 'Francês' },
  { value: 'Italian', label: 'Italiano' },
  { value: 'German', label: 'Alemão' },
  { value: 'Mandarin Chinese', label: 'Mandarim' },
  { value: 'Japanese', label: 'Japonês' },
];

export const LANGUAGE_LABELS: Record<string, string> = Object.fromEntries(
  LANGUAGES.map((l) => [l.value, l.label])
);

export const VALID_LANGUAGES = LANGUAGES.map((l) => l.value);

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
    'Well done',
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
    STREAK_DATE_PREFIX: 'mf_streak_',
  },
} as const;

export const TASK_IDS = ['t1', 't2', 't3', 't4'] as const;

export const TASK_POINTS: Record<string, number> = {
  t1: 20,
  t2: 20,
  t3: 15,
  t4: 15,
} as const;

export const TASK_BTN_DONE = '<i class="ti ti-check"></i> Concluído';
export const TASK_BTN_PENDING = '<i class="ti ti-check"></i> Marcar feito';

export const VALID_CHAT_MODES = ['casual', 'business', 'correct'] as const;

export const ERROR_MESSAGES: Record<string, string> = {
  NO_KEY: 'Configure sua chave Groq na aba Config.',
  INVALID_KEY: 'Chave Groq inválida. Verifique na aba Config.',
  DEFAULT: 'Erro de conexão. Verifique sua internet.',
};

export function getLanguageLabel(lang: string): string {
  return LANGUAGE_LABELS[lang] || lang;
}

export function getApiErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.DEFAULT;
}
