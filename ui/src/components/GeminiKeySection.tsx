import { useEffect, useState } from "react";
import { ApiKeyInput } from "./ApiKeyInput";
import { VertexJsonInput } from "./VertexJsonInput";
import { useI18n } from "../i18n";
import type { KeyStatus } from "../hooks/useKeyStatus";

type GeminiKeySectionProps = {
  keyStatus: KeyStatus;
  onSaved: () => void;
};

export function GeminiKeySection({ keyStatus, onSaved }: GeminiKeySectionProps) {
  const { t } = useI18n();
  const vertexConfigured = keyStatus.vertex?.configured ?? false;
  const geminiConfigured = keyStatus.gemini?.configured ?? false;
  const serverAuthMode: "apikey" | "vertex" =
    keyStatus.geminiAuthMode === "vertex" ? "vertex" : "apikey";
  const [authMode, setAuthMode] = useState<"apikey" | "vertex">(serverAuthMode);
  const [userPicked, setUserPicked] = useState(false);

  // Reconcile dropdown with the server-persisted mode until the user picks one.
  useEffect(() => {
    if (userPicked) return;
    setAuthMode(serverAuthMode);
  }, [serverAuthMode, userPicked]);

  const handleModeChange = (mode: "apikey" | "vertex") => {
    setUserPicked(true);
    setAuthMode(mode);
    void fetch("/api/keys/gemini-auth-mode", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    }).catch(() => { /* keep local state; status poll will reconcile */ });
  };

  return (
    <div className="gemini-key-section">
      <div className="gemini-key-section__header">
        <h5>{t("settings.apiKeys.gemini.label")}</h5>
        <select
          value={authMode}
          onChange={(e) => handleModeChange(e.target.value as "apikey" | "vertex")}
          className="gemini-auth-mode-select"
        >
          <option value="apikey">{t("settings.apiKeys.vertex.authModeApiKey")}</option>
          <option value="vertex">{t("settings.apiKeys.vertex.authModeVertex")}</option>
        </select>
      </div>

      {authMode === "apikey" ? (
        <ApiKeyInput
          provider="gemini"
          label=""
          placeholder={t("settings.apiKeys.gemini.placeholder")}
          maskedKey={keyStatus.gemini?.maskedKey ?? null}
          source={keyStatus.gemini?.source ?? "none"}
          configured={geminiConfigured}
          onSaved={onSaved}
        />
      ) : (
        <VertexJsonInput
          configured={vertexConfigured}
          maskedKey={keyStatus.vertex?.maskedKey ?? null}
          source={keyStatus.vertex?.source ?? "none"}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
