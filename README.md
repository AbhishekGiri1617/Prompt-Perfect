### Prompt Perfect
What is PromptPerfect?
A Chrome extension that watches every text box on any webpage. When you type or paste a prompt, a small ✦ Optimize button appears. Click it — your rough prompt is sent to Groq's AI API, rewritten into a cleaner version, and placed back into the same text box automatically.

# The problem it solves
LLMs work best with clear, structured prompts. Most people write the way they think — casual, incomplete, with grammar issues or missing context. The AI then produces vague or off-target answers. PromptPerfect bridges that gap automatically.

# Tech stack
Manifest V3 Groq API (free) Llama 3.3 70B Zero backend Works on any site

## Every file explained
The extension has 6 files. Each plays a specific role — click any card to learn more.

# manifest.json
The ID card. Tells Chrome what the extension is, what permissions it needs, and which files do what.
Config
# background.js
The brain. Runs invisibly in the background, handles the Groq API call, returns the optimized prompt.
Service worker
# content.js
Injected into every webpage. Watches for text inputs, shows the button, replaces text after optimization.
Content script
# content.css
Styles the ✦ Optimize button and the toast notifications injected on pages.
Styles
# popup.html/js
The settings panel that opens when you click the extension icon. Saves your API key and preferences.
UI

# popup.html + popup.js — Settings UI
The small window that appears when you click the extension icon in Chrome's toolbar. It lets you:

Enter and save your Groq API key
Choose an optimization style (Clear, Technical, Simple, Detailed, Creative)
Choose a model (Llama 3.3 70B, Mixtral, Gemma 2, etc.)
Enable or disable the extension globally
Settings are saved with chrome.storage.sync — accessible from both the popup and the content script.
