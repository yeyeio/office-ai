import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  AgentInterface,
  openAIAdapter,
  MarkDownRenderer,
} from "@openuidev/react-ui";
import { generateSystemPrompt, Renderer } from "@openuidev/react-lang";

import { recipeLibrary } from "./lib/recipe-library";
import { STARTERS } from "./lib/starters";
import { executeGetRecipeProfile } from "./lib/tools/get-recipe-profile";

import {
  initOffice,
  insertAtCursorInDocument,
} from "./services/officeService";

import {
  getStoredSettings,
  saveStoredSettings,
  getStoredUIPrefs,
  saveStoredUIPrefs,
  createLocalStorageThreadStorage
} from "./services/storageService";

import { SettingsModal } from "./components/SettingsModal";
import { Toast } from "./components/Toast";

import { Settings, Sun, Moon } from "lucide-react";

function hasLangSyntax(content) {
  return !!content && (content.includes("```openui-lang") || /(^|\n)\s*root\s*=/.test(content));
}

const recipeInstructions = `
You are a practical recipe remix assistant.
Use web search before recommending recipes and include real source URLs.
Use image search to include a relevant recipe image when available.
For each recipe, set imageUrl to an HTTPS URL returned by image search when available.
Call get_recipe_profile when the user asks what they can cook from their pantry.
Use the profile's servings value for every recipe.
Return exactly three concise recipes and clearly label substitutions.
Render the final recipe recommendations using exactly one RecipeRemix component.
Do not return recipe recommendations as a prose-only response.
Never claim that a recipe is allergen-safe.

When producing openui-lang:
You MUST respond with openui-lang code defining the 'root' node using RecipeRemix:
root = RecipeRemix(
  recipes=[
    {
      title: "Recipe Title",
      time: "25 min",
      servings: 2,
      ingredients: ["ingredient 1", "ingredient 2"],
      sourceUrl: "https://example.com/recipe",
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500"
    }
  ]
)
`;

