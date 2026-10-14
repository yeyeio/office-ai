/**
 * Office AI Assistant - Taskpane Script
 * Supports Bring Your Own Key (BYOK) & Custom OpenAI-Compatible Endpoints
 */

// Preset Configurations
const PROVIDER_PRESETS = {
  xai: {
    endpoint: "https://api.x.ai/v1",
    model: "grok-2-latest",
    hint: "Dapatkan API Key di console.x.ai"
  },
  deepseek: {
    endpoint: "https://api.deepseek.com",
    model: "deepseek-chat",
    hint: "Dapatkan API Key di platform.deepseek.com"
  },
  openai: {
    endpoint: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    hint: "Dapatkan API Key di platform.openai.com"
  },
  groq: {
    endpoint: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
    hint: "Dapatkan API Key gratis di console.groq.com"
  },
  openrouter: {
    endpoint: "https://openrouter.ai/api/v1",
    model: "openai/gpt-4o-mini",
    hint: "Dapatkan API Key di openrouter.ai"
  },
  ollama: {
    endpoint: "http://localhost:11434/v1",
    model: "llama3.2",
    hint: "Pastikan Ollama sudah berjalan (`ollama run llama3.2`). API Key kosongkan saja."
  },
  lmstudio: {
    endpoint: "http://localhost:1234/v1",
    model: "local-model",
    hint: "Jalankan Local Server di LM Studio. API Key kosongkan saja."
  },
  custom: {
    endpoint: "",
    model: "",
    hint: "Endpoint apa pun yang mendukung format OpenAI `/chat/completions`"
  }
};

const DEFAULT_SYSTEM_PROMPT = `Anda adalah asisten editor dokumen profesional di Microsoft Word.
Tugas Anda menulis, menganalisis, merapikan, dan menyusun teks dokumen pengguna.
ATURAN UTAMA:
1. Respon Anda akan langsung dimasukkan ke dalam dokumen Microsoft Word.
2. JANGAN sertakan kalimat pembuka atau basa-basi (seperti "Tentu, ini hasilnya:", "Berikut adalah revisinya:", dll).
3. Berikan teks dokumen yang bersih, rapi, dan siap pakai.`;

// State
let isOfficeReady = typeof Word !== "undefined";
let chatHistory = [];
let isGenerating = false;
let currentTone = "professional";

const TONE_INSTRUCTIONS = {
  professional: "Gunakan gaya bahasa formal, baku, profesional, dan terstruktur rapi.",
  concise: "Gunakan gaya bahasa sangat ringkas, padat informasi, to-the-point, tanpa kata berlebihan.",
  academic: "Gunakan gaya bahasa akademik, ilmiah, analitis, dan objektif.",
  casual: "Gunakan gaya bahasa santai, alami, komunikatif, dan mudah dipahami."
};

const GROK_MODE_PROMPTS = {
  continue: "Lanjutkan penulisan dari bagian ini secara alami dan logis. Perluas pembahasannya dengan format penomoran/subbab yang konsisten dengan dokumen.",
  rewrite: "Tulis ulang teks berikut agar lebih tajam, jelas, koheren, dan hilangkan kalimat berbelit-belit.",
  normalize: "Periksa dan samakan format dokumen ini: pastikan gaya penomoran (numbering), poin-poin (bullet list), dan judul (headings) konsisten serta seragam.",
  draft: "Susun draf lengkap yang terstruktur rapi berdasarkan poin-poin atau ide kasar berikut.",
  factcheck: "Lakukan analisis kritis dan riset fakta terhadap teks berikut: periksa akurasi data atau klaim yang disebutkan."
};

