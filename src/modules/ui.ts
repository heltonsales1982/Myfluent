/**
 * UI module for managing DOM interactions
 */

import { ChatManager } from './chat';
import { VocabManager } from './vocab';
import { ProgressManager } from './progress';
import { SecureStorage } from '../utils/storage';
import { CONFIG, LANGUAGE_LABELS } from '../config/constants';
import { APIError } from '../utils/api';

export class UIManager {
  private chatManager: ChatManager;
  private vocabManager: VocabManager;
  private progressManager: ProgressManager;

  constructor(
    chatManager: ChatManager,
    vocabManager: VocabManager,
    progressManager: ProgressManager
  ) {
    this.chatManager = chatManager;
    this.vocabManager = vocabManager;
    this.progressManager = progressManager;
  }

  /**
   * Initialize UI
   */
  init(): void {
    this.updateStats();
    this.updateDayDisplay();
    this.updateLanguageDisplay();
    this.restoreDoneTasks();
    this.updateApiStatus();
    this.attachEventListeners();
  }

  /**
   * Update statistics display
   */
  updateStats(): void {
    const streakEl = document.getElementById('streak-val');
    const wordsEl = document.getElementById('words-val');
    
    if (streakEl) streakEl.textContent = this.progressManager.getStreak().toString();
    if (wordsEl) wordsEl.textContent = this.progressManager.getWords().toString();
  }

  /**
   * Update day display
   */
  updateDayDisplay(): void {
    const dayEl = document.getElementById('hero-day');
    if (dayEl) {
      dayEl.textContent = `Dia ${this.progressManager.getDayNumber()} de ${CONFIG.TOTAL_DAYS}`;
    }
  }

  /**
   * Update language display
   */
  updateLanguageDisplay(): void {
    const langEl = document.getElementById('hero-lang');
    const defaultLang = SecureStorage.getItem(CONFIG.STORAGE_KEYS.DEFAULT_LANG) || CONFIG.DEFAULT_LANGUAGE;
    if (langEl) {
      langEl.textContent = `Idioma ativo: ${LANGUAGE_LABELS[defaultLang] || defaultLang}`;
    }
  }

  /**
   * Update XP bar
   */
  updateXPBar(): void {
    const fillEl = document.getElementById('xp-fill');
    const valEl = document.getElementById('xp-val');
    
    if (fillEl && valEl) {
      const percentage = this.progressManager.getXPPercentage();
      fillEl.style.width = `${Math.min(100, percentage)}%`;
      valEl.textContent = `${this.progressManager.getXP()} / ${CONFIG.DAILY_XP_TARGET}`;
    }
  }

  /**
   * Restore done tasks from storage
   */
  restoreDoneTasks(): void {
    const taskIds = ['t1', 't2', 't3', 't4'];
    taskIds.forEach(id => {
      if (this.progressManager.isTaskDone(id)) {
        const btn = document.getElementById(id);
        if (btn) {
          btn.classList.add('done');
          btn.innerHTML = '<i class="ti ti-check"></i> Concluído';
        }
      }
    });
  }

  /**
   * Update API status display
   */
  updateApiStatus(): void {
    const bar = document.getElementById('api-status-bar');
    if (!bar) return;

    const hasKey = !!SecureStorage.getApiKey();
    bar.innerHTML = hasKey
      ? '<div class="api-status ok"><i class="ti ti-check"></i> Chave Groq configurada ✓</div>'
      : '<div class="api-status missing"><i class="ti ti-alert-triangle"></i> Chave Groq não configurada</div>';
  }

  /**
   * Show screen
   */
  showScreen(screenId: string, navBtn: HTMLElement): void {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    // Show selected screen
    const screen = document.getElementById(`screen-${screenId}`);
    if (screen) screen.classList.add('active');
    
    if (navBtn) navBtn.classList.add('active');

    // Screen-specific actions
    if (screenId === 'vocab') {
      this.renderVocab();
    } else if (screenId === 'config') {
      this.populateConfig();
    }
  }

  /**
   * Populate config screen
   */
  populateConfig(): void {
    const apiKeyInput = document.getElementById('api-key-input') as HTMLInputElement;
    const defaultLangSelect = document.getElementById('default-lang') as HTMLSelectElement;
    
    if (apiKeyInput) {
      const key = SecureStorage.getApiKey();
      if (key) apiKeyInput.value = key;
    }
    
    if (defaultLangSelect) {
      defaultLangSelect.value = SecureStorage.getItem(CONFIG.STORAGE_KEYS.DEFAULT_LANG) || CONFIG.DEFAULT_LANGUAGE;
    }
    
    this.updateApiStatus();
  }