export function App() {
  const initialPrefs = getStoredUIPrefs();

  // Settings & Theme
  const [settings, setSettings] = useState(() => getStoredSettings());
  const [theme, setTheme] = useState(() => initialPrefs.theme || "dark");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Office Status
  const [officeStatus, setOfficeStatus] = useState({
    connected: false,
    host: "Loading",
    message: "Menghubungkan..."
  });

  // Toasts
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  // Theme synchronization
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  const handleToggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    saveStoredUIPrefs({ theme: nextTheme });
    showToast(`Tema ${nextTheme === "dark" ? "Gelap" : "Terang"} diaktifkan`, "info");
  };

  // Office.js Initialization
  useEffect(() => {
    initOffice((status) => {
      setOfficeStatus(status);
    });
  }, []);

  // Expose Word Insertion function to window for RecipeRemix component
  useEffect(() => {
    window.__insertRecipeToWord = async (recipe) => {
      const markdown = `## ${recipe.title}\n\n**Waktu:** ${recipe.time} | **Porsi:** ${recipe.servings}\n\n**Bahan-bahan:**\n${recipe.ingredients.map((ing) => `- ${ing}`).join("\n")}\n\n${recipe.sourceUrl ? `[Sumber Resep](${recipe.sourceUrl})` : ""}\n`;
      try {
        await insertAtCursorInDocument(markdown);
        showToast(`Resep "${recipe.title}" berhasil disisipkan ke Word!`);
      } catch (err) {
        showToast(err.message, "error");
      }
    };
    return () => {
      delete window.__insertRecipeToWord;
    };
  }, [showToast]);

  // OpenUI Thread Storage
  const storage = useMemo(() => {
    return {
      thread: createLocalStorageThreadStorage()
    };
  }, []);

  // System Prompt for Recipe Remix
  const systemPrompt = useMemo(() => {
    try {
      return generateSystemPrompt({
        library: recipeLibrary,
        instructions: recipeInstructions
      });
    } catch {
      return recipeInstructions;
    }
  }, []);

  // OpenUI LLM Adapter
  const llm = useMemo(() => {
    return {
      send: async ({ threadId, messages, signal }) => {
        if (!settings.endpoint || !settings.model) {
          setIsSettingsOpen(true);
          throw new Error("Lengkapi konfigurasi API di Pengaturan terlebih dahulu.");
        }

        const lastMsg = messages[messages.length - 1];
        const userPrompt = lastMsg?.content || "";

        let augmentedPrompt = userPrompt;
        if (
          userPrompt.toLowerCase().includes("pantry") ||
          userPrompt.toLowerCase().includes("already have") ||
          userPrompt.toLowerCase().includes("dinner")
        ) {
          const profile = await executeGetRecipeProfile();
          augmentedPrompt = `${userPrompt}\n\n[Cook Profile & Pantry Data]:\n${profile}`;
        }

        const messagesPayload = [
          { role: "system", content: settings.prompt || systemPrompt },
          ...messages.slice(0, -1).map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: typeof m.content === "string" ? m.content : JSON.stringify(m.content)
          })),
          { role: "user", content: augmentedPrompt }
        ];

        const cleanEndpoint = settings.endpoint.trim().replace(/\/+$/, "");
        const url = `${cleanEndpoint}/chat/completions`;
        const headers = { "Content-Type": "application/json" };
        if (settings.key && settings.key.trim()) {
          headers["Authorization"] = `Bearer ${settings.key.trim()}`;
        }

        const res = await fetch(url, {
          method: "POST",
          headers,
          signal,
          body: JSON.stringify({
            model: settings.model.trim(),
            messages: messagesPayload,
            temperature: 0.7,
            stream: true
          })
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || `HTTP ${res.status}: ${res.statusText}`);
        }

        return res;
      },
      streamProtocol: openAIAdapter()
    };
  }, [settings, systemPrompt]);

  // Custom AssistantMessage component supporting both OpenUI Lang GenUI and Markdown
  const customComponents = useMemo(() => {
    return {
      AssistantMessage: ({ message, isStreaming }) => {
        const content = typeof message.content === "string" ? message.content : "";
        const isLang = hasLangSyntax(content);

        if (isLang) {
          return (
            <div className="openui-agent-thread-message-assistant">
              <div className="openui-agent-thread-message-assistant__content">
                <Renderer
                  response={content}
                  library={recipeLibrary}
                  isStreaming={isStreaming}
                />
              </div>
            </div>
          );
        }

        return (
          <div className="openui-agent-thread-message-assistant">
            <div className="openui-agent-thread-message-assistant__content">
              {content ? (
                <MarkDownRenderer textMarkdown={content} />
              ) : (
                <span style={{ color: "var(--openui-text-neutral-secondary)", fontSize: "12px" }}>
                  Menghasilkan resep...
                </span>
              )}
            </div>
          </div>
        );
      }
    };
  }, []);

  return (
    <div style={{ height: "100vh", width: "100vw", overflow: "hidden", position: "relative" }}>
      <AgentInterface
        storage={storage}
        llm={llm}
        componentLibrary={recipeLibrary}
        components={customComponents}
        agentName="Recipe Remix"
        logoUrl="/assets/shiro-logo.svg"
        theme={{ mode: theme }}
        starters={STARTERS}
      >
        {/* OpenUI ThreadHeader Slot */}
        <AgentInterface.ThreadHeader>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {officeStatus.connected && (
              <span className="openui-top-status-pill" title="Microsoft Word Aktif">
                Word Terhubung
              </span>
            )}

            <button
              type="button"
              onClick={handleToggleTheme}
              className="openui-top-action-btn"
              title={theme === "dark" ? "Ganti ke Tema Terang" : "Ganti ke Tema Gelap"}
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
            </button>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="openui-top-action-btn"
              title="Pengaturan AI & BYOK"
              aria-label="Settings"
            >
              <Settings size={13} />
            </button>
          </div>
        </AgentInterface.ThreadHeader>

        {/* Exact OpenUI Welcome Screen from Quickstart */}
        <AgentInterface.Welcome
          title="Recipe Remix"
          description="Turn what you have into something delicious."
          glowAnimation
        />
      </AgentInterface>

      {/* BYOK Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(s) => {
          setSettings(s);
          saveStoredSettings(s);
        }}
        onShowToast={showToast}
      />

      {/* Toasts */}
      <Toast toasts={toasts} />
    </div>
  );
}
