import { useState } from "react";
import { useBilling } from "../hooks/useBilling";
import { useGrokStatus } from "../hooks/useGrokStatus";
import { useOAuthStatus } from "../hooks/useOAuthStatus";
import { useAgyStatus } from "../hooks/useAgyStatus";
import { useI18n } from "../i18n";
import { ApiKeyInput } from "./ApiKeyInput";
import { GeminiKeySection } from "./GeminiKeySection";
import { useKeyStatus } from "../hooks/useKeyStatus";
import { useQuotaData, CodexQuota, GrokQuota } from "./settings/QuotaCard";

function statusLabel(t: (key: string) => string, status?: string): string {
  if (status === "ready") return t("settings.account.status.ready");
  if (status === "auth_required") return t("settings.account.status.authRequired");
  if (status === "starting") return t("settings.account.status.starting");
  if (status === "offline") return t("settings.account.status.offline");
  if (status === "no_image_model") return t("settings.account.status.noImageModel");
  if (status === "error") return t("settings.account.status.error");
  return t("settings.account.status.checking");
}

function statusTone(status?: string): "ok" | "warn" | "err" {
  if (status === "ready") return "ok";
  if (status === "error" || status === "offline") return "err";
  return "warn";
}

export function AccountSettings() {
  const { t } = useI18n();
  const oauth = useOAuthStatus();
  const grok = useGrokStatus();
  const agy = useAgyStatus();
  const { data, error } = useBilling();
  const { data: keyStatus, mutate: mutateKeys } = useKeyStatus();
  const quota = useQuotaData();
  const [keysOpen, setKeysOpen] = useState(false);
  const showApiKeyCard =
    data?.apiKeySource === "env" ||
    data?.apiKeySource === "config" ||
    data?.apiKeyValid === true;
  const apiSource =
    data?.apiKeySource === "config"
      ? t("settings.account.apiSourceConfig")
      : t("settings.account.apiSourceEnv");
  const apiReady = data?.apiKeyValid === true;

  return (
    <>
      <article className="provider-card">
        <div className="provider-card__head">
          <h4>{t("settings.account.oauthTitle")}</h4>
          <span className={`provider-chip provider-chip--${statusTone(oauth?.status)}`}>
            {statusLabel(t, oauth?.status)}
          </span>
        </div>
        <div className="settings-row__copy">
          <p className="settings-eyebrow">{t("settings.account.primaryEyebrow")}</p>
          <p>{t("settings.account.oauthBody")}</p>
        </div>
        <CodexQuota data={quota.data} loading={quota.loading} onRefresh={quota.refreshQuota} />
      </article>

      {showApiKeyCard ? (
        <article className="provider-card">
          <div className="provider-card__head">
            <h4>{t("settings.account.apiTitle")}</h4>
            <span className={`provider-chip provider-chip--${error ? "err" : apiReady ? "ok" : "warn"}`}>
              {error
                ? t("settings.account.apiUnknown")
                : apiReady
                  ? t("settings.account.apiReady")
                  : t("settings.account.apiUnavailable")}
            </span>
          </div>
          <div className="settings-row__copy">
            <p className="settings-eyebrow">{apiSource}</p>
            <p>{t("settings.account.apiBody")}</p>
          </div>
        </article>
      ) : null}

      <article className="provider-card">
        <div className="provider-card__head">
          <h4>{t("settings.account.grokTitle")}</h4>
          <span className={`provider-chip provider-chip--${statusTone(grok?.status)}`}>
            {statusLabel(t, grok?.status)}
          </span>
        </div>
        <div className="settings-row__copy">
          <p className="settings-eyebrow">{t("settings.account.grokEyebrow")}</p>
          <p>{t("settings.account.grokBody")}</p>
        </div>
        <GrokQuota data={quota.data} loading={quota.loading} onRefresh={quota.refreshQuota} />
      </article>

      <article className="provider-card">
        <div className="provider-card__head">
          <h4>{t("settings.account.agyTitle")}</h4>
          <span className={`provider-chip provider-chip--${agy?.installed ? "ok" : "warn"}`}>
            {agy?.installed ? t("settings.account.agyInstalled") : t("settings.account.agyMissing")}
          </span>
        </div>
        <div className="settings-row__copy">
          <p className="settings-eyebrow">{t("settings.account.agyEyebrow")}</p>
          {agy?.installed ? (
            <p>{t("settings.account.agyInstalledBody")}</p>
          ) : (
            <p>
              {t("settings.account.agyMissingBody")}{" "}
              <a
                href="https://antigravity.google/docs/cli-install"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("settings.account.agyMissingLink")}
              </a>
            </p>
          )}
          <p style={{ fontSize: "12px", color: "var(--text-dim, #888)", marginTop: "4px" }}>
            {t("settings.account.agyFineprint")}
          </p>
        </div>
      </article>

      {keyStatus && (
        <article className="settings-row settings-accordion">
          <button
            type="button"
            className="settings-accordion__trigger"
            onClick={() => setKeysOpen(!keysOpen)}
          >
            <h4>{t("settings.apiKeys.accordionTitle")}</h4>
            <span className={`settings-accordion__arrow${keysOpen ? " is-open" : ""}`}>▼</span>
          </button>
          {keysOpen && (
            <div className="settings-accordion__body">
              <ApiKeyInput
                provider="openai"
                label={t("settings.apiKeys.openai.label")}
                placeholder={t("settings.apiKeys.openai.placeholder")}
                maskedKey={keyStatus.openai?.maskedKey ?? null}
                source={keyStatus.openai?.source ?? "none"}
                configured={keyStatus.openai?.configured ?? false}
                onSaved={mutateKeys}
              />
              <ApiKeyInput
                provider="xai"
                label={t("settings.apiKeys.xai.label")}
                placeholder={t("settings.apiKeys.xai.placeholder")}
                maskedKey={keyStatus.xai?.maskedKey ?? null}
                source={keyStatus.xai?.source ?? "none"}
                configured={keyStatus.xai?.configured ?? false}
                onSaved={mutateKeys}
              />
              <GeminiKeySection
                keyStatus={keyStatus}
                onSaved={mutateKeys}
              />
            </div>
          )}
        </article>
      )}
    </>
  );
}
