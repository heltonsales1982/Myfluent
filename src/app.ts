/**
 * MyFluent Flow - Main Application Entry Point
 * A 180-day language learning journey app
 */

import { ChatManager } from './modules/chat';
import { VocabManager } from './modules/vocab';
import { ProgressManager } from './modules/progress';
import { UIManager } from './modules/ui';

/**
 * Initialize the application when DOM is ready
 */
function initApp(): void {
  // Initialize managers
  const chatManager = new ChatManager();
  const vocabManager = new VocabManager();
  const progressManager = new ProgressManager();
  const uiManager = new UIManager(chatManager, vocabManager, progressManager);

  // Initialize UI
  uiManager.init();

  console.log('MyFluent Flow initialized successfully');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