// DOM Elements
const chatContainer = document.getElementById("chatContainer");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const statusBadge = document.getElementById("statusBadge");
const openSettingsBtn = document.getElementById("openSettingsBtn");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const newChatBtn = document.getElementById("newChatBtn");
const currentModelTag = document.getElementById("currentModelTag");
const settingsModal = document.getElementById("settingsModal");
const providerPreset = document.getElementById("providerPreset");
const apiEndpoint = document.getElementById("apiEndpoint");
const apiKey = document.getElementById("apiKey");
const toggleApiKeyBtn = document.getElementById("toggleApiKeyBtn");
const modelSelect = document.getElementById("modelSelect");
const scanModelsBtn = document.getElementById("scanModelsBtn");
const modelScanHint = document.getElementById("modelScanHint");
const modelName = document.getElementById("modelName");
const systemPrompt = document.getElementById("systemPrompt");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const testConnBtn = document.getElementById("testConnBtn");
const testResult = document.getElementById("testResult");

// Initialize Office.js
Office.onReady((info) => {
  const isWord = typeof Word !== "undefined" || (info && (info.host === Office.HostType.Word || info.host === "Word"));
  if (isWord) {
    isOfficeReady = true;
    updateStatus("Word Terhubung", "success");
  } else {
    updateStatus("Browser Mode", "warning");
    console.log("Running outside Word (preview/standalone mode)");
  }
});

// Load Settings from LocalStorage
function loadSettings() {
  const saved = localStorage.getItem("office_ai_settings");
  let activeModel = "grok-2-latest";
  let activeProvider = "xai";

  if (saved) {
    try {
      const cfg = JSON.parse(saved);
      providerPreset.value = cfg.provider || "xai";
      apiEndpoint.value = cfg.endpoint || PROVIDER_PRESETS.xai.endpoint;
      apiKey.value = cfg.key || "";
      modelName.value = cfg.model || PROVIDER_PRESETS.xai.model;
      systemPrompt.value = cfg.prompt || DEFAULT_SYSTEM_PROMPT;
      activeModel = modelName.value;
      activeProvider = providerPreset.value;
    } catch (e) {
      console.error("Error parsing saved settings", e);
    }
  } else {
    // Defaults to xAI Grok
    providerPreset.value = "xai";
    apiEndpoint.value = PROVIDER_PRESETS.xai.endpoint;
    apiKey.value = "";
    modelName.value = PROVIDER_PRESETS.xai.model;
    systemPrompt.value = DEFAULT_SYSTEM_PROMPT;
    activeModel = PROVIDER_PRESETS.xai.model;
  }

  if (currentModelTag) {
    currentModelTag.textContent = `${activeProvider} / ${activeModel}`;
  }
}

function saveSettings() {
  const cfg = {
    provider: providerPreset.value,
    endpoint: apiEndpoint.value.trim().replace(/\/+$/, ""),
    key: apiKey.value.trim(),
    model: modelName.value.trim(),
    prompt: systemPrompt.value.trim() || DEFAULT_SYSTEM_PROMPT
  };
  localStorage.setItem("office_ai_settings", JSON.stringify(cfg));
  settingsModal.style.display = "none";
  if (currentModelTag) {
    currentModelTag.textContent = `${cfg.provider} / ${cfg.model}`;
  }
  checkConfiguration();
}

function checkConfiguration() {
  const saved = localStorage.getItem("office_ai_settings");
  if (!saved) {
    updateStatus("Konfigurasi API ⚙️", "warning");
    return false;
  }
  const cfg = JSON.parse(saved);
  if (!cfg.endpoint || !cfg.model) {
    updateStatus("Endpoint Kosong", "warning");
    return false;
  }
  if (!cfg.key && !cfg.endpoint.includes("localhost") && !cfg.endpoint.includes("127.0.0.1")) {
    updateStatus("Key Belum Diisi", "warning");
    return false;
  }
  updateStatus("Siap", "success");
  return true;
}

function updateStatus(text, type = "success") {
  statusBadge.textContent = text;
  statusBadge.className = `status-badge ${type === "warning" ? "warning" : ""}`;
}

// Preset Change Event
providerPreset.addEventListener("change", (e) => {
  const selected = e.target.value;
  if (PROVIDER_PRESETS[selected]) {
    const p = PROVIDER_PRESETS[selected];
    if (p.endpoint) apiEndpoint.value = p.endpoint;
    if (p.model) modelName.value = p.model;
  }
});

