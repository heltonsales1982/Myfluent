/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

// Load the HTML fixture once so every test has the full DOM
const html = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');

function setupDOM() {
  document.documentElement.innerHTML = html;
  localStorage.clear();
}

// Require app.js (will set module.exports thanks to the guard at the bottom)
let app;
beforeAll(() => {
  setupDOM();
  app = require('./app');
});

beforeEach(() => {
  setupDOM();
  // Re-initialise mutable state before every test
  app.initState();
});

// ---------------------------------------------------------------------------
// 1. Core utility functions
// ---------------------------------------------------------------------------
describe('today()', () => {
  it('returns an ISO date string for the current day', () => {
    const result = app.today();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result).toBe(new Date().toISOString().split('T')[0]);
  });
});

describe('dayNumber()', () => {
  it('returns 1 when startDate is today', () => {
    app.startDate = new Date().toISOString().split('T')[0];
    expect(app.dayNumber()).toBe(1);
  });

  it('returns the correct offset for past start dates', () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0];
    app.startDate = fiveDaysAgo;
    expect(app.dayNumber()).toBe(6); // day 1 + 5 elapsed
  });

  it('clamps to a minimum of 1', () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    app.startDate = tomorrow;
    expect(app.dayNumber()).toBeGreaterThanOrEqual(1);
  });

  it('clamps to a maximum of 180', () => {
    const longAgo = new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0];
    app.startDate = longAgo;
    expect(app.dayNumber()).toBe(180);
  });
});

describe('langLabel()', () => {
  it('maps known codes to Portuguese labels', () => {
    expect(app.langLabel('English')).toBe('Inglês');
    expect(app.langLabel('Spanish')).toBe('Espanhol');
    expect(app.langLabel('French')).toBe('Francês');
    expect(app.langLabel('Italian')).toBe('Italiano');
    expect(app.langLabel('German')).toBe('Alemão');
    expect(app.langLabel('Mandarin Chinese')).toBe('Mandarim');
    expect(app.langLabel('Japanese')).toBe('Japonês');
  });

  it('returns the value itself for unknown codes', () => {
    expect(app.langLabel('Korean')).toBe('Korean');
    expect(app.langLabel('')).toBe('');
  });
});

describe('getApiKey()', () => {
  it('returns empty string when no key is stored', () => {
    expect(app.getApiKey()).toBe('');
  });

  it('returns the stored API key', () => {
    localStorage.setItem('mf_apikey', 'gsk_test123');
    expect(app.getApiKey()).toBe('gsk_test123');
  });
});

// ---------------------------------------------------------------------------
// 2. State management
// ---------------------------------------------------------------------------
describe('initState()', () => {
  it('initialises state from empty localStorage with defaults', () => {
    app.initState();
    expect(app.xp).toBe(0);
    expect(app.streak).toBe(0);
    expect(app.words).toBe(0);
    expect(app.chatMode).toBe('casual');
    expect(app.vocabList.length).toBeGreaterThan(0);
    expect(app.doneTasks).toEqual([]);
  });

  it('loads persisted values from localStorage', () => {
    localStorage.setItem('mf_xp', '42');
    localStorage.setItem('mf_streak', '7');
    localStorage.setItem('mf_words', '15');
    localStorage.setItem('mf_vocab', JSON.stringify(['Hola', 'Adiós']));
    app.initState();
    expect(app.xp).toBe(42);
    expect(app.streak).toBe(7);
    expect(app.words).toBe(15);
    expect(app.vocabList).toEqual(['Hola', 'Adiós']);
  });
});

describe('markDone()', () => {
  it('marks a task done, awards XP, and stores to localStorage', () => {
    app.initState();
    app.markDone('t1', 20);
    expect(app.doneTasks).toContain('t1');
    expect(app.xp).toBe(20);
    expect(localStorage.getItem('mf_xp')).toBe('20');
    const btn = document.getElementById('t1');
    expect(btn.classList.contains('done')).toBe(true);
  });

  it('does not double-count when called twice with the same task', () => {
    app.initState();
    app.markDone('t1', 20);
    app.markDone('t1', 20);
    expect(app.xp).toBe(20);
  });

  it('caps XP at 70', () => {
    app.initState();
    app.markDone('t1', 20);
    app.markDone('t2', 20);
    app.markDone('t3', 15);
    app.markDone('t4', 15);
    expect(app.xp).toBe(70);
  });

  it('increments streak when XP reaches 70', () => {
    app.initState();
    app.markDone('t1', 20);
    app.markDone('t2', 20);
    app.markDone('t3', 15);
    app.markDone('t4', 15);
    expect(app.streak).toBe(1);
    expect(localStorage.getItem('mf_streak')).toBe('1');
  });
});

