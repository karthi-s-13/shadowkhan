// ═══════════════════════════════════════════════════════════
// ShadowKhan — Content Script for learner.saveetha.in
// Floating icon + overlay UI + inject into message textarea
// ═══════════════════════════════════════════════════════════

(function () {
  'use strict';

  // Prevent double-injection
  if (document.getElementById('shadowkhan-fab')) return;

  const ICON_URL = chrome.runtime.getURL('icons/icon48.png');

  // ── Create Floating Action Button ──
  const fab = document.createElement('div');
  fab.id = 'shadowkhan-fab';
  fab.title = 'ShadowKhan — Forge Prompt';
  fab.innerHTML = `<img src="${ICON_URL}" alt="ShadowKhan" />`;
  document.body.appendChild(fab);

  // ── Create Overlay Panel ──
  const overlay = document.createElement('div');
  overlay.id = 'shadowkhan-overlay';
  overlay.classList.add('sk-hidden');
  overlay.innerHTML = `
    <div class="sk-panel">
      <div class="sk-header">
        <div class="sk-header-left">
          <img src="${ICON_URL}" class="sk-header-icon" alt="" />
          <div>
            <div class="sk-title">ShadowKhan</div>
            <div class="sk-subtitle">Academic Prompt Enhancer</div>
          </div>
        </div>
        <button class="sk-close" id="sk-close" title="Close">&times;</button>
      </div>

      <div class="sk-body">
        <label class="sk-label" for="sk-question">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Enter your question
        </label>
        <textarea id="sk-question" class="sk-textarea" placeholder="Type your discussion question here..." rows="4"></textarea>
        <div class="sk-counter"><span id="sk-char-count">0</span> chars</div>

        <div style="display: flex; gap: 8px; margin-top: 4px;">
          <button id="sk-inject-raw" class="sk-action-btn" style="flex: 1;">
            Inject Raw
          </button>
          <button id="sk-forge" class="sk-forge-btn" style="flex: 2;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Forge Prompt
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div class="sk-loading sk-hidden" id="sk-loading">
        <div class="sk-spinner">
          <div class="sk-ring"></div>
          <div class="sk-ring sk-ring-2"></div>
        </div>
        <p class="sk-loading-text">Forging from the shadows…</p>
      </div>

      <!-- Result State -->
      <div class="sk-result sk-hidden" id="sk-result">
        <div class="sk-result-header">
          <span class="sk-result-badge" style="background: transparent; border: 1px solid rgba(168,85,247,0.3); color: #a855f7;">✓ Forged</span>
          <span class="sk-result-chars" id="sk-result-chars"></span>
        </div>
        <pre class="sk-result-content" id="sk-result-content"></pre>
        <div class="sk-result-actions" style="display: flex; gap: 8px;">
          <button id="sk-inject-forged" class="sk-forge-btn" style="flex: 2;">
            Inject Forged
          </button>
          <button id="sk-new" class="sk-action-btn" style="flex: 1;">New</button>
        </div>
      </div>

      <div class="sk-footer">ShadowKhan v1.1 · Nvidia Nemotron</div>
    </div>
  `;
  document.body.appendChild(overlay);

  // ── DOM Refs ──
  const closeBtn    = document.getElementById('sk-close');
  const questionEl  = document.getElementById('sk-question');
  const charCount   = document.getElementById('sk-char-count');
  const forgeBtn    = document.getElementById('sk-forge');
  const injectRawBtn = document.getElementById('sk-inject-raw');
  const injectForgedBtn = document.getElementById('sk-inject-forged');
  const loadingEl   = document.getElementById('sk-loading');
  const resultEl    = document.getElementById('sk-result');
  const resultChars = document.getElementById('sk-result-chars');
  const resultContent = document.getElementById('sk-result-content');
  const newBtn      = document.getElementById('sk-new');
  const bodyEl      = overlay.querySelector('.sk-body');

  // ── FAB Click → Toggle Overlay ──
  fab.addEventListener('click', () => {
    const isHidden = overlay.classList.contains('sk-hidden');
    if (isHidden) {
      overlay.classList.remove('sk-hidden');
      // Reset to input state
      bodyEl.classList.remove('sk-hidden');
      loadingEl.classList.add('sk-hidden');
      resultEl.classList.add('sk-hidden');
      questionEl.focus();
    } else {
      overlay.classList.add('sk-hidden');
    }
  });

  // ── Close Button ──
  closeBtn.addEventListener('click', () => {
    overlay.classList.add('sk-hidden');
  });

  // ── Click outside panel to close ──
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.add('sk-hidden');
    }
  });

  // ── Character Counter ──
  questionEl.addEventListener('input', () => {
    charCount.textContent = questionEl.value.length;
  });

  // ── Inject text into the target textarea ──
  function injectIntoTextarea(text) {
    const target = document.querySelector('textarea[name="message_text"]');
    if (!target) return false;

    // Use native setter to bypass any paste/input blockers
    const nativeSetter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype, 'value'
    ).set;

    nativeSetter.call(target, text);

    // Dispatch events to trigger any framework listeners
    target.dispatchEvent(new Event('input', { bubbles: true }));
    target.dispatchEvent(new Event('change', { bubbles: true }));
    target.dispatchEvent(new Event('keyup', { bubbles: true }));

    // Auto-resize the textarea height
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 300) + 'px';

    // Focus the textarea
    target.focus();

    return true;
  }

  // ── Inject Raw Prompt ──
  injectRawBtn.addEventListener('click', () => {
    const question = questionEl.value.trim();
    if (!question) {
      questionEl.classList.add('sk-shake');
      questionEl.style.borderColor = '#f87171';
      setTimeout(() => {
        questionEl.classList.remove('sk-shake');
        questionEl.style.borderColor = '';
      }, 500);
      return;
    }

    const injected = injectIntoTextarea(question);
    if (!injected) {
      const errDiv = document.createElement('div');
      errDiv.className = 'sk-error';
      errDiv.textContent = `⚠ Target textarea not found`;
      bodyEl.insertBefore(errDiv, injectRawBtn.parentElement);
      setTimeout(() => errDiv.remove(), 4000);
    } else {
      overlay.classList.add('sk-hidden'); // Close overlay on success
    }
  });

  // ── Forge Prompt (Generate Only) ──
  forgeBtn.addEventListener('click', async () => {
    const question = questionEl.value.trim();
    if (!question) {
      questionEl.classList.add('sk-shake');
      questionEl.style.borderColor = '#f87171';
      setTimeout(() => {
        questionEl.classList.remove('sk-shake');
        questionEl.style.borderColor = '';
      }, 500);
      return;
    }

    // Show loading
    bodyEl.classList.add('sk-hidden');
    loadingEl.classList.remove('sk-hidden');
    resultEl.classList.add('sk-hidden');

    try {
      // Send to background service worker for API call
      const response = await chrome.runtime.sendMessage({
        action: 'forgePrompt',
        question: question
      });

      if (!response.success) {
        throw new Error(response.error || 'Unknown error');
      }

      const text = response.data.content;

      // Show result (do NOT inject yet)
      loadingEl.classList.add('sk-hidden');
      resultEl.classList.remove('sk-hidden');
      resultContent.textContent = text;
      resultChars.textContent = `${text.length} chars`;

      const badge = resultEl.querySelector('.sk-result-badge');
      badge.textContent = '✓ Forged';
      badge.style.background = 'transparent';
      badge.style.color = '#a855f7';
      badge.style.border = '1px solid rgba(168,85,247,0.3)';
    } catch (err) {
      // Show error and go back to input
      loadingEl.classList.add('sk-hidden');
      bodyEl.classList.remove('sk-hidden');

      const errorMsg = err.message || 'Failed to forge prompt';
      questionEl.style.borderColor = '#f87171';
      // Show a temporary error message
      const errDiv = document.createElement('div');
      errDiv.className = 'sk-error';
      errDiv.textContent = `Error: ${errorMsg.slice(0, 80)}`;
      bodyEl.insertBefore(errDiv, injectRawBtn.parentElement);
      setTimeout(() => {
        errDiv.remove();
        questionEl.style.borderColor = '';
      }, 4000);

      console.error('ShadowKhan Error:', err);
    }
  });

  // ── Inject Forged Prompt ──
  injectForgedBtn.addEventListener('click', () => {
    const text = resultContent.textContent;
    if (!text) return;

    const injected = injectIntoTextarea(text);
    
    if (injected) {
      const badge = resultEl.querySelector('.sk-result-badge');
      badge.textContent = '✓ Injected';
      badge.style.background = 'rgba(52, 211, 153, 0.15)';
      badge.style.color = '#34d399';
      badge.style.border = 'none';
      setTimeout(() => {
        overlay.classList.add('sk-hidden'); // Close after a short delay
      }, 600);
    } else {
      const badge = resultEl.querySelector('.sk-result-badge');
      badge.textContent = '⚠ No textarea found';
      badge.style.background = 'rgba(251, 191, 36, 0.15)';
      badge.style.color = '#fbbf24';
      badge.style.border = 'none';
    }
  });

  // ── New Prompt ──
  newBtn.addEventListener('click', () => {
    resultEl.classList.add('sk-hidden');
    bodyEl.classList.remove('sk-hidden');
    questionEl.value = '';
    charCount.textContent = '0';
    questionEl.focus();
    // Reset badge
    const badge = resultEl.querySelector('.sk-result-badge');
    badge.textContent = '✓ Injected';
    badge.style.background = '';
    badge.style.color = '';
  });

  // ── Keyboard shortcut: Escape to close ──
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.classList.contains('sk-hidden')) {
      overlay.classList.add('sk-hidden');
    }
  });

})();