  /**
   * Mark task as done
   */
  markTaskDone(taskId: string, _points: number): void {
    if (this.progressManager.isTaskDone(taskId)) return;

    this.progressManager.markTaskDone(taskId);
    
    const btn = document.getElementById(taskId);
    if (btn) {
      btn.classList.add('done');
      btn.innerHTML = '<i class="ti ti-check"></i> Concluído';
    }

    this.updateXPBar();
    this.updateStats();
  }

  /**
   * Toggle phase card
   */
  togglePhase(card: HTMLElement): void {
    const detail = card.querySelector('.phase-detail');
    if (detail) {
      detail.classList.toggle('open');
    }
  }

  /**
   * Set chat mode
   */
  setChatMode(mode: string): void {
    this.chatManager.setMode(mode as any);
    
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById(`mode-${mode}`);
    if (activeBtn) activeBtn.classList.add('active');
  }

  /**
   * Add chat message to UI
   */
  addChatMessage(text: string, role: 'user' | 'ai' | 'loading'): HTMLElement | null {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return null;

    const div = document.createElement('div');
    div.className = `msg ${role}`;
    div.textContent = text;
    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return div;
  }

  /**
   * Show chat error
   */
  showChatError(message: string): void {
    const errorBox = document.getElementById('chat-error');
    if (errorBox) {
      errorBox.textContent = message;
      errorBox.style.display = 'block';
      setTimeout(() => {
        errorBox.style.display = 'none';
      }, 6000);
    }
  }

  /**
   * Render vocabulary grid
   */
  renderVocab(): void {
    const grid = document.getElementById('vocab-grid');
    if (!grid) return;

    grid.innerHTML = '';
    const vocabList = this.vocabManager.getVocabList();

    vocabList.forEach((word, index) => {
      const card = document.createElement('div');
      card.className = 'vocab-card';
      card.dataset.index = index.toString();
      card.innerHTML = `
        <div class="vocab-front">${word}</div>
        <div class="vocab-back" id="vb-${index}">Toque para traduzir via IA</div>
      `;
      grid.appendChild(card);
    });
  }

