/* MyFluent Flow — Application Logic */

let xp, streak, words, startDate, chatMode, vocabList, doneTasks;

function initState() {
  xp = parseInt(localStorage.getItem('mf_xp') || '0');
  streak = parseInt(localStorage.getItem('mf_streak') || '0');
  words = parseInt(localStorage.getItem('mf_words') || '0');
  startDate = localStorage.getItem('mf_start') || new Date().toISOString().split('T')[0];
  chatMode = 'casual';
  vocabList = JSON.parse(localStorage.getItem('mf_vocab') || '["Hello","Thank you","Meeting","Deadline","Performance","Dashboard","I need help","Good morning","See you later","Well done"]');
  doneTasks = JSON.parse(localStorage.getItem('mf_done_' + today()) || '[]');
  if (!localStorage.getItem('mf_start')) localStorage.setItem('mf_start', startDate);
}

function today() { return new Date().toISOString().split('T')[0]; }

function dayNumber() {
  const d1 = new Date(startDate), d2 = new Date();
  return Math.max(1, Math.min(180, Math.round((d2 - d1) / 86400000) + 1));
}

function getApiKey() { return localStorage.getItem('mf_apikey') || ''; }

function langLabel(v) {
  const m = {English:'Inglês',Spanish:'Espanhol',French:'Francês',Italian:'Italiano',German:'Alemão','Mandarin Chinese':'Mandarim',Japanese:'Japonês'};
  return m[v] || v;
}

function init() {
  document.getElementById('streak-val').textContent = streak;
  document.getElementById('words-val').textContent = words;
  document.getElementById('hero-day').textContent = 'Dia ' + dayNumber() + ' de 180';
  const lang = localStorage.getItem('mf_deflang') || 'English';
  document.getElementById('hero-lang').textContent = 'Idioma ativo: ' + langLabel(lang);
  updateXP(); restoreDoneTasks(); renderVocab(); updateApiStatus();
}

function updateXP() {
  const pct = Math.round((xp / 70) * 100);
  document.getElementById('xp-fill').style.width = Math.min(100, pct) + '%';
  document.getElementById('xp-val').textContent = xp + ' / 70';
}

function restoreDoneTasks() {
  doneTasks.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) { btn.classList.add('done'); btn.innerHTML = '<i class="ti ti-check"></i> Concluído'; }
  });
}

function updateApiStatus() {
  const bar = document.getElementById('api-status-bar');
  if (bar) bar.innerHTML = getApiKey()
    ? '<div class="api-status ok"><i class="ti ti-check"></i> Chave Groq configurada ✓</div>'
    : '<div class="api-status missing"><i class="ti ti-alert-triangle"></i> Chave Groq não configurada</div>';
}

function showScreen(id, btn) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
  btn.classList.add('active');
  if (id === 'vocab') renderVocab();
  if (id === 'config') {
    const k = getApiKey();
    if (k) document.getElementById('api-key-input').value = k;
    document.getElementById('default-lang').value = localStorage.getItem('mf_deflang') || 'English';
    updateApiStatus();
  }
}

function markDone(id, pts) {
  if (doneTasks.includes(id)) return;
  doneTasks.push(id);
  localStorage.setItem('mf_done_' + today(), JSON.stringify(doneTasks));
  const btn = document.getElementById(id);
  btn.classList.add('done');
  btn.innerHTML = '<i class="ti ti-check"></i> Concluído';
  xp = Math.min(70, xp + pts);
  localStorage.setItem('mf_xp', xp);
  updateXP();
  if (xp >= 70 && !localStorage.getItem('mf_streak_' + today())) {
    streak++;
    localStorage.setItem('mf_streak', streak);
    localStorage.setItem('mf_streak_' + today(), '1');
    document.getElementById('streak-val').textContent = streak;
  }
}

function togglePhase(card) { card.querySelector('.phase-detail').classList.toggle('open'); }

function setMode(mode) {
  chatMode = mode;
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('mode-' + mode).classList.add('active');
}

function updateLangLabel() {
  document.getElementById('hero-lang').textContent = 'Idioma ativo: ' + langLabel(document.getElementById('lang-select').value);
}

