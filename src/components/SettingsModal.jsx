import React, { useState, useEffect } from "react";
import {
  PROVIDER_PRESETS,
  scanModelsFromEndpoint,
  testConnection
} from "../services/aiService";
import {
  X,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Check
} from "lucide-react";

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onShowToast
}) {
  const [provider, setProvider] = useState(settings.provider || "xai");
  const [endpoint, setEndpoint] = useState(settings.endpoint || "");
  const [apiKey, setApiKey] = useState(settings.key || "");
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState(settings.model || "");
  const [availableModels, setAvailableModels] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [prompt, setPrompt] = useState(settings.prompt || "");

  const [testState, setTestState] = useState(null); // { status: 'loading' | 'success' | 'error', message: string }

  useEffect(() => {
    if (isOpen) {
      setProvider(settings.provider || "xai");
      setEndpoint(settings.endpoint || "");
      setApiKey(settings.key || "");
      setModel(settings.model || "");
      setPrompt(settings.prompt || "");
      setTestState(null);
      setAvailableModels([]);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleProviderChange = (e) => {
    const selected = e.target.value;
    setProvider(selected);
    const preset = PROVIDER_PRESETS[selected];
    if (preset) {
      if (preset.endpoint) setEndpoint(preset.endpoint);
      if (preset.model) setModel(preset.model);
    }
  };

  const handleScanModels = async () => {
    if (!endpoint.trim()) {
      setTestState({
        status: "error",
        message: "Masukkan API Base URL terlebih dahulu sebelum memindai model."
      });
      return;
    }

    setIsScanning(true);
    setTestState(null);

    try {
      const models = await scanModelsFromEndpoint(endpoint, apiKey);
      setAvailableModels(models);
      if (models.length > 0 && !models.includes(model)) {
        setModel(models[0]);
      }
      onShowToast(`Ditemukan ${models.length} model dari endpoint!`);
    } catch (err) {
      setTestState({
        status: "error",
        message: `Gagal scan model: ${err.message}`
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleTestConnection = async () => {
    setTestState({
      status: "loading",
      message: "Menguji sambungan ke endpoint..."
    });

    try {
      await testConnection(endpoint, apiKey, model);
      setTestState({
        status: "success",
        message: `Koneksi berhasil! Model '${model}' siap digunakan.`
      });
    } catch (err) {
      setTestState({
        status: "error",
        message: `Koneksi gagal: ${err.message}`
      });
    }
  };

  const handleSave = () => {
    const cleanEndpoint = endpoint.trim().replace(/\/+$/, "");
    if (!cleanEndpoint) {
      setTestState({ status: "error", message: "API Base URL tidak boleh kosong." });
      return;
    }
    if (!model.trim()) {
      setTestState({ status: "error", message: "Nama Model tidak boleh kosong." });
      return;
    }

    onSaveSettings({
      provider,
      endpoint: cleanEndpoint,
      key: apiKey.trim(),
      model: model.trim(),
      prompt: prompt.trim()
    });
    onShowToast("Pengaturan AI berhasil disimpan!");
    onClose();
  };

  return (
    <div className="openui-modal-overlay" onClick={onClose}>
      <div
        className="openui-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settingsModalTitle"
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <Sliders size={16} style={{ color: "var(--openui-brand)" }} />
            <h2 id="settingsModalTitle">Pengaturan AI (BYOK)</h2>
          </div>
          <button
            type="button"
            className="openui-icon-btn"
            onClick={onClose}
            aria-label="Tutup"
          >
            <X size={15} />
          </button>
        </div>

        <div className="modal-body">
          {/* Provider Preset */}
          <div className="form-field">
            <label className="form-label">Preset Provider</label>
            <select
              className="openui-input"
              value={provider}
              onChange={handleProviderChange}
            >
              {Object.entries(PROVIDER_PRESETS).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.name}
                </option>
              ))}
            </select>
            {PROVIDER_PRESETS[provider]?.hint && (
              <span className="field-help-text">
                {PROVIDER_PRESETS[provider].hint}
              </span>
            )}
          </div>

          {/* API Base URL */}
          <div className="form-field">
            <label className="form-label">API Base URL</label>
            <input
              type="text"
              className="openui-input"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://api.openai.com/v1"
              required
            />
            <span className="field-help-text">
              Mendukung endpoint kompatibel OpenAI (format <code>/chat/completions</code>)
            </span>
          </div>

          {/* API Key */}
          <div className="form-field">
            <label className="form-label">API Key</label>
            <div className="password-input-group">
              <input
                type={showKey ? "text" : "password"}
                className="openui-input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
              />
              <button
                type="button"
                className="password-eye-btn"
                onClick={() => setShowKey(!showKey)}
                title={showKey ? "Sembunyikan Key" : "Tampilkan Key"}
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <span className="field-help-text">
              Disimpan secara lokal di browser perangkat Anda (tidak dikirim ke server pihak ketiga).
            </span>
          </div>

          {/* Model AI & Model Scanner */}
          <div className="form-field">
            <div className="form-label-row">
              <label className="form-label">Model AI</label>
              <button
                type="button"
                className="form-action-link"
                onClick={handleScanModels}
                disabled={isScanning}
              >
                <RefreshCw
                  size={11}
                  className={isScanning ? "status-pulse-dot" : ""}
                />
                {isScanning ? "Memindai..." : "Scan Model dari Endpoint"}
              </button>
            </div>

            {availableModels.length > 0 && (
              <select
                className="openui-input"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                style={{ marginBottom: "4px" }}
              >
                <option value="">-- Pilih Model Terdeteksi ({availableModels.length}) --</option>
                {availableModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            )}

            <input
              type="text"
              className="openui-input"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Nama model (contoh: grok-2-latest, gpt-4o-mini, llama3.2)..."
              required
            />
          </div>

          {/* System Prompt */}
          <div className="form-field">
            <label className="form-label">System Prompt (Instruksi Editor)</label>
            <textarea
              className="openui-textarea"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Instruksi sistem untuk AI..."
            />
          </div>

          {/* Test State Alert Card */}
          {testState && (
            <div className={`connection-status-card ${testState.status}`}>
              {testState.status === "loading" && <RefreshCw size={14} className="status-pulse-dot" />}
              {testState.status === "success" && <CheckCircle2 size={14} />}
              {testState.status === "error" && <AlertCircle size={14} />}
              <span>{testState.message}</span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="openui-btn openui-btn-secondary"
            onClick={handleTestConnection}
            disabled={testState?.status === "loading"}
          >
            Tes Koneksi
          </button>
          <div className="modal-footer-right">
            <button
              type="button"
              className="openui-btn openui-btn-secondary"
              onClick={onClose}
            >
              Batal
            </button>
            <button
              type="button"
              className="openui-btn openui-btn-primary"
              onClick={handleSave}
            >
              <Check size={13} />
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