describe('updateXP()', () => {
  it('sets the XP bar width and label correctly', () => {
    app.xp = 35;
    app.updateXP();
    const fill = document.getElementById('xp-fill');
    const val = document.getElementById('xp-val');
    expect(fill.style.width).toBe('50%');
    expect(val.textContent).toBe('35 / 70');
  });

  it('clamps the bar at 100%', () => {
    app.xp = 70;
    app.updateXP();
    expect(document.getElementById('xp-fill').style.width).toBe('100%');
  });
});

describe('resetProgress()', () => {
  it('resets xp, streak, words, and UI when user confirms', () => {
    // Simulate prior progress
    app.xp = 50; app.streak = 3; app.words = 20;
    localStorage.setItem('mf_xp', '50');
    localStorage.setItem('mf_streak', '3');
    localStorage.setItem('mf_words', '20');
    app.markDone('t1', 0); // just to mark it done visually

    // Stub confirm and alert
    window.confirm = jest.fn(() => true);
    window.alert = jest.fn();

    app.resetProgress();

    expect(app.xp).toBe(0);
    expect(app.streak).toBe(0);
    expect(app.words).toBe(0);
    expect(document.getElementById('streak-val').textContent).toBe('0');
    expect(document.getElementById('words-val').textContent).toBe('0');
    expect(window.alert).toHaveBeenCalledWith('Progresso reiniciado!');
  });

  it('does nothing when user cancels', () => {
    app.xp = 50;
    window.confirm = jest.fn(() => false);
    app.resetProgress();
    expect(app.xp).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// 3. UI functions
// ---------------------------------------------------------------------------
describe('showScreen()', () => {
  it('activates the target screen and deactivates the others', () => {
    const btn = document.querySelectorAll('.nav-btn')[1]; // Trilha button
    app.showScreen('trilha', btn);

    expect(document.getElementById('screen-trilha').classList.contains('active')).toBe(true);
    expect(document.getElementById('screen-home').classList.contains('active')).toBe(false);
    expect(btn.classList.contains('active')).toBe(true);
  });

  it('pre-fills config fields when switching to config screen', () => {
    localStorage.setItem('mf_apikey', 'gsk_abc');
    localStorage.setItem('mf_deflang', 'Spanish');
    const btn = document.querySelectorAll('.nav-btn')[4]; // Config button
    app.showScreen('config', btn);

    expect(document.getElementById('api-key-input').value).toBe('gsk_abc');
    expect(document.getElementById('default-lang').value).toBe('Spanish');
  });
});

describe('addMsg()', () => {
  it('appends a user message to the chat', () => {
    const div = app.addMsg('Hello!', 'user');
    expect(div.className).toBe('msg user');
    expect(div.textContent).toBe('Hello!');
    const msgs = document.getElementById('messages');
    expect(msgs.contains(div)).toBe(true);
  });

  it('appends an AI message to the chat', () => {
    const div = app.addMsg('Olá!', 'ai');
    expect(div.className).toBe('msg ai');
    expect(div.textContent).toBe('Olá!');
  });
});

describe('showChatError()', () => {
  it('displays the error box with the given message', () => {
    jest.useFakeTimers();
    app.showChatError('Test error');
    const box = document.getElementById('chat-error');
    expect(box.textContent).toBe('Test error');
    expect(box.style.display).toBe('block');

    jest.advanceTimersByTime(6000);
    expect(box.style.display).toBe('none');
    jest.useRealTimers();
  });
});

describe('setMode()', () => {
  it('activates the selected mode button and deactivates others', () => {
    app.setMode('business');
    expect(app.chatMode).toBe('business');
    expect(document.getElementById('mode-business').classList.contains('active')).toBe(true);
    expect(document.getElementById('mode-casual').classList.contains('active')).toBe(false);
  });
});

describe('togglePhase()', () => {
  it('toggles the "open" class on the phase-detail element', () => {
    const card = document.querySelector('.phase-card');
    const detail = card.querySelector('.phase-detail');
    expect(detail.classList.contains('open')).toBe(false);

    app.togglePhase(card);
    expect(detail.classList.contains('open')).toBe(true);

    app.togglePhase(card);
    expect(detail.classList.contains('open')).toBe(false);
  });
});

describe('renderVocab()', () => {
  it('renders vocab cards matching the vocabList', () => {
    app.vocabList = ['Apple', 'Banana'];
    app.renderVocab();
    const grid = document.getElementById('vocab-grid');
    expect(grid.children.length).toBe(2);
    expect(grid.children[0].querySelector('.vocab-front').textContent).toBe('Apple');
    expect(grid.children[1].querySelector('.vocab-front').textContent).toBe('Banana');
  });

  it('clears old cards before rendering', () => {
    app.vocabList = ['A'];
    app.renderVocab();
    expect(document.getElementById('vocab-grid').children.length).toBe(1);

    app.vocabList = ['B', 'C', 'D'];
    app.renderVocab();
    expect(document.getElementById('vocab-grid').children.length).toBe(3);
  });
});

describe('addVocab()', () => {
  it('adds a word to the front of vocabList and persists it', () => {
    app.vocabList = ['Existing'];
    const input = document.getElementById('vocab-input');
    input.value = 'Nuevo';
    app.addVocab();

    expect(app.vocabList[0]).toBe('Nuevo');
    expect(JSON.parse(localStorage.getItem('mf_vocab'))[0]).toBe('Nuevo');
    expect(input.value).toBe('');
  });

  it('ignores empty input', () => {
    const before = [...app.vocabList];
    document.getElementById('vocab-input').value = '   ';
    app.addVocab();
    expect(app.vocabList).toEqual(before);
  });
});

describe('updateLangLabel()', () => {
  it('updates the hero-lang element based on the select value', () => {
    document.getElementById('lang-select').value = 'French';
    app.updateLangLabel();
    expect(document.getElementById('hero-lang').textContent).toBe('Idioma ativo: Francês');
  });
});

// ---------------------------------------------------------------------------
// 4. Config functions
// ---------------------------------------------------------------------------
describe('saveApiKey()', () => {
  beforeEach(() => {
    window.alert = jest.fn();
  });

  it('saves the key to localStorage and shows success', () => {
    document.getElementById('api-key-input').value = 'gsk_test';
    app.saveApiKey();
    expect(localStorage.getItem('mf_apikey')).toBe('gsk_test');
    expect(window.alert).toHaveBeenCalledWith('Chave Groq salva com sucesso!');
  });

  it('alerts when the input is empty', () => {
    document.getElementById('api-key-input').value = '';
    app.saveApiKey();
    expect(window.alert).toHaveBeenCalledWith('Cole sua chave Groq no campo.');
    expect(localStorage.getItem('mf_apikey')).toBeNull();
  });
});

describe('saveLang()', () => {
  it('persists the language and updates the UI', () => {
    window.alert = jest.fn();
    document.getElementById('default-lang').value = 'Italian';
    app.saveLang();
    expect(localStorage.getItem('mf_deflang')).toBe('Italian');
    expect(document.getElementById('hero-lang').textContent).toBe('Idioma ativo: Italiano');
    expect(window.alert).toHaveBeenCalledWith('Idioma padrão salvo: Italiano');
  });
});

describe('updateApiStatus()', () => {
  it('shows "configured" when an API key exists', () => {
    localStorage.setItem('mf_apikey', 'gsk_x');
    app.updateApiStatus();
    const bar = document.getElementById('api-status-bar');
    expect(bar.innerHTML).toContain('Chave Groq configurada');
  });

  it('shows "not configured" when no API key', () => {
    app.updateApiStatus();
    const bar = document.getElementById('api-status-bar');
    expect(bar.innerHTML).toContain('Chave Groq não configurada');
  });
});

// ---------------------------------------------------------------------------
// 5. API / chat functions
// ---------------------------------------------------------------------------
describe('callGroq()', () => {
  afterEach(() => {
    global.fetch = undefined;
  });

  it('throws NO_KEY when no API key is set', async () => {
    await expect(app.callGroq('sys', [])).rejects.toThrow('NO_KEY');
  });

  it('throws INVALID_KEY on 401 response', async () => {
    localStorage.setItem('mf_apikey', 'gsk_bad');
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) })
    );
    await expect(app.callGroq('sys', [])).rejects.toThrow('INVALID_KEY');
  });

  it('throws the error message on other non-ok responses', async () => {
    localStorage.setItem('mf_apikey', 'gsk_bad');
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false, status: 500,
        json: () => Promise.resolve({ error: { message: 'rate limited' } })
      })
    );
    await expect(app.callGroq('sys', [])).rejects.toThrow('rate limited');
  });

  it('returns the assistant content on success', async () => {
    localStorage.setItem('mf_apikey', 'gsk_good');
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Hello from AI' } }]
        })
      })
    );
    const result = await app.callGroq('sys', [{ role: 'user', content: 'hi' }]);
    expect(result).toBe('Hello from AI');

    // Verify fetch was called with correct structure
    const fetchCall = global.fetch.mock.calls[0];
    expect(fetchCall[0]).toBe('https://api.groq.com/openai/v1/chat/completions');
    const body = JSON.parse(fetchCall[1].body);
    expect(body.model).toBe('llama-3.3-70b-versatile');
    expect(body.messages[0].role).toBe('system');
  });
});

