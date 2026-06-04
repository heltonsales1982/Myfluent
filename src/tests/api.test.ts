/**
 * API utilities tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { callGroqAPI, translateText, APIError } from '../utils/api';
import { SecureStorage } from '../utils/storage';
import { CONFIG } from '../config/constants';

const TEST_API_KEY = 'gsk_testkey123';

function mockFetchOk(data: unknown) {
  const fn = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(data),
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

function mockFetchError(status: number, data: unknown = {}) {
  const fn = vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve(data),
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

function mockFetchJsonFail(status: number) {
  const fn = vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.reject(new Error('parse error')),
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

function mockFetchReject(error: Error) {
  const fn = vi.fn().mockRejectedValue(error);
  vi.stubGlobal('fetch', fn);
  return fn;
}

function stubApiKey() {
  vi.spyOn(SecureStorage, 'getApiKey').mockReturnValue(TEST_API_KEY);
}

describe('APIError', () => {
  it('should create an error with code and statusCode', () => {
    const err = new APIError('bad request', 'API_ERROR', 400);
    expect(err.message).toBe('bad request');
    expect(err.code).toBe('API_ERROR');
    expect(err.statusCode).toBe(400);
    expect(err.name).toBe('APIError');
  });
});

describe('callGroqAPI', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should throw NO_KEY when no API key is configured', async () => {
    await expect(callGroqAPI('sys', [])).rejects.toThrow('API key not configured');
    try {
      await callGroqAPI('sys', []);
    } catch (e) {
      expect(e).toBeInstanceOf(APIError);
      expect((e as APIError).code).toBe('NO_KEY');
    }
  });

  it('should return AI content on success', async () => {
    stubApiKey();
    const fn = mockFetchOk({ choices: [{ message: { content: 'Hello from AI' } }] });

    const result = await callGroqAPI('system prompt', [{ role: 'user', content: 'hi' }]);
    expect(result).toBe('Hello from AI');

    const [url, opts] = fn.mock.calls[0];
    expect(url).toBe(CONFIG.GROQ_API_URL);
    const body = JSON.parse(opts.body);
    expect(body.model).toBe(CONFIG.GROQ_MODEL);
    expect(body.messages[0].role).toBe('system');
  });

  it('should return empty string when response has no content', async () => {
    stubApiKey();
    mockFetchOk({ choices: [] });
    const result = await callGroqAPI('sys', []);
    expect(result).toBe('');
  });

  it('should throw INVALID_KEY on 401', async () => {
    stubApiKey();
    mockFetchError(401);

    try {
      await callGroqAPI('sys', []);
      expect.unreachable('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(APIError);
      expect((e as APIError).code).toBe('INVALID_KEY');
      expect((e as APIError).statusCode).toBe(401);
    }
  });

  it('should throw RATE_LIMIT on 429', async () => {
    stubApiKey();
    mockFetchError(429);

    try {
      await callGroqAPI('sys', []);
      expect.unreachable('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(APIError);
      expect((e as APIError).code).toBe('RATE_LIMIT');
      expect((e as APIError).statusCode).toBe(429);
    }
  });

  it('should throw API_ERROR with message on other failures', async () => {
    stubApiKey();
    mockFetchError(500, { error: { message: 'server error' } });

    try {
      await callGroqAPI('sys', []);
      expect.unreachable('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(APIError);
      expect((e as APIError).code).toBe('API_ERROR');
      expect((e as APIError).message).toBe('server error');
    }
  });

  it('should throw API_ERROR with default message when json parse fails', async () => {
    stubApiKey();
    mockFetchJsonFail(500);

    try {
      await callGroqAPI('sys', []);
      expect.unreachable('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(APIError);
      expect((e as APIError).message).toBe('API request failed');
    }
  });

  it('should throw NETWORK_ERROR on fetch TypeError', async () => {
    stubApiKey();
    mockFetchReject(new TypeError('Failed to fetch'));

    try {
      await callGroqAPI('sys', []);
      expect.unreachable('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(APIError);
      expect((e as APIError).code).toBe('NETWORK_ERROR');
    }
  });

  it('should throw UNKNOWN_ERROR on unexpected errors', async () => {
    stubApiKey();
    mockFetchReject(new Error('something weird'));

    try {
      await callGroqAPI('sys', []);
      expect.unreachable('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(APIError);
      expect((e as APIError).code).toBe('UNKNOWN_ERROR');
    }
  });
});

describe('translateText', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should call callGroqAPI with translation prompt', async () => {
    stubApiKey();
    mockFetchOk({
      choices: [{ message: { content: 'Translation: Gato | Ex: The cat sleeps' } }],
    });

    const result = await translateText('Cat');
    expect(result).toBe('Translation: Gato | Ex: The cat sleeps');
  });
});