// Toggle API Key Visibility
toggleApiKeyBtn.addEventListener("click", () => {
  apiKey.type = apiKey.type === "password" ? "text" : "password";
});

// Modal Events
openSettingsBtn.addEventListener("click", () => {
  loadSettings();
  testResult.style.display = "none";
  settingsModal.style.display = "flex";
});

closeSettingsBtn.addEventListener("click", () => {
  settingsModal.style.display = "none";
});

saveSettingsBtn.addEventListener("click", saveSettings);

// Scan Models from Endpoint
async function scanModels() {
  const endpoint = apiEndpoint.value.trim().replace(/\/+$/, "");
  const key = apiKey.value.trim();

  if (!endpoint) {
    modelScanHint.innerHTML = `<span style="color: var(--danger)">⚠️ Masukkan API Base URL terlebih dahulu.</span>`;
    return;
  }

  scanModelsBtn.disabled = true;
  scanModelsBtn.textContent = "⏳ Memindai...";
  modelScanHint.innerHTML = `<span>Menghubungi <code>${endpoint}/models</code>...</span>`;

  try {
    const headers = { "Content-Type": "application/json" };
    if (key) headers["Authorization"] = `Bearer ${key}`;

    let url = `${endpoint}/models`;
    let res = await fetch(url, { method: "GET", headers }).catch(() => null);

    // Fallback for native Ollama /api/tags if needed
    if (!res || !res.ok) {
      if (endpoint.includes("11434")) {
        const ollamaBase = endpoint.replace(/\/v1\/?$/, "");
        const fallbackRes = await fetch(`${ollamaBase}/api/tags`).catch(() => null);
        if (fallbackRes && fallbackRes.ok) res = fallbackRes;
      }
    }

    if (!res || !res.ok) {
      throw new Error(res ? `HTTP ${res.status}: ${res.statusText}` : "Koneksi gagal atau terhalang CORS");
    }

    const data = await res.json();
    let modelsList = [];

    if (Array.isArray(data.data)) {
      modelsList = data.data.map(m => m.id || m.name).filter(Boolean);
    } else if (Array.isArray(data.models)) {
      modelsList = data.models.map(m => m.name || m.model || m.id).filter(Boolean);
    } else if (Array.isArray(data)) {
      modelsList = data.map(m => (typeof m === "string" ? m : m.id || m.name)).filter(Boolean);
    }

    if (modelsList.length === 0) {
      throw new Error("Tidak ada model ditemukan di endpoint ini.");
    }

    // Sort alphabetically
    modelsList.sort((a, b) => a.localeCompare(b));

    // Populate dropdown
    modelSelect.innerHTML = `<option value="">-- Pilih Model Terdeteksi (${modelsList.length} model) --</option>`;
    modelsList.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m;
      if (m === modelName.value.trim()) {
        opt.selected = true;
      }
      modelSelect.appendChild(opt);
    });

    if (!modelName.value.trim() && modelsList.length > 0) {
      modelName.value = modelsList[0];
      modelSelect.value = modelsList[0];
    } else if (modelsList.includes(modelName.value.trim())) {
      modelSelect.value = modelName.value.trim();
    }

    modelScanHint.innerHTML = `<span style="color: var(--success)">✅ Ditemukan <b>${modelsList.length} model</b>! Silakan pilih dari dropdown di atas.</span>`;
  } catch (err) {
    modelScanHint.innerHTML = `<span style="color: var(--danger)">❌ Gagal scan model: ${err.message}. (Anda tetap bisa ketik manual nama model di bawah).</span>`;
  } finally {
    scanModelsBtn.disabled = false;
    scanModelsBtn.textContent = "🔄 Scan Model dari Endpoint";
  }
}

// Model dropdown change
modelSelect.addEventListener("change", () => {
  if (modelSelect.value) {
    modelName.value = modelSelect.value;
  }
});

