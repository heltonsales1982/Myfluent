/**
 * Chat module for AI conversation functionality
 */

import { callGroqAPI, ChatMessage } from '../utils/api';
import { sanitizeHTML } from '../utils/validation';
import { LANGUAGE_LABELS } from '../config/constants';

export type ChatMode = 'casual' | 'business' | 'correct';

export class ChatManager {
  private currentMode: ChatMode = 'casual';
  private messages: ChatMessage[] = [];

  /**
   * Set chat mode
   */
  setMode(mode: ChatMode): void {
    this.currentMode = mode;
  }

  /**
   * Get current mode
   */
  getMode(): ChatMode {
    return this.currentMode;
  }

  /**
   * Get system prompt based on mode and language
   */
  private getSystemPrompt(language: string): string {
    const modePrompts: Record<ChatMode, string> = {
      casual: `Converse de forma casual e amigável. Responda SEMPRE em ${language} (com tradução PT-BR ao final entre parênteses). Corrija erros integrando a forma correta naturalmente na conversa.`,
      business: `Simule uma reunião corporativa de TI. Responda em ${language} (com tradução PT-BR). Use vocabulário executivo e profissional.`,
      correct: `Primeiro identifique erros gramaticais do usuário e mostre a correção de forma breve. Depois responda naturalmente em ${language} com tradução PT-BR.`,
    };

    return `Você é um tutor de idiomas especialista nativo em ${language}. ${modePrompts[this.currentMode]} Seja conciso (máx 3 frases). Nunca quebre o fluxo com explicações longas.`;
  }

  /**
   * Add message to history
   */
  addMessage(role: 'user' | 'assistant', content: string): void {
    this.messages.push({ role, content: sanitizeHTML(content) });
  }

  /**
   * Get message history
   */
  getMessages(): ChatMessage[] {
    return this.messages;
  }

  /**
   * Clear message history
   */
  clearMessages(): void {
    this.messages = [];
  }

  /**
   * Send message to AI and get response
   */
  async sendMessage(userMessage: string, language: string): Promise<string> {
    const sanitizedMessage = sanitizeHTML(userMessage);
    this.addMessage('user', sanitizedMessage);

    const systemPrompt = this.getSystemPrompt(language);
    const response = await callGroqAPI(systemPrompt, this.messages);

    this.addMessage('assistant', response);
    return response;
  }

  /**
   * Get language label
   */
  static getLanguageLabel(language: string): string {
    return LANGUAGE_LABELS[language] || language;
  }
}
