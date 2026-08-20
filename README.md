# ShadowKhan 🥷

**ShadowKhan** is a Chrome/Edge extension designed to act as an academic prompt enhancer. It intercepts a user's raw, simple questions and transforms them into powerful, well-structured discussion board prompts. It features a custom floating action button injected directly into target websites (e.g., Saveetha's Learner portal) to bypass clipboard constraints and inject AI-generated text seamlessly.

## ✨ Features

- **Prompt Forging:** Uses **Nvidia Nemotron 3 Ultra 550B (via OpenRouter)** to rewrite and structure raw questions into high-quality academic prompts.
- **Bypass Clipboard Blocks:** Injects text directly into the target `textarea` via JavaScript property setters, bypassing generic copy-paste blocks implemented by academic portals.
- **Floating Action Button (FAB):** Injects a sleek, glowing FAB onto `learner.saveetha.in` for quick access.
- **Dual Mode:** Choose to inject your raw text immediately, or have ShadowKhan forge it first for review.
- **Sleek UI:** Dark mode, glassmorphism aesthetics, neon glowing animations.

## 🚀 Installation (Developer Mode)

1. Clone or download this repository.
2. Open your browser and navigate to the Extensions page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked** and select the folder containing this extension (`shadowkhan`).

## ⚙️ Configuration (API Key Required)

To power the prompt forging, ShadowKhan uses the [OpenRouter API](https://openrouter.ai/). **You must provide your own API key.**

1. Open `background.js` in your text editor.
2. Locate line 9:
   ```javascript
   const API_KEY = 'YOUR_OPENROUTER_API_KEY_HERE';
   ```
3. Replace `'YOUR_OPENROUTER_API_KEY_HERE'` with your actual OpenRouter API key.
4. Go back to your Extensions page and click the **Reload** button on the ShadowKhan extension tile.

## 🛠️ Usage

### Via the Popup
- Click the ShadowKhan icon in your browser toolbar.
- Type your raw question.
- Click **Forge Prompt** to let Nvidia Nemotron enhance it, then click **Inject into Page** to insert it into the active tab.
- Or, click **Inject Raw** to skip the AI enhancement.

### Via the Floating Icon (Saveetha Learner Portal)
- Navigate to `https://learner.saveetha.in/`.
- Look for the purple glowing ShadowKhan icon in the bottom right.
- Click the icon to open the overlay.
- Type your question.
- Choose to **Inject Raw** or **Forge Prompt**.
- Once forged, review the enhanced prompt and click **Inject Forged** to automatically fill the text area and trigger input events!

## 📜 License

MIT License. See `LICENSE` for details.
