// ═══════════════════════════════════════════════════════════
// ShadowKhan — Background Service Worker
// Handles OpenRouter API calls from content script & popup
// ═══════════════════════════════════════════════════════════

// ┌──────────────────────────────────────────────────────┐
// │  ⚠️  PASTE YOUR OPENROUTER API KEY BELOW            │
// └──────────────────────────────────────────────────────┘
const API_KEY = 'YOUR_OPENROUTER_API_KEY_HERE';
const MODEL   = 'nvidia/nemotron-3-ultra-550b-a55b:free';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// System prompt — AI acts as a prompt enhancer, NOT an answerer
const SYSTEM_PROMPT = `You are ShadowKhan, an expert prompt engineer specializing in academic discussion-board prompts. Your job is to take a user's raw, simple prompt and transform it into a powerful, well-structured enhanced prompt.

When given a raw prompt, you MUST output an enhanced prompt that follows this EXACT structure:

---
You are a university discussion-board participant.

Question:
[Rewrite the user's raw question here — make it clearer, more specific, and academically precise while preserving the original intent]

Write a concise response that:
- Directly answers the question.
- Explains the reasoning with one relevant example.
- Adds one new insight beyond the existing post.
- Builds on the peer's idea instead of merely agreeing or repeating.
- Ends with a thoughtful question when appropriate.

Use a natural, professional academic tone. Keep it relevant and concise.
---

Rules:
1. Output ONLY the enhanced prompt. Nothing else — no explanations, no notes, no "Here is your enhanced prompt" labels.
2. Keep the user's original intent and topic intact — do NOT change the subject.
3. Make the question section clearer, more specific, and academically framed.
4. If the raw prompt is vague, add relevant academic context to sharpen it.
5. The output must be ready to copy-paste directly into an AI or discussion board.`;

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'forgePrompt') {
    handleForge(request.question)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep message channel open for async response
  }
});

async function handleForge(question) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://shadowkhan-extension.local',
      'X-Title': 'ShadowKhan Academic Prompt Enhancer'
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Raw prompt to enhance:\n\n${question.trim()}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 0.9
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${response.status}`);
  }

  const result = await response.json();
  const content = result?.choices?.[0]?.message?.content;

  if (!content) throw new Error('Empty response from LLM');

  return {
    content: content.trim(),
    model: result?.model || MODEL,
    usage: result?.usage || null
  };
}