describe('sendMsg()', () => {
  afterEach(() => {
    global.fetch = undefined;
  });

  it('shows an error when no API key is configured', async () => {
    document.getElementById('chat-input').value = 'test';
    await app.sendMsg();
    const box = document.getElementById('chat-error');
    expect(box.textContent).toContain('Configure sua chave Groq');
  });

  it('does nothing for empty input', async () => {
    localStorage.setItem('mf_apikey', 'gsk_ok');
    document.getElementById('chat-input').value = '   ';
    const msgsBefore = document.getElementById('messages').children.length;
    await app.sendMsg();
    expect(document.getElementById('messages').children.length).toBe(msgsBefore);
  });

  it('adds user and AI messages on success', async () => {
    localStorage.setItem('mf_apikey', 'gsk_ok');
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'AI reply' } }]
        })
      })
    );
    document.getElementById('chat-input').value = 'Oi';
    await app.sendMsg();

    const msgs = document.getElementById('messages');
    const allMsgs = [...msgs.querySelectorAll('.msg:not(.loading)')];
    const userMsgs = allMsgs.filter(m => m.classList.contains('user'));
    expect(userMsgs.length).toBeGreaterThanOrEqual(1);
    expect(userMsgs[userMsgs.length - 1].textContent).toBe('Oi');
  });
});

