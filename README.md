# Prompt Perfect
What is PromptPerfect?
A Chrome extension that watches every text box on any webpage. When you type or paste a prompt, a small  ✦ Optimize button appears. Click it — your rough prompt is sent to Groq's AI API, rewritten into a cleaner version, and placed back into the same text box automatically.

<img width="459" height="658" alt="{1FE6F616-B387-4121-BA61-29F3FD2CB20D}" src="https://github.com/user-attachments/assets/b594dc83-76be-4622-bc98-cf87110425ee" />


<img width="1546" height="702" alt="{E48A1FF7-432B-4185-9736-995F3C85023D}" src="https://github.com/user-attachments/assets/d2f0e27e-67ae-4dd4-bc1b-e8da6e8981ad" />
Click on optimize button
<img width="1539" height="681" alt="{CC30E678-4DA1-4457-A6B3-57CD5E7443CD}" src="https://github.com/user-attachments/assets/9db77aeb-a1bf-45bc-96c0-bed68db06ce0" />


## The problem it solves
LLMs work best with clear, structured prompts. Most people write the way they think — casual, incomplete, with grammar issues or missing context. The AI then produces vague or off-target answers. PromptPerfect bridges that gap automatically.

## Tech stack
Manifest V3 Groq API (free) Llama 3.3 70B Zero backend Works on any site

## Every file explained
The extension has 6 files. Each plays a specific role — click any card to learn more.

### manifest.json
The ID card. Tells Chrome what the extension is, what permissions it needs, and which files do what.
Config
### background.js
The brain. Runs invisibly in the background, handles the Groq API call, returns the optimized prompt.
Service worker
### content.js
Injected into every webpage. Watches for text inputs, shows the button, replaces text after optimization.
Content script
### content.css
Styles the ✦ Optimize button and the toast notifications injected on pages.
Styles
### popup.html/js
The settings panel that opens when you click the extension icon. Saves your API key and preferences.
UI

## popup.html + popup.js — Settings UI
The small window that appears when you click the extension icon in Chrome's toolbar. It lets you:

Enter and save your Groq API key
Choose an optimization style (Clear, Technical, Simple, Detailed, Creative)
Choose a model (Llama 3.3 70B, Mixtral, Gemma 2, etc.)
Enable or disable the extension globally
Settings are saved with chrome.storage.sync — accessible from both the popup and the content script.
