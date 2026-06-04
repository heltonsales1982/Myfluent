/**
 * Input validation and XSS sanitization utilities
 */

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHTML(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Validate API key format (basic validation for Groq keys)
 */
export function validateApiKey(apiKey: string): boolean {
  // Groq API keys start with 'gsk_'
  return /^gsk_[a-zA-Z0-9]{32,}$/.test(apiKey);
}

/**
 * Validate that input is not empty and has reasonable length
 */
export function validateInput(input: string, minLength: number = 1, maxLength: number = 1000): boolean {
  const trimmed = input.trim();
  return trimmed.length >= minLength && trimmed.length <= maxLength;
}

/**
 * Escape special characters for regex
 */
export function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validate language code
 */
export function isValidLanguage(lang: string): boolean {
  const validLanguages = ['English', 'Spanish', 'French', 'Italian', 'German', 'Mandarin Chinese', 'Japanese'];
  return validLanguages.includes(lang);
}

/**
 * Validate chat mode
 */
export function isValidChatMode(mode: string): boolean {
  const validModes = ['casual', 'business', 'correct'];
  return validModes.includes(mode);
}
