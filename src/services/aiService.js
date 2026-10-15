/**
 * AI Service for OpenAI-Compatible LLM Endpoints (BYOK)
 * Handles streaming completions, model scanning, connection tests, and prompt augmentation.
 */

export const PROVIDER_PRESETS = {
  xai: {
    name: "xAI Grok",
    endpoint: "https://api.x.ai/v1",
    model: "grok-2-latest",
    hint: "Dapatkan API Key di console.x.ai"
  },
  deepseek: {
    name: "DeepSeek AI",
    endpoint: "https://api.deepseek.com",
    model: "deepseek-chat",
    hint: "Dapatkan API Key di platform.deepseek.com"
  },
  openai: {
    name: "OpenAI Official",
    endpoint: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    hint: "Dapatkan API Key di platform.openai.com"
  },
  groq: {
    name: "Groq Cloud",
    endpoint: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
    hint: "Super cepat dan hemat. API key di console.groq.com"
  },
  openrouter: {
    name: "OpenRouter",
    endpoint: "https://openrouter.ai/api/v1",
    model: "openai/gpt-4o-mini",
    hint: "Akses ratusan model sekaligus di openrouter.ai"
  },
  ollama: {
    name: "Ollama (Lokal / Offline)",
    endpoint: "http://localhost:11434/v1",
    model: "llama3.2",
    hint: "Pastikan Ollama aktif ('ollama run llama3.2'). API Key kosongkan saja."
  },
  lmstudio: {
    name: "LM Studio (Lokal)",
    endpoint: "http://localhost:1234/v1",
    model: "local-model",
    hint: "Jalankan Local Server di LM Studio. API Key kosongkan saja."
  },
  custom: {
    name: "Custom Endpoint",
    endpoint: "",
    model: "",
    hint: "Endpoint apa pun yang kompatibel dengan format OpenAI /chat/completions"
  }
};

export const DEFAULT_SYSTEM_PROMPT = `Anda adalah asisten editor dokumen profesional di Microsoft Word yang didukung oleh OpenUI design system.
Tugas Anda adalah menulis, menganalisis, merapikan, memperbaiki, dan menyusun teks dokumen pengguna.
ATURAN UTAMA:
1. Respon Anda akan langsung dimasukkan atau diterapkan ke dalam dokumen Microsoft Word.
2. JANGAN sertakan kalimat pembuka atau basa-basi (seperti "Tentu, ini hasilnya:", "Berikut adalah revisinya:", dll).
3. Berikan teks dokumen yang bersih, rapi, terstruktur secara logis, dan langsung siap pakai.`;

export const TONES = [
  { id: "professional", label: "Formal", instruction: "Gunakan gaya bahasa formal, baku, profesional, dan terstruktur rapi." },
  { id: "concise", label: "Ringkas", instruction: "Gunakan gaya bahasa sangat ringkas, padat informasi, to-the-point, tanpa kata berlebihan." },
  { id: "academic", label: "Akademik", instruction: "Gunakan gaya bahasa akademik, ilmiah, analitis, dan objektif dengan terminologi tepat." },
  { id: "casual", label: "Santai", instruction: "Gunakan gaya bahasa santai, alami, komunikatif, dan mudah dipahami." }
];

export const QUICK_MODES = [
  {
    id: "continue",
    icon: "Rocket",
    label: "Continue",
    desc: "Lanjutkan penulisan dari kursor",
    prompt: "Lanjutkan penulisan dari bagian ini secara alami dan logis. Perluas pembahasannya dengan format penomoran/subbab yang konsisten dengan dokumen."
  },
  {
    id: "rewrite",
    icon: "RefreshCw",
    label: "Rewrite",
    desc: "Tulis ulang lebih tajam & rapi",
    prompt: "Tulis ulang teks berikut agar lebih tajam, jelas, koheren, dan hilangkan kalimat berbelit-belit."
  },
  {
    id: "normalize",
    icon: "Ruler",
    label: "Normalize",
    desc: "Samakan format, penomoran & gaya",
    prompt: "Periksa dan samakan format dokumen ini: pastikan gaya penomoran (numbering), poin-poin (bullet list), dan judul (headings) konsisten serta seragam."
  },
  {
    id: "draft",
    icon: "FileEdit",
    label: "Draft",
    desc: "Susun draf dari outline/poin kasar",
    prompt: "Susun draf lengkap yang terstruktur rapi berdasarkan poin-poin atau ide kasar berikut."
  },
  {
    id: "research",
    icon: "Search",
    label: "Research",
    desc: "Riset fakta & validasi klaim data",
    prompt: "Lakukan analisis kritis dan riset fakta terhadap teks berikut: periksa akurasi data atau klaim yang disebutkan."
  },
  {
    id: "grammar",
    icon: "CheckCheck",
    label: "Grammar",
    desc: "Perbaiki ejaan, tata bahasa & typo",
    prompt: "Koreksi ejaan, tata bahasa, tanda baca, dan keefektifan kalimat tanpa mengubah arti dan substansi teks."
  },
  {
    id: "summarize",
    icon: "AlignLeft",
    label: "Ringkas",
    desc: "Ringkasan eksekutif poin utama",
    prompt: "Buat ringkasan eksekutif yang padat, mencakup poin-poin kunci dan kesimpulan utama."
  }
];

/**
 * Scans available models from endpoint
 */
