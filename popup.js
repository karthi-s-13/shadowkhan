// ═══════════════════════════════════════════════════════════
// ShadowKhan — Popup Script (Simplified)
// Uses background service worker for LLM calls
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  const questionInput  = document.getElementById('question-input');
  const questionCount  = document.getElementById('question-counter');
  const forgeBtn       = document.getElementById('forge-btn');
  const outputSection  = document.getElementById('output-section');
  const outputContent  = document.getElementById('output-content');
  const charBadge      = document.getElementById('char-badge');
  const copyBtn        = document.getElementById('copy-btn');
  const injectRawBtn   = document.getElementById('inject-raw-btn');
  const injectBtn      = document.getElementById('inject-btn');
  const clearBtn       = document.getElementById('clear-btn');
  const toast          = document.getElementById('toast');
  const toastText      = document.getElementById('toast-text');
  const loadingSection = document.getElementById('loading-section');

  let generatedPrompt = '';
  let isForging = false;

  // ── Shared Inject Function ──
  async function injectTextToPage(text) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) { showToast('No active tab', true); return; }

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (text) => {
          // Target the specific Saveetha textarea first, then fallback
          const target = document.querySelector('textarea[name="message_text"]')
            || document.activeElement;

          function inject(el, val) {
            if (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && el.type === 'text')) {
              const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
                || Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
              if (setter) setter.call(el, val);
              else el.value = val;
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 300) + 'px';
              el.focus();
              return true;
            }
            if (el.isContentEditable) {
              el.textContent = val;
              el.dispatchEvent(new Event('input', { bubbles: true }));
              return true;
            }
            return false;
          }

          if (target && inject(target, text)) return true;
          const fb = document.querySelector('textarea, [contenteditable="true"]');
          return fb ? (fb.focus(), inject(fb, text)) : false;
        },
        args: [text]
      });
      showToast('Injected into page!');
    } catch { showToast('Could not inject — try the floating icon on Saveetha', true); }
  }

  // ── Character Counter ──
  questionInput.addEventListener('input', () => {
    questionCount.textContent = questionInput.value.length;
    questionInput.classList.remove('field__textarea--error');
  });

  // ── Ripple Effect ──
  function createRipple(event, button) {
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    const rect = button.getBoundingClientRect();
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - rect.left - radius}px`;
    circle.style.top = `${event.clientY - rect.top - radius}px`;
    circle.classList.add('ripple');
    const existing = button.querySelector('.ripple');
    if (existing) existing.remove();
    button.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
  }

  // ── Toast ──
  function showToast(message, isError = false) {
    toastText.textContent = message;
    toast.classList.remove('hidden', 'toast--error');
    if (isError) toast.classList.add('toast--error');
    toast.style.animation = 'none';
    toast.offsetHeight;
    toast.style.animation = '';
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.add('hidden'), 2500);
  }

  // ── Loading State ──
  function setLoading(loading) {
    isForging = loading;
    if (loading) {
      forgeBtn.disabled = true;
      forgeBtn.innerHTML = `
        <svg class="btn__icon" style="animation: spin 1s linear infinite;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
        Forging…
      `;
      loadingSection.classList.remove('hidden');
      outputSection.classList.add('hidden');
    } else {
      forgeBtn.disabled = false;
      forgeBtn.innerHTML = `
        <svg class="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        Forge Prompt
      `;
      loadingSection.classList.add('hidden');
    }
  }

  // ── Inject Raw Prompt ──
  injectRawBtn.addEventListener('click', (e) => {
    createRipple(e, injectRawBtn);
    const question = questionInput.value.trim();
    if (!question) {
      questionInput.classList.add('field__textarea--error', 'shake');
      questionInput.focus();
      showToast('Enter a question first!', true);
      setTimeout(() => questionInput.classList.remove('shake'), 400);
      return;
    }
    injectTextToPage(question);
  });

  // ── Forge Prompt ──
  forgeBtn.addEventListener('click', async (e) => {
    createRipple(e, forgeBtn);
    if (isForging) return;

    const question = questionInput.value.trim();
    if (!question) {
      questionInput.classList.add('field__textarea--error', 'shake');
      questionInput.focus();
      showToast('Enter a question first!', true);
      setTimeout(() => questionInput.classList.remove('shake'), 400);
      return;
    }

    setLoading(true);

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'forgePrompt',
        question: question
      });

      if (!response || !response.success) {
        throw new Error(response?.error || 'Failed to get response');
      }

      generatedPrompt = response.data.content;
      outputContent.textContent = generatedPrompt;
      charBadge.textContent = `${generatedPrompt.length} chars`;
      outputSection.classList.remove('hidden');
      outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      showToast('Prompt forged successfully!');
    } catch (err) {
      showToast(`Error: ${err.message.slice(0, 50)}`, true);
      console.error('ShadowKhan Error:', err);
    } finally {
      setLoading(false);
    }
  });

  // ── Copy ──
  copyBtn.addEventListener('click', async (e) => {
    createRipple(e, copyBtn);
    if (!generatedPrompt) return;
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      copyBtn.classList.add('btn--success');
      const orig = copyBtn.innerHTML;
      copyBtn.innerHTML = `<svg class="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Copied!`;
      showToast('Copied to clipboard!');
      setTimeout(() => { copyBtn.classList.remove('btn--success'); copyBtn.innerHTML = orig; }, 1800);
    } catch { showToast('Failed to copy', true); }
  });

  // ── Inject Forged Prompt ──
  injectBtn.addEventListener('click', (e) => {
    createRipple(e, injectBtn);
    if (!generatedPrompt) return;
    injectTextToPage(generatedPrompt);
  });

  // ── Clear ──
  clearBtn.addEventListener('click', (e) => {
    createRipple(e, clearBtn);
    questionInput.value = '';
    questionCount.textContent = '0';
    generatedPrompt = '';
    outputSection.classList.add('hidden');
    questionInput.classList.remove('field__textarea--error');
    questionInput.focus();
    showToast('Cleared!');
  });

  questionInput.focus();
});
