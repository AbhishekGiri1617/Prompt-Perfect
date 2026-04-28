// PromptPerfect Content Script — Fixed

(function () {
  "use strict";

  // Prevent double injection
  if (window.__promptPerfectLoaded) return;
  window.__promptPerfectLoaded = true;

  let activeTarget = null;
  let floatingBtn = null;
  let isOptimizing = false;
  let hideTimer = null;
  let debounceTimer = null;

  // ── Create the floating button ──────────────────────────────────────────
  function createFloatingButton() {
    if (floatingBtn) return;

    floatingBtn = document.createElement("div");
    floatingBtn.id = "promptperfect-btn";
    floatingBtn.setAttribute("data-pp", "true");
    floatingBtn.innerHTML = `<span class="pp-icon">✦</span><span class="pp-text">Optimize</span>`;

    // Use mousedown instead of click — fires BEFORE focusout
    floatingBtn.addEventListener("mousedown", (e) => {
      e.preventDefault(); // Prevents the input from losing focus
      e.stopPropagation();
    });

    floatingBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleOptimize();
    });

    floatingBtn.addEventListener("mouseenter", () => {
      clearTimeout(hideTimer);
    });

    floatingBtn.addEventListener("mouseleave", () => {
      if (document.activeElement !== activeTarget) {
        scheduleHide();
      }
    });

    document.body.appendChild(floatingBtn);
  }

  // ── Position the button (fixed positioning) ─────────────────────────────
  function positionButton(target) {
    if (!floatingBtn || !target) return;

    const rect = target.getBoundingClientRect();
    const btnWidth = 115;
    const btnHeight = 34;
    const margin = 8;

    let top = rect.bottom - btnHeight - margin;
    let left = rect.right - btnWidth - margin;

    if (left < margin) left = margin;
    if (top < margin) top = margin;
    if (left + btnWidth > window.innerWidth - margin) left = window.innerWidth - btnWidth - margin;
    if (top + btnHeight > window.innerHeight - margin) top = window.innerHeight - btnHeight - margin;

    floatingBtn.style.top = `${top}px`;
    floatingBtn.style.left = `${left}px`;
    floatingBtn.style.display = "flex";
  }

  // ── Get text from the input ─────────────────────────────────────────────
  function getInputText(el) {
    if (!el) return "";
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") return el.value || "";
    if (el.isContentEditable || el.contentEditable === "true") return el.innerText || "";
    return "";
  }

  // ── Set text back into the input ────────────────────────────────────────
  function setInputText(el, text) {
    if (!el) return;
    el.focus();

    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
      const proto = el.tagName === "TEXTAREA"
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
      const nativeSetter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
      if (nativeSetter) nativeSetter.call(el, text);
      else el.value = text;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));

    } else if (el.isContentEditable || el.contentEditable === "true") {
      el.focus();
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      sel.removeAllRanges();
      sel.addRange(range);
      const inserted = document.execCommand("insertText", false, text);
      if (!inserted || el.innerText.trim() !== text.trim()) {
        el.innerText = text;
        const r = document.createRange();
        r.selectNodeContents(el);
        r.collapse(false);
        sel.removeAllRanges();
        sel.addRange(r);
      }
      el.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true }));
    }
  }

  // ── Main optimize handler ───────────────────────────────────────────────
  async function handleOptimize() {
    if (isOptimizing) return;

    const target = activeTarget;
    if (!target) {
      showToast("⚠ No active text field found", "warning");
      return;
    }

    const originalText = getInputText(target).trim();
    if (!originalText || originalText.length < 3) {
      showToast("Please type a prompt first!", "warning");
      return;
    }

    let settings;
    try {
      settings = await chrome.storage.sync.get(["apiKey", "tone", "model", "enabled"]);
    } catch (err) {
      showToast("Could not read settings: " + err.message, "error");
      return;
    }

    if (settings.enabled === false) {
      showToast("PromptPerfect is disabled — enable in popup", "warning");
      return;
    }

    if (!settings.apiKey) {
      showToast("⚙ Add your Groq API key in the extension popup", "warning");
      return;
    }

    isOptimizing = true;
    floatingBtn.classList.add("pp-loading");
    floatingBtn.querySelector(".pp-text").textContent = "Optimizing…";
    floatingBtn.style.display = "flex";

    try {
      const response = await chrome.runtime.sendMessage({
        type: "OPTIMIZE_PROMPT",
        prompt: originalText,
        apiKey: settings.apiKey,
        tone: settings.tone || "clear",
        model: settings.model || "llama-3.3-70b-versatile"
      });

      if (!response) throw new Error("No response — try reloading the page.");

      if (response.success) {
        setInputText(target, response.optimized);
        showToast("✦ Prompt optimized!", "success");
        floatingBtn.classList.add("pp-success");
        setTimeout(() => floatingBtn?.classList.remove("pp-success"), 2000);
      } else {
        showToast(response.error || "Optimization failed", "error");
      }
    } catch (err) {
      console.error("[PromptPerfect]", err);
      showToast("Error: " + err.message, "error");
    } finally {
      isOptimizing = false;
      if (floatingBtn) {
        floatingBtn.classList.remove("pp-loading");
        floatingBtn.querySelector(".pp-text").textContent = "Optimize";
      }
    }
  }

  // ── Toast ───────────────────────────────────────────────────────────────
  function showToast(message, type = "info") {
    const existing = document.querySelector("#pp-toast");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.id = "pp-toast";
    toast.className = `pp-toast pp-toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add("pp-toast-show")));
    setTimeout(() => {
      toast.classList.remove("pp-toast-show");
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  // ── Is this a text input? ───────────────────────────────────────────────
  function isTextInput(el) {
    if (!el || el.getAttribute?.("data-pp")) return false;
    const tag = el.tagName?.toUpperCase();
    if (tag === "TEXTAREA") return true;
    if (tag === "INPUT" && ["text", "search", ""].includes(el.type?.toLowerCase() || "")) return true;
    if (el.isContentEditable || el.contentEditable === "true") return true;
    return false;
  }

  // ── Show / hide ─────────────────────────────────────────────────────────
  function showForTarget(target) {
    clearTimeout(debounceTimer);
    clearTimeout(hideTimer);
    debounceTimer = setTimeout(() => {
      if (getInputText(target).trim().length > 0) {
        activeTarget = target;
        createFloatingButton();
        positionButton(target);
      } else {
        hideButton();
      }
    }, 200);
  }

  function scheduleHide(delay = 300) {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (!floatingBtn?.matches(":hover")) hideButton();
    }, delay);
  }

  function hideButton() {
    if (floatingBtn) floatingBtn.style.display = "none";
  }

  // ── Events ──────────────────────────────────────────────────────────────
  document.addEventListener("focusin", (e) => {
    if (isTextInput(e.target)) {
      clearTimeout(hideTimer);
      activeTarget = e.target;
      showForTarget(e.target);
    }
  }, true);

  document.addEventListener("focusout", (e) => {
    if (isTextInput(e.target)) scheduleHide(300);
  }, true);

  document.addEventListener("input", (e) => {
    if (isTextInput(e.target)) {
      activeTarget = e.target;
      showForTarget(e.target);
    }
  }, true);

  document.addEventListener("paste", (e) => {
    if (isTextInput(e.target)) {
      activeTarget = e.target;
      setTimeout(() => showForTarget(e.target), 100);
    }
  }, true);

  let rafId = null;
  const reposition = () => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      if (activeTarget && floatingBtn?.style.display !== "none") positionButton(activeTarget);
    });
  };
  window.addEventListener("scroll", reposition, { passive: true, capture: true });
  window.addEventListener("resize", reposition, { passive: true });

})();