scanModelsBtn.addEventListener("click", scanModels);

// Test Connection
testConnBtn.addEventListener("click", async () => {
  testResult.style.display = "block";
  testResult.className = "test-result-box";
  testResult.textContent = "Menguji koneksi ke endpoint...";

  const endpoint = apiEndpoint.value.trim().replace(/\/+$/, "");
  const key = apiKey.value.trim();
  const model = modelName.value.trim();

  try {
    const url = `${endpoint}/chat/completions`;
    const headers = { "Content-Type": "application/json" };
    if (key) headers["Authorization"] = `Bearer ${key}`;

    const res = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 5
      })
    });

    if (res.ok) {
      testResult.className = "test-result-box success";
      testResult.textContent = `✅ Berhasil terkoneksi dengan model ${model}!`;
    } else {
      const errData = await res.json().catch(() => ({}));
      testResult.className = "test-result-box error";
      testResult.textContent = `❌ Gagal (${res.status}): ${errData.error?.message || res.statusText}`;
    }
  } catch (err) {
    testResult.className = "test-result-box error";
    testResult.textContent = `❌ Kesalahan jaringan / CORS: ${err.message}`;
  }
});

// Toast Notification
function showToast(message, type = "success") {
  const existing = document.querySelector(".toast-notice");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `toast-notice ${type === "error" ? "error" : ""}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s";
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

// Office.js Document Interactions
async function getSelectedDocumentText() {
  if (typeof Word === "undefined") return "";
  return new Promise((resolve) => {
    Word.run(async (context) => {
      const selection = context.document.getSelection();
      selection.load("text");
      await context.sync();
      resolve(selection.text.trim());
    }).catch((err) => {
      console.warn("Gagal membaca selection:", err);
      resolve("");
    });
  });
}

async function getFullDocumentText() {
  if (typeof Word === "undefined") return "";
  return new Promise((resolve) => {
    Word.run(async (context) => {
      const body = context.document.body;
      body.load("text");
      await context.sync();
      resolve(body.text.trim());
    }).catch((err) => {
      console.warn("Gagal membaca dokumen:", err);
      resolve("");
    });
  });
}

// Helper to format content as HTML or Text in Word
function insertFormattedContent(range, markdownText, location) {
  let html = "";
  if (typeof marked !== "undefined") {
    html = marked.parse(markdownText);
  } else {
    html = `<p>${markdownText.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>`;
  }

  try {
    range.insertHtml(html, location);
  } catch (e) {
    console.warn("insertHtml gagal, fallback ke insertText:", e);
    range.insertText(markdownText, location);
  }
}

async function replaceSelectionInDocument(text) {
  if (typeof Word === "undefined") {
    showToast("⚠️ Buka di dalam Word untuk mengedit dokumen.", "error");
    return;
  }
  return Word.run(async (context) => {
    const selection = context.document.getSelection();
    selection.load("text");
    await context.sync();

    // Jika tidak ada teks yang diblok (hanya kursor aktif), AMAN: sisipkan setelah kursor!
    if (!selection.text || selection.text.trim().length === 0) {
      insertFormattedContent(selection, text, Word.InsertLocation.after);
      await context.sync();
      showToast("✅ Teks diteruskan di kursor (gambar & format utuh)!");
    } else {
      insertFormattedContent(selection, text, Word.InsertLocation.replace);
      await context.sync();
      showToast("✅ Teks yang diblok berhasil diperbarui!");
    }
  }).catch((err) => {
    console.error("Gagal edit dokumen:", err);
    showToast("❌ Gagal edit: " + err.message, "error");
  });
}

async function insertAtCursorInDocument(text) {
  if (typeof Word === "undefined") {
    showToast("⚠️ Buka di dalam Word untuk menyisipkan teks.", "error");
    return;
  }
  return Word.run(async (context) => {
    const selection = context.document.getSelection();
    // Teruskan setelah kursor/posisi saat ini: format dan gambar sebelumnya tetap utuh!
    insertFormattedContent(selection, text, Word.InsertLocation.after);
    await context.sync();
    showToast("✅ Berhasil meneruskan tulisan (gambar & format utuh)!");
  }).catch((err) => {
    // Fallback: teruskan di akhir dokumen
    return Word.run(async (context) => {
      insertFormattedContent(context.document.body, text, Word.InsertLocation.end);
      await context.sync();
      showToast("✅ Diteruskan di akhir dokumen!");
    }).catch((e) => {
      showToast("❌ Gagal menyisipkan teks: " + e.message, "error");
    });
  });
}

async function appendToDocumentEnd(text) {
  if (typeof Word === "undefined") return;
  return Word.run(async (context) => {
    insertFormattedContent(context.document.body, text, Word.InsertLocation.end);
    await context.sync();
    showToast("✅ Teks ditambahkan di akhir dokumen!");
  }).catch((err) => {
    showToast("❌ Gagal menambah di akhir: " + err.message, "error");
  });
}

async function replaceEntireDocument(text) {
  if (typeof Word === "undefined") {
    showToast("⚠️ Buka di dalam Word untuk memperbarui dokumen.", "error");
    return;
  }
  if (!confirm("⚠️ Peringatan: Tindakan ini akan menghapus dan menimpa SELURUH dokumen (termasuk gambar yang ada). Lanjutkan?")) {
    return;
  }
  return Word.run(async (context) => {
    const body = context.document.body;
    insertFormattedContent(body, text, Word.InsertLocation.replace);
    await context.sync();
    showToast("✅ Seluruh isi dokumen diganti!");
  }).catch((err) => {
    showToast("❌ Gagal mengganti dokumen: " + err.message, "error");
  });
}

// Chat UI Rendering
function appendMessage(role, content, actions = false) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `grok-message ${role}`;

  const authorTag = document.createElement("div");
  authorTag.className = "msg-author-tag";
  
  if (role === "user") {
    authorTag.innerHTML = `
      <span class="author-name">Anda</span>
      <span class="author-avatar">👤</span>
    `;
  } else {
    authorTag.innerHTML = `
      <span class="author-avatar">//</span>
      <span class="author-name">Grok Word Agent</span>
    `;
  }

  const contentDiv = document.createElement("div");
  contentDiv.className = "msg-body";

  if (typeof marked !== "undefined" && role === "assistant") {
    contentDiv.innerHTML = marked.parse(content);
  } else {
    contentDiv.textContent = content;
  }

  // Add OpenUI Action Toolbar if assistant
  if (role === "assistant" && actions) {
    const actionsBar = document.createElement("div");
    actionsBar.className = "ai-actions-bar";

    const insertBtn = document.createElement("button");
    insertBtn.className = "doc-action-btn primary";
    insertBtn.innerHTML = "➕ Teruskan di Kursor";
    insertBtn.title = "Lanjutkan atau sisipkan tepat di kursor (gambar & teks aman)";
    insertBtn.onclick = () => insertAtCursorInDocument(content);

    const replaceBtn = document.createElement("button");
    replaceBtn.className = "doc-action-btn";
    replaceBtn.innerHTML = "✍️ Ganti Teks Diblok";
    replaceBtn.title = "Ganti hanya teks yang diblok dengan hasil ini";
    replaceBtn.onclick = () => replaceSelectionInDocument(content);

    const appendDocBtn = document.createElement("button");
    appendDocBtn.className = "doc-action-btn";
    appendDocBtn.innerHTML = "📥 Tambah di Akhir";
    appendDocBtn.title = "Tambahkan di akhir dokumen";
    appendDocBtn.onclick = () => appendToDocumentEnd(content);

    const copyBtn = document.createElement("button");
    copyBtn.className = "doc-action-btn";
    copyBtn.innerHTML = "📋 Salin";
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(content);
      copyBtn.innerHTML = "✅ Disalin";
      setTimeout(() => (copyBtn.innerHTML = "📋 Salin"), 2000);
    };

    actionsBar.appendChild(insertBtn);
    actionsBar.appendChild(replaceBtn);
    actionsBar.appendChild(appendDocBtn);
    actionsBar.appendChild(copyBtn);
    contentDiv.appendChild(actionsBar);
  }

  msgDiv.appendChild(authorTag);
  msgDiv.appendChild(contentDiv);
  chatContainer.appendChild(msgDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  return contentDiv;
}

// Send Message Handler
async function sendMessage(overridePrompt = null) {
  if (isGenerating) return;

  const promptText = overridePrompt || userInput.value.trim();
  if (!promptText) return;

  if (!checkConfiguration()) {
    settingsModal.style.display = "flex";
    return;
  }

  const saved = JSON.parse(localStorage.getItem("office_ai_settings"));
  const contextScope = document.querySelector('input[name="contextScope"]:checked').value;

  let contextText = "";
  if (contextScope === "selection") {
    contextText = await getSelectedDocumentText();
  } else if (contextScope === "document") {
    contextText = await getFullDocumentText();
  }

  // Include Tone Guidance
  const toneInstruction = TONE_INSTRUCTIONS[currentTone] || "";
  let fullUserMessage = promptText;
  if (contextText) {
    fullUserMessage = `${promptText}\n[Gaya Penulisan: ${toneInstruction}]\n\n--- KONTEKS DOKUMEN (${contextScope.toUpperCase()}) ---\n${contextText}\n--- AKHIR KONTEKS ---`;
  } else {
    fullUserMessage = `${promptText}\n[Gaya Penulisan: ${toneInstruction}]`;
  }

  appendMessage("user", promptText);
  if (!overridePrompt) userInput.value = "";
  userInput.style.height = "auto";

  // Create Assistant Message Placeholder
  isGenerating = true;
  sendBtn.disabled = true;
  const assistantMsgContent = appendMessage("assistant", "Memproses instruksi...", false);

  chatHistory.push({ role: "user", content: fullUserMessage });

  try {
    const endpoint = saved.endpoint;
    const url = `${endpoint}/chat/completions`;
    const headers = { "Content-Type": "application/json" };
    if (saved.key) headers["Authorization"] = `Bearer ${saved.key}`;

    const messages = [
      { role: "system", content: saved.prompt || DEFAULT_SYSTEM_PROMPT },
      ...chatHistory.slice(-8) // keep recent context
    ];

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        model: saved.model,
        messages: messages,
        temperature: 0.7,
        stream: true
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${response.status} ${response.statusText}`);
    }

    // Handle Streaming Response
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let accumulatedText = "";

    assistantMsgContent.innerHTML = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data: ")) {
          const dataStr = trimmed.slice(6);
          if (dataStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta?.content || "";
            accumulatedText += delta;
            if (typeof marked !== "undefined") {
              assistantMsgContent.innerHTML = marked.parse(accumulatedText);
            } else {
              assistantMsgContent.textContent = accumulatedText;
            }
            chatContainer.scrollTop = chatContainer.scrollHeight;
          } catch (e) {
            // partial JSON or keepalive
          }
        }
      }
    }

    // Fallback if not streamed or empty
    if (!accumulatedText) {
      accumulatedText = "Selesai (tidak ada respon teks).";
      assistantMsgContent.textContent = accumulatedText;
    }

    chatHistory.push({ role: "assistant", content: accumulatedText });

    // OpenUI Action Buttons attached to message
    const actionsBar = document.createElement("div");
    actionsBar.className = "ai-actions-bar";

    const insertBtn = document.createElement("button");
    insertBtn.className = "doc-action-btn primary";
    insertBtn.innerHTML = "➕ Teruskan di Kursor";
    insertBtn.title = "Lanjutkan atau sisipkan tepat di kursor (gambar & teks aman)";
    insertBtn.onclick = () => insertAtCursorInDocument(accumulatedText);

    const replaceBtn = document.createElement("button");
    replaceBtn.className = "doc-action-btn";
    replaceBtn.innerHTML = "✍️ Ganti Teks Diblok";
    replaceBtn.title = "Ganti hanya teks yang diblok dengan hasil ini";
    replaceBtn.onclick = () => replaceSelectionInDocument(accumulatedText);

    const appendDocBtn = document.createElement("button");
    appendDocBtn.className = "doc-action-btn";
    appendDocBtn.innerHTML = "📥 Tambah di Akhir";
    appendDocBtn.title = "Tambahkan di akhir dokumen tanpa mengubah gambar/teks yang sudah ada";
    appendDocBtn.onclick = () => appendToDocumentEnd(accumulatedText);

    const copyBtn = document.createElement("button");
    copyBtn.className = "doc-action-btn";
    copyBtn.innerHTML = "📋 Salin";
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(accumulatedText);
      copyBtn.innerHTML = "✅ Disalin";
      setTimeout(() => (copyBtn.innerHTML = "📋 Salin"), 2000);
    };

    actionsBar.appendChild(insertBtn);
    actionsBar.appendChild(replaceBtn);
    actionsBar.appendChild(appendDocBtn);
    actionsBar.appendChild(copyBtn);
    assistantMsgContent.appendChild(actionsBar);

    // Auto-Apply to Word document safely
    const autoApply = document.getElementById("autoApplyToggle")?.checked;
    const docAction = document.getElementById("docActionSelect")?.value || "insertCursor";

    if (autoApply && accumulatedText) {
      if (docAction === "replaceSelection") {
        await replaceSelectionInDocument(accumulatedText);
      } else if (docAction === "appendEnd") {
        await appendToDocumentEnd(accumulatedText);
      } else {
        // DEFAULT: Teruskan di posisi kursor (Gambar, format, dan teks yang sudah ada tetap 100% aman dan utuh!)
        await insertAtCursorInDocument(accumulatedText);
      }
    }

  } catch (err) {
    assistantMsgContent.innerHTML = `<span style="color: var(--danger)">❌ Gagal: ${err.message}</span>`;
  } finally {
    isGenerating = false;
    sendBtn.disabled = false;
  }
}

