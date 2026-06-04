/**
 * ChatManager tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ChatManager } from '../modules/chat';
import { SecureStorage } from '../utils/storage';

function stubApiKey() {
  vi.spyOn(SecureStorage, 'getApiKey').mockReturnValue('gsk_testkey123');
}

function mockFetch(response: Partial<Response>) {
  const fn = vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', fn);
  return fn;
}

describe('ChatManager', () => {
  let chat: ChatManager;

  beforeEach(() => {
    localStorage.clear();
    chat = new ChatManager();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('mode management', () => {
    it('should default to casual mode', () => {
      expect(chat.getMode()).toBe('casual');
    });

    it('should switch to business mode', () => {
      chat.setMode('business');
      expect(chat.getMode()).toBe('business');
    });

    it('should switch to correct mode', () => {
      chat.setMode('correct');
      expect(chat.getMode()).toBe('correct');
    });
  });

  describe('message history', () => {
    it('should start with empty messages', () => {
      expect(chat.getMessages()).toEqual([]);
    });

    it('should add user messages', () => {
      chat.addMessage('user', 'Hello');
      const msgs = chat.getMessages();
      expect(msgs).toHaveLength(1);
      expect(msgs[0].role).toBe('user');
      expect(msgs[0].content).toBe('Hello');
    });

    it('should add assistant messages', () => {
      chat.addMessage('assistant', 'Hi there');
      const msgs = chat.getMessages();
      expect(msgs).toHaveLength(1);
      expect(msgs[0].role).toBe('assistant');
    });

    it('should sanitize HTML in messages', () => {
      chat.addMessage('user', '<script>alert("xss")</script>');
      const msgs = chat.getMessages();
      expect(msgs[0].content).not.toContain('<script>');
    });

    it('should clear messages', () => {
      chat.addMessage('user', 'Hello');
      chat.addMessage('assistant', 'Hi');
      chat.clearMessages();
      expect(chat.getMessages()).toEqual([]);
    });
  });

  describe('sendMessage', () => {
    it('should send a message and return AI response', async () => {
      stubApiKey();
      mockFetch({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: 'AI response' } }] }),
      } as Response);

      const response = await chat.sendMessage('Hello', 'English');
      expect(response).toBe('AI response');

      const msgs = chat.getMessages();
      expect(msgs).toHaveLength(2);
      expect(msgs[0].role).toBe('user');
      expect(msgs[1].role).toBe('assistant');
    });

    it('should use the correct mode prompt', async () => {
      stubApiKey();
      chat.setMode('business');
      const fn = mockFetch({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: 'Business reply' } }] }),
      } as Response);

      await chat.sendMessage('Let us discuss', 'English');

      const [, opts] = fn.mock.calls[0];
      const body = JSON.parse(opts.body);
      const systemMsg = body.messages[0].content;
      expect(systemMsg).toContain('reunião corporativa');
    });
  });

  describe('getLanguageLabel', () => {
    it('should return Portuguese labels for known languages', () => {
      expect(ChatManager.getLanguageLabel('English')).toBe('Inglês');
      expect(ChatManager.getLanguageLabel('Spanish')).toBe('Espanhol');
      expect(ChatManager.getLanguageLabel('Japanese')).toBe('Japonês');
    });

    it('should return the input for unknown languages', () => {
      expect(ChatManager.getLanguageLabel('Korean')).toBe('Korean');
    });
  });
});
