// PromptPerfect Popup Script — Groq Edition

const apiKeyInput = document.getElementById("apiKey");
const toneSelect = document.getElementById("tone");
const modelSelect = document.getElementById("model");
const saveBtn = document.getElementById("saveBtn");
const enabledToggle = document.getElementById("enabledToggle");
const toggleVisBtn = document.getElementById("toggleVisibility");
const statusBar = document.getElementById("statusBar");
const statusText = document.getElementById("statusText");

// Load saved settings
chrome.storage.sync.get(["apiKey", "tone", "model", "enabled"], (data) => {
  if (data.apiKey) {
    apiKeyInput.value = data.apiKey;
    setStatus("ok", "Ready — ✦ Optimize button active on text fields");
  }
  if (data.tone) toneSelect.value = data.tone;
  if (data.model) modelSelect.value = data.model;
  if (data.enabled !== undefined) enabledToggle.checked = data.enabled;
  else enabledToggle.checked = true;
});

// Toggle enabled state
enabledToggle.addEventListener("change", () => {
  chrome.storage.sync.set({ enabled: enabledToggle.checked });
  if (!enabledToggle.checked) {
    setStatus("warn", "Extension is disabled");
  } else {
    chrome.storage.sync.get(["apiKey"], (data) => {
      if (data.apiKey) {
        setStatus("ok", "Ready — ✦ Optimize button active on text fields");
      } else {
        setStatus("warn", "Groq API key required to activate");
      }
    });
  }
});

// Toggle password visibility
let visible = false;
toggleVisBtn.addEventListener("click", () => {
  visible = !visible;
  apiKeyInput.type = visible ? "text" : "password";
  toggleVisBtn.textContent = visible ? "🙈" : "👁";
});

// Save settings
saveBtn.addEventListener("click", async () => {
  const key = apiKeyInput.value.trim();
  const tone = toneSelect.value;
  const model = modelSelect.value;
  const enabled = enabledToggle.checked;

  if (!key) {
    setStatus("warn", "Please enter your Groq API key");
    apiKeyInput.focus();
    return;
  }

  if (!key.startsWith("gsk_")) {
    setStatus("warn", "Groq keys start with gsk_…");
    return;
  }

  await chrome.storage.sync.set({ apiKey: key, tone, model, enabled });

  // Visual feedback
  saveBtn.textContent = "✓ Saved!";
  saveBtn.classList.add("saved");
  setStatus("ok", "Ready — ✦ Optimize button active on text fields");

  setTimeout(() => {
    saveBtn.textContent = "Save Settings";
    saveBtn.classList.remove("saved");
  }, 2000);
});

// Enter key saves
apiKeyInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveBtn.click();
});

function setStatus(type, message) {
  statusBar.className = `status-bar ${type}`;
  statusText.textContent = message;
}