  /**
   * Flip vocab card and load translation
   */
  async flipVocabCard(card: HTMLElement, word: string, index: number): Promise<void> {
    card.classList.toggle('flipped');
    
    if (!card.classList.contains('flipped')) return;

    const back = document.getElementById(`vb-${index}`);
    if (!back || back.dataset.loaded) return;

    back.textContent = '...';
    
    try {
      const translation = await this.vocabManager.getTranslation(word);
      back.textContent = translation;
      back.dataset.loaded = '1';
      
      this.vocabManager.incrementWordCount();
      this.updateStats();
    } catch (error) {
      if (error instanceof APIError) {
        back.textContent = error.code === 'NO_KEY' 
          ? 'Configure a chave Groq.' 
          : 'Erro de conexão.';
      } else {
        back.textContent = 'Erro ao carregar tradução.';
      }
    }
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    // Navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const screenId = target.dataset.screen;
        if (screenId) this.showScreen(screenId, target);
      });
    });

    // Task buttons
    document.querySelectorAll('.check-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const taskId = target.dataset.task;
        const points = target.dataset.points ? parseInt(target.dataset.points) : 0;
        if (taskId) this.markTaskDone(taskId, points);
      });
    });

    // Phase cards
    document.querySelectorAll('.phase-card').forEach(card => {
      card.addEventListener('click', () => this.togglePhase(card as HTMLElement));
    });

    // Chat mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const mode = target.dataset.mode;
        if (mode) this.setChatMode(mode);
      });
    });

    // Send button
    const sendBtn = document.getElementById('send-btn');
    const chatInput = document.getElementById('chat-input');
    
    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.handleSendMessage());
    }
    
    if (chatInput) {
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.handleSendMessage();
      });
    }

    // Add vocab button
    const addVocabBtn = document.getElementById('add-vocab-btn');
    const vocabInput = document.getElementById('vocab-input');
    
    if (addVocabBtn) {
      addVocabBtn.addEventListener('click', () => this.handleAddVocab());
    }
    
    if (vocabInput) {
      vocabInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.handleAddVocab();
      });
    }

    // Save API key button
    const saveApiBtn = document.getElementById('save-api-btn');
    if (saveApiBtn) {
      saveApiBtn.addEventListener('click', () => this.handleSaveApiKey());
    }

    // Save language button
    const saveLangBtn = document.getElementById('save-lang-btn');
    if (saveLangBtn) {
      saveLangBtn.addEventListener('click', () => this.handleSaveLanguage());
    }

    // Reset button
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.handleReset());
    }

    // Language select change
    const langSelect = document.getElementById('lang-select');
    if (langSelect) {
      langSelect.addEventListener('change', () => {
        const lang = (langSelect as HTMLSelectElement).value;
        const langEl = document.getElementById('hero-lang');
        if (langEl) {
          langEl.textContent = `Idioma ativo: ${LANGUAGE_LABELS[lang] || lang}`;
        }
      });
    }

    // Vocab grid clicks (delegation)
    const vocabGrid = document.getElementById('vocab-grid');
    if (vocabGrid) {
      vocabGrid.addEventListener('click', (e) => {
        const card = (e.target as HTMLElement).closest('.vocab-card') as HTMLElement;
        if (card) {
          const index = parseInt(card.dataset.index || '0');
          const word = this.vocabManager.getVocabList()[index];
          this.flipVocabCard(card, word, index);
        }
      });
    }
  }

  /**
   * Handle send message
   */
  private async handleSendMessage(): Promise<void> {
    const input = document.getElementById('chat-input') as HTMLInputElement;
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    if (!SecureStorage.getApiKey()) {
      this.showChatError('Configure sua chave Groq na aba Config primeiro.');
      return;
    }

    input.value = '';
    this.addChatMessage(text, 'user');

    const langSelect = document.getElementById('lang-select') as HTMLSelectElement;
    const language = langSelect?.value || CONFIG.DEFAULT_LANGUAGE;

    const loading = this.addChatMessage('digitando...', 'loading');
    if (!loading) return;

    try {
      const reply = await this.chatManager.sendMessage(text, language);
      loading.textContent = reply;
      loading.classList.remove('loading');
    } catch (error) {
      loading.remove();
      if (error instanceof APIError) {
        if (error.code === 'NO_KEY') {
          this.showChatError('Configure sua chave Groq na aba Config.');
        } else if (error.code === 'INVALID_KEY') {
          this.showChatError('Chave Groq inválida. Verifique na aba Config.');
        } else {
          this.showChatError(error.message);
        }
      } else {
        this.showChatError('Erro de conexão. Verifique sua internet.');
      }
    }
  }

  /**
   * Handle add vocabulary
   */
  private handleAddVocab(): void {
    const input = document.getElementById('vocab-input') as HTMLInputElement;
    if (!input) return;

    const word = input.value.trim();
    if (!word) return;

    if (this.vocabManager.addWord(word)) {
      input.value = '';
      this.renderVocab();
    }
  }

  /**
   * Handle save API key
   */
  private handleSaveApiKey(): void {
    const input = document.getElementById('api-key-input') as HTMLInputElement;
    if (!input) return;

    const key = input.value.trim();
    if (!key) {
      alert('Cole sua chave Groq no campo.');
      return;
    }

    SecureStorage.setApiKey(key);
    this.updateApiStatus();
    alert('Chave Groq salva com sucesso!');
  }

  /**
   * Handle save language
   */
  private handleSaveLanguage(): void {
    const select = document.getElementById('default-lang') as HTMLSelectElement;
    if (!select) return;

    const lang = select.value;
    SecureStorage.setItem(CONFIG.STORAGE_KEYS.DEFAULT_LANG, lang);
    
    const langEl = document.getElementById('hero-lang');
    if (langEl) {
      langEl.textContent = `Idioma ativo: ${LANGUAGE_LABELS[lang] || lang}`;
    }

    const langSelect = document.getElementById('lang-select') as HTMLSelectElement;
    if (langSelect) {
      langSelect.value = lang;
    }

    alert(`Idioma padrão salvo: ${LANGUAGE_LABELS[lang] || lang}`);
  }

  /**
   * Handle reset progress
   */
  private handleReset(): void {
    if (!confirm('Tem certeza? Isso vai zerar seu progresso.')) return;

    this.progressManager.reset();
    
    const streakEl = document.getElementById('streak-val');
    const wordsEl = document.getElementById('words-val');
    const dayEl = document.getElementById('hero-day');
    
    if (streakEl) streakEl.textContent = '0';
    if (wordsEl) wordsEl.textContent = '0';
    if (dayEl) dayEl.textContent = `Dia 1 de ${CONFIG.TOTAL_DAYS}`;

    this.updateXPBar();

    const taskIds = ['t1', 't2', 't3', 't4'];
    taskIds.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.classList.remove('done');
        btn.innerHTML = '<i class="ti ti-check"></i> Marcar feito';
      }
    });

    alert('Progresso reiniciado!');
  }
}