// Tone Selector Chips Event
document.querySelectorAll(".tone-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".tone-chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    currentTone = chip.getAttribute("data-tone") || "professional";
    showToast(`Nada: ${chip.textContent}`);
  });
});

// Grok Fast Modes
document.querySelectorAll(".grok-mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.getAttribute("data-mode");
    const prompt = GROK_MODE_PROMPTS[mode] || "Lanjutkan penulisan";
    sendMessage(prompt);
  });
});

// Welcome Grid Feature Cards
document.querySelectorAll(".feat-box").forEach((box) => {
  box.addEventListener("click", () => {
    const action = box.getAttribute("data-action");
    if (GROK_MODE_PROMPTS[action]) {
      sendMessage(GROK_MODE_PROMPTS[action]);
    }
  });
});

// New Chat Button
if (newChatBtn) {
  newChatBtn.addEventListener("click", () => {
    chatHistory = [];
    chatContainer.innerHTML = `
      <div class="grok-message assistant welcome-card">
        <div class="msg-author-tag">
          <span class="author-avatar">//</span>
          <span class="author-name">Grok Word Agent</span>
        </div>
        <div class="msg-body">
          <p><strong>Percakapan baru dimulai.</strong></p>
          <p class="grok-hint-text">Grok membaca konteks dan otomatis menulis di kursor tanpa merusak gambar atau format yang ada.</p>
        </div>
      </div>
    `;
    showToast("Percakapan baru dimulai");
  });
}

// Input Auto-expand & Enter to send
userInput.addEventListener("input", () => {
  userInput.style.height = "auto";
  userInput.style.height = `${Math.min(userInput.scrollHeight, 120)}px`;
});

userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendBtn.addEventListener("click", () => sendMessage());

// Initial Setup
loadSettings();
checkConfiguration();