describe('flipCard()', () => {
  afterEach(() => {
    global.fetch = undefined;
  });

  it('toggles the flipped class', async () => {
    app.vocabList = ['Cat'];
    app.renderVocab();
    const card = document.querySelector('.vocab-card');
    localStorage.setItem('mf_apikey', 'gsk_ok');
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Tradução: Gato | Ex: The cat is sleeping' } }]
        })
      })
    );

    await app.flipCard(card, 'Cat', 0);
    expect(card.classList.contains('flipped')).toBe(true);
  });

  it('un-flips and returns early on second call', async () => {
    app.vocabList = ['Dog'];
    app.renderVocab();
    const card = document.querySelector('.vocab-card');
    card.classList.add('flipped'); // pre-flip
    localStorage.setItem('mf_apikey', 'gsk_ok');
    global.fetch = jest.fn();

    await app.flipCard(card, 'Dog', 0);
    expect(card.classList.contains('flipped')).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('shows error text when API key is missing', async () => {
    app.vocabList = ['Fish'];
    app.renderVocab();
    const card = document.querySelector('.vocab-card');

    await app.flipCard(card, 'Fish', 0);
    const back = document.getElementById('vb-0');
    expect(back.textContent).toBe('Configure a chave Groq.');
  });
});

// ---------------------------------------------------------------------------
// 6. restoreDoneTasks
// ---------------------------------------------------------------------------
describe('restoreDoneTasks()', () => {
  it('marks previously completed task buttons as done', () => {
    app.doneTasks = ['t2'];
    app.restoreDoneTasks();
    const btn = document.getElementById('t2');
    expect(btn.classList.contains('done')).toBe(true);
    expect(btn.innerHTML).toContain('Concluído');
  });
});

// ---------------------------------------------------------------------------
// 7. init()
// ---------------------------------------------------------------------------
describe('init()', () => {
  it('populates the home screen with current state', () => {
    app.xp = 35;
    app.streak = 5;
    app.words = 100;
    app.startDate = new Date().toISOString().split('T')[0];
    app.init();

    expect(document.getElementById('streak-val').textContent).toBe('5');
    expect(document.getElementById('words-val').textContent).toBe('100');
    expect(document.getElementById('hero-day').textContent).toBe('Dia 1 de 180');
    expect(document.getElementById('xp-val').textContent).toBe('35 / 70');
  });
});