function addMsg(text, role) {
  const msgs = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'msg ' + role;
  div.textContent = text;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function showChatError(msg) {
  const box = document.getElementById('chat-error');
  box.textContent = msg;
  box.style.display = 'block';
  setTimeout(() => box.style.display = 'none', 6000);
}

async function callGroq(systemPrompt, messages) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('NO_KEY');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 500,
      messages: [{ role: 'system', content: systemPrompt }, ...messages]
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) throw new Error('INVALID_KEY');
    throw new Error(err?.error?.message || 'API_ERROR');
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function sendMsg() {
  if (!getApiKey()) { showChatError('Configure sua chave Groq na aba Config primeiro.'); return; }
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  addMsg(text, 'user');

  const lang = document.getElementById('lang-select').value;
  const modes = {
    casual: `Converse de forma casual e amigável. Responda SEMPRE em ${lang} (com tradução PT-BR ao final entre parênteses). Corrija erros integrando a forma correta naturalmente na conversa.`,
    business: `Simule uma reunião corporativa de TI. Responda em ${lang} (com tradução PT-BR). Use vocabulário executivo e profissional.`,
    correct: `Primeiro identifique erros gramaticais do usuário e mostre a correção de forma breve. Depois responda naturalmente em ${lang} com tradução PT-BR.`
  };

  const loading = addMsg('digitando...', 'ai loading');
  const history = [];
  document.querySelectorAll('#messages .msg:not(.loading)').forEach(m => {
    history.push({ role: m.classList.contains('user') ? 'user' : 'assistant', content: m.textContent });
  });

  try {
    const reply = await callGroq(
      `Você é um tutor de idiomas especialista nativo em ${lang}. ${modes[chatMode]} Seja conciso (máx 3 frases). Nunca quebre o fluxo com explicações longas.`,
      history
    );
    loading.textContent = reply;
    loading.classList.remove('loading');
  } catch(e) {
    loading.remove();
    if (e.message === 'NO_KEY') showChatError('Configure sua chave Groq na aba Config.');
    else if (e.message === 'INVALID_KEY') showChatError('Chave Groq inválida. Verifique na aba Config.');
    else showChatError('Erro de conexão. Verifique sua internet.');
  }
}

function renderVocab() {
  const grid = document.getElementById('vocab-grid');
  grid.innerHTML = '';
  vocabList.forEach((w, i) => {
    const card = document.createElement('div');
    card.className = 'vocab-card';
    card.innerHTML = `<div class="vocab-front">${w}</div><div class="vocab-back" id="vb-${i}">Toque para traduzir via IA</div>`;
    card.onclick = () => flipCard(card, w, i);
    grid.appendChild(card);
  });
}

async function flipCard(card, word, i) {
  card.classList.toggle('flipped');
  if (!card.classList.contains('flipped')) return;
  const back = document.getElementById('vb-' + i);
  if (back.dataset.loaded) return;
  back.textContent = '...';
  try {
    const reply = await callGroq('Você é um tradutor conciso.', [{ role: 'user', content: `Traduza para PT-BR e dê exemplo curto de uso: "${word}". Formato: Tradução: X | Ex: Y` }]);
    back.textContent = reply;
    back.dataset.loaded = '1';
    words++;
    localStorage.setItem('mf_words', words);
    document.getElementById('words-val').textContent = words;
  } catch(e) {
    back.textContent = e.message === 'NO_KEY' ? 'Configure a chave Groq.' : 'Erro de conexão.';
  }
}

function addVocab() {
  const input = document.getElementById('vocab-input');
  const w = input.value.trim();
  if (!w) return;
  vocabList.unshift(w);
  localStorage.setItem('mf_vocab', JSON.stringify(vocabList));
  input.value = '';
  renderVocab();
}

function saveApiKey() {
  const k = document.getElementById('api-key-input').value.trim();
  if (!k) { alert('Cole sua chave Groq no campo.'); return; }
  localStorage.setItem('mf_apikey', k);
  updateApiStatus();
  alert('Chave Groq salva com sucesso!');
}

function saveLang() {
  const v = document.getElementById('default-lang').value;
  localStorage.setItem('mf_deflang', v);
  document.getElementById('hero-lang').textContent = 'Idioma ativo: ' + langLabel(v);
  document.getElementById('lang-select').value = v;
  alert('Idioma padrão salvo: ' + langLabel(v));
}

function resetProgress() {
  if (!confirm('Tem certeza? Isso vai zerar seu progresso.')) return;
  xp = 0; streak = 0; words = 0;
  ['mf_xp','mf_streak','mf_words'].forEach(k => localStorage.setItem(k, 0));
  localStorage.setItem('mf_start', new Date().toISOString().split('T')[0]);
  doneTasks = [];
  document.getElementById('streak-val').textContent = 0;
  document.getElementById('words-val').textContent = 0;
  document.getElementById('hero-day').textContent = 'Dia 1 de 180';
  updateXP();
  ['t1','t2','t3','t4'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) { btn.classList.remove('done'); btn.innerHTML = '<i class="ti ti-check"></i> Marcar feito'; }
  });
  alert('Progresso reiniciado!');
}

/* Expose for Node.js testing while keeping browser globals intact */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    today, dayNumber, langLabel, getApiKey,
    init, initState, updateXP, restoreDoneTasks, updateApiStatus,
    showScreen, markDone, togglePhase, setMode, updateLangLabel,
    addMsg, showChatError, callGroq, sendMsg,
    renderVocab, flipCard, addVocab,
    saveApiKey, saveLang, resetProgress,
    get xp() { return xp; }, set xp(v) { xp = v; },
    get streak() { return streak; }, set streak(v) { streak = v; },
    get words() { return words; }, set words(v) { words = v; },
    get startDate() { return startDate; }, set startDate(v) { startDate = v; },
    get chatMode() { return chatMode; }, set chatMode(v) { chatMode = v; },
    get vocabList() { return vocabList; }, set vocabList(v) { vocabList = v; },
    get doneTasks() { return doneTasks; }, set doneTasks(v) { doneTasks = v; },
  };
}
