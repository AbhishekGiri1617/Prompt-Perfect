// Background Service Worker
// Handles API calls to Groq for prompt optimization (Free tier available!)

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "OPTIMIZE_PROMPT") {
    optimizePrompt(message.prompt, message.apiKey, message.tone, message.model)
      .then(result => sendResponse({ success: true, optimized: result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep message channel open for async
  }
});

async function optimizePrompt(prompt, apiKey, tone = "clear", model = "llama-3.3-70b-versatile") {
  if (!apiKey) {
    throw new Error("No API key set. Please add your Groq API key in the extension settings.");
  }

  const toneInstructions = {
    clear: "Make it clear, specific, and well-structured.",
    technical: "Use precise technical language suitable for expert-level responses.",
    simple: "Keep it simple and easy to understand, suitable for straightforward answers.",
    detailed: "Add context and detail to get comprehensive, thorough responses.",
    creative: "Frame it to encourage creative and imaginative responses."
  };
  

 const systemPrompt = `You are a prompt optimization expert. Your job is to rewrite user prompts to be clearer, more specific, and more effective for AI language models.

Rules:
- Preserve the original intent and meaning completely
- Fix grammar, spelling, and unclear phrasing
- Add context where helpful
- Structure complex requests with clear steps if needed
- ${toneInstructions[tone] || toneInstructions.clear}
- Do NOT add unnecessary fluff or padding
- Do NOT change what the user is asking for
- Do not add unnecessary "-" or "--" in the prompt or "*"
- Return ONLY the optimized prompt, nothing else — no explanations, no "Here is your optimized prompt:", just the prompt itself`;

  // Groq uses OpenAI-compatible API
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 1024,
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Optimize this prompt:\n\n${prompt}` }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 401) throw new Error("Invalid API key. Please check your Groq key.");
    if (response.status === 429) throw new Error("Rate limit hit. Please wait a moment and try again.");
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || prompt;
}