export async function scanModelsFromEndpoint(rawEndpoint, apiKey) {
  const endpoint = rawEndpoint.trim().replace(/\/+$/, "");
  if (!endpoint) {
    throw new Error("Masukkan API Base URL terlebih dahulu.");
  }

  const headers = { "Content-Type": "application/json" };
  if (apiKey && apiKey.trim()) {
    headers["Authorization"] = `Bearer ${apiKey.trim()}`;
  }

  let res = null;
  // Standard OpenAI models endpoint
  try {
    res = await fetch(`${endpoint}/models`, { method: "GET", headers });
  } catch (err) {
    // Attempt fallback for Ollama native port
    if (endpoint.includes("11434")) {
      const ollamaBase = endpoint.replace(/\/v1\/?$/, "");
      res = await fetch(`${ollamaBase}/api/tags`).catch(() => null);
    } else {
      throw err;
    }
  }

  if (!res || !res.ok) {
    if (endpoint.includes("11434")) {
      const ollamaBase = endpoint.replace(/\/v1\/?$/, "");
      const fallback = await fetch(`${ollamaBase}/api/tags`).catch(() => null);
      if (fallback && fallback.ok) {
        res = fallback;
      }
    }
  }

  if (!res || !res.ok) {
    throw new Error(res ? `HTTP ${res.status}: ${res.statusText}` : "Gagal terhubung ke endpoint (periksa CORS / URL).");
  }

  const data = await res.json();
  let modelsList = [];

  if (Array.isArray(data.data)) {
    modelsList = data.data.map((m) => m.id || m.name).filter(Boolean);
  } else if (Array.isArray(data.models)) {
    modelsList = data.models.map((m) => m.name || m.model || m.id).filter(Boolean);
  } else if (Array.isArray(data)) {
    modelsList = data.map((m) => (typeof m === "string" ? m : m.id || m.name)).filter(Boolean);
  }

  if (modelsList.length === 0) {
    throw new Error("Tidak ada model yang dikembalikan oleh endpoint ini.");
  }

  modelsList.sort((a, b) => a.localeCompare(b));
  return modelsList;
}

/**
 * Tests connection to the endpoint with a minimal ping prompt
 */
export async function testConnection(rawEndpoint, apiKey, model) {
  const endpoint = rawEndpoint.trim().replace(/\/+$/, "");
  if (!endpoint) throw new Error("API Base URL belum diisi.");
  if (!model) throw new Error("Nama model belum diisi.");

  const url = `${endpoint}/chat/completions`;
  const headers = { "Content-Type": "application/json" };
  if (apiKey && apiKey.trim()) {
    headers["Authorization"] = `Bearer ${apiKey.trim()}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: model.trim(),
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 5
    })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `HTTP ${res.status}: ${res.statusText}`);
  }

  return true;
}

/**
 * Streams chat completions from OpenAI-compatible endpoint
 */
export async function streamChatCompletion({
  endpoint,
  apiKey,
  model,
  systemPrompt,
  chatHistory,
  userPrompt,
  contextText,
  contextScope,
  tone,
  signal,
  onChunk,
  onDone,
  onError
}) {
  const cleanEndpoint = endpoint.trim().replace(/\/+$/, "");
  const url = `${cleanEndpoint}/chat/completions`;

  const headers = { "Content-Type": "application/json" };
  if (apiKey && apiKey.trim()) {
    headers["Authorization"] = `Bearer ${apiKey.trim()}`;
  }

  const toneObj = TONES.find((t) => t.id === tone) || TONES[0];
  let augmentedUserPrompt = userPrompt;

  if (contextText && contextText.trim().length > 0) {
    augmentedUserPrompt = `${userPrompt}\n\n[Gaya Penulisan: ${toneObj.instruction}]\n\n--- KONTEKS DOKUMEN (${contextScope.toUpperCase()}) ---\n${contextText}\n--- AKHIR KONTEKS ---`;
  } else {
    augmentedUserPrompt = `${userPrompt}\n\n[Gaya Penulisan: ${toneObj.instruction}]`;
  }

  const messagesPayload = [
    { role: "system", content: systemPrompt || DEFAULT_SYSTEM_PROMPT },
    ...chatHistory.slice(-6).map((msg) => ({
      role: msg.role,
      content: msg.content
    })),
    { role: "user", content: augmentedUserPrompt }
  ];

  let accumulatedText = "";
  let reader = null;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      signal,
      body: JSON.stringify({
        model: model.trim(),
        messages: messagesPayload,
        temperature: 0.7,
        stream: true
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error("Browser / endpoint tidak mendukung streaming response.");
    }

    reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let lineBuffer = "";
    let isStreamDone = false;

    while (!isStreamDone) {
      const { done, value } = await reader.read();
      if (done) break;

      lineBuffer += decoder.decode(value, { stream: true });
      const lines = lineBuffer.split("\n");
      // Keep the last potentially incomplete line in the buffer
      lineBuffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data: ")) {
          const dataStr = trimmed.slice(6).trim();
          if (dataStr === "[DONE]") {
            isStreamDone = true;
            break;
          }
          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta?.content || "";
            if (delta) {
              accumulatedText += delta;
              onChunk(accumulatedText, delta);
            }
          } catch {
            // Keepalive or partial JSON chunk
          }
        }
      }
    }

    onDone(accumulatedText || "Selesai (tidak ada teks dihasilkan).");
  } catch (err) {
    if (signal && signal.aborted) {
      onDone(accumulatedText || "Generasi dihentikan oleh pengguna.");
    } else {
      onError(err);
    }
  } finally {
    if (reader) {
      try {
        reader.releaseLock();
      } catch {
        // ignore
      }
    }
  }
}
