/**
 * API utilities with error handling
 */

import { CONFIG } from '../config/constants';
import { SecureStorage } from './storage';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GroqResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

export class APIError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Call Groq API with error handling
 */
export async function callGroqAPI(
  systemPrompt: string,
  messages: ChatMessage[]
): Promise<string> {
  const apiKey = SecureStorage.getApiKey();
  
  if (!apiKey) {
    throw new APIError('API key not configured', 'NO_KEY');
  }

  try {
    const response = await fetch(CONFIG.GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: CONFIG.GROQ_MODEL,
        max_tokens: CONFIG.MAX_TOKENS,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ]
      })
    });

    if (!response.ok) {
      const errorData: GroqResponse = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        throw new APIError('Invalid API key', 'INVALID_KEY', 401);
      }
      
      if (response.status === 429) {
        throw new APIError('Rate limit exceeded', 'RATE_LIMIT', 429);
      }
      
      const errorMessage = errorData.error?.message || 'API request failed';
      throw new APIError(errorMessage, 'API_ERROR', response.status);
    }

    const data: GroqResponse = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new APIError('Network error. Check your internet connection.', 'NETWORK_ERROR');
    }
    
    throw new APIError('Unexpected error occurred', 'UNKNOWN_ERROR');
  }
}

/**
 * Translate text using Groq API
 */
export async function translateText(text: string): Promise<string> {
  return callGroqAPI(
    'You are a concise translator. Translate the text to Portuguese (PT-BR) and provide a short usage example. Format: "Translation: X | Example: Y"',
    [{ role: 'user', content: `Translate to PT-BR and give a short usage example: "${text}". Format: Translation: X | Ex: Y` }]
  );
}
