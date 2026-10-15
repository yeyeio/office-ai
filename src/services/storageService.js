/**
 * Storage Service for Office AI Assistant
 * Persists BYOK configuration, user preferences, and chat state in localStorage.
 */
import { PROVIDER_PRESETS, DEFAULT_SYSTEM_PROMPT } from "./aiService";

const SETTINGS_KEY = "office_ai_settings";
const UI_PREFS_KEY = "office_ai_ui_prefs";
const CHAT_HISTORY_KEY = "office_ai_chat_history";

export const DEFAULT_SETTINGS = {
  provider: "xai",
  endpoint: PROVIDER_PRESETS.xai.endpoint,
  key: "",
  model: PROVIDER_PRESETS.xai.model,
  prompt: DEFAULT_SYSTEM_PROMPT
};

export const DEFAULT_UI_PREFS = {
  theme: "dark", // 'dark' | 'light'
  contextScope: "selection", // 'selection' | 'document' | 'none'
  docAction: "insertCursor", // 'insertCursor' | 'replaceSelection' | 'appendEnd'
  autoApply: true,
  tone: "professional"
};

export function getStoredSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      provider: parsed.provider || DEFAULT_SETTINGS.provider,
      endpoint: parsed.endpoint || DEFAULT_SETTINGS.endpoint,
      key: parsed.key || "",
      model: parsed.model || DEFAULT_SETTINGS.model,
      prompt: parsed.prompt || DEFAULT_SETTINGS.prompt
    };
  } catch (e) {
    console.error("Error reading stored settings:", e);
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveStoredSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Error saving settings:", e);
  }
}

export function getStoredUIPrefs() {
  try {
    const raw = localStorage.getItem(UI_PREFS_KEY);
    if (!raw) return { ...DEFAULT_UI_PREFS };
    return { ...DEFAULT_UI_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_UI_PREFS };
  }
}

export function saveStoredUIPrefs(prefs) {
  try {
    localStorage.setItem(UI_PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error("Error saving UI prefs:", e);
  }
}

export function getStoredChatHistory() {
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredChatHistory(history) {
  try {
    // Keep up to 30 most recent messages to prevent storage overflow
    const slice = history.slice(-30);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(slice));
  } catch (e) {
    console.error("Error saving chat history:", e);
  }
}

export function clearStoredChatHistory() {
  try {
    localStorage.removeItem(CHAT_HISTORY_KEY);
  } catch (e) {
    console.error("Error clearing chat history:", e);
  }
}

/**
 * OpenUI Thread Storage implementation using localStorage.
 * Persists threads and chat turns across reload.
 */
export function createLocalStorageThreadStorage() {
  const THREADS_MAP_KEY = "openui_threads_store_v1";

  const getMap = () => {
    try {
      const raw = localStorage.getItem(THREADS_MAP_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const saveMap = (map) => {
    try {
      localStorage.setItem(THREADS_MAP_KEY, JSON.stringify(map));
    } catch (e) {
      console.error("Gagal menyimpan thread OpenUI:", e);
    }
  };

  return {
    listThreads: async () => {
      const map = getMap();
      const list = Object.values(map)
        .map((t) => ({
          id: t.id,
          title: t.title || "Percakapan",
          createdAt: t.createdAt || new Date().toISOString()
        }))
        .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
      return { threads: list };
    },

    createThread: async (firstMessage) => {
      const map = getMap();
      const id = "t_" + Date.now();
      const rawContent = typeof firstMessage.content === "string" ? firstMessage.content : "";
      const title = rawContent ? rawContent.slice(0, 36) : "Percakapan Baru";

      const thread = {
        id,
        title,
        createdAt: new Date().toISOString(),
        messages: [firstMessage]
      };
      map[id] = thread;
      saveMap(map);
      return thread;
    },

    getMessages: async (threadId) => {
      const map = getMap();
      return map[threadId]?.messages || [];
    },

    updateThread: async (thread) => {
      const map = getMap();
      if (map[thread.id]) {
        map[thread.id] = { ...map[thread.id], ...thread };
        saveMap(map);
      }
      return thread;
    },

    deleteThread: async (threadId) => {
      const map = getMap();
      delete map[threadId];
      saveMap(map);
    }
  };
}
