import { useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { useOAuthStatus } from "../hooks/useOAuthStatus";
import { useBilling } from "../hooks/useBilling";
import { useGrokStatus } from "../hooks/useGrokStatus";
import { useKeyStatus } from "../hooks/useKeyStatus";
import { ApiDisabledModal } from "./ApiDisabledModal";
import type { Provider } from "../types";
import { useI18n } from "../i18n";
import { PROVIDER_COLUMNS, getProviderIdentity } from "../lib/providerIdentity";
import { ProviderCard } from "./provider/ProviderCard";

type ProviderAvailability = {
  ok: boolean;
  reason: string;
  hint?: string;
};

export function useProviderAvailability(): Record<Provider, ProviderAvailability> {
  const { t } = useI18n();
  const oauth = useOAuthStatus();
  const { data } = useBilling();
  const grok = useGrokStatus();
  const { data: keyStatus } = useKeyStatus();

  const oauthReady = oauth?.status === "ready";
  let oauthReason = t("provider.oauthNotReady");
  let oauthHint: string | undefined;
  if (oauth?.status === "auth_required") {
    oauthReason = t("provider.codexLoginRequired");
    oauthHint = t("provider.codexLoginHint");
  } else if (oauth?.status === "starting") {
    oauthReason = t("provider.oauthStarting");
  } else if (!oauth) {
    oauthReason = t("provider.serverUnreachable");
  }

  const apiOk = data?.apiKeyValid === true;

  const grokReady = grok?.status === "ready";
  const grokReason = !grok
    ? t("provider.grokNotReady")
    : grok.status === "offline"
      ? t("provider.grokOffline")
      : grok.status === "no_image_model"
        ? t("provider.grokNoImageModel")
        : grok.status === "error"
          ? t("provider.grokNotReady")
          : "";

  const xaiKeyOk = keyStatus?.xai?.valid === true;
  const geminiKeyOk = keyStatus?.gemini?.valid === true || keyStatus?.vertex?.valid === true;

  return {
    oauth: { ok: oauthReady, reason: oauthReason, hint: oauthHint },
    api: {
      ok: apiOk,
      reason: apiOk ? "" : t("provider.apiInvalid"),
    },
    grok: {
      ok: grokReady,
      reason: grokReason,
      hint: grokReady ? undefined : t("provider.grokOfflineHint"),
    },
    "grok-api": {
      ok: xaiKeyOk,
      reason: xaiKeyOk ? "" : t("provider.xaiApiKeyRequired"),
    },
    agy: {
      ok: true,
      reason: "",
    },
    "gemini-api": {
      ok: geminiKeyOk,
      reason: geminiKeyOk ? "" : t("provider.geminiApiKeyRequired"),
    },
  };
}

type ProviderSelectProps = {
  allowGrok?: boolean;
};

export function ProviderSelect({ allowGrok = true }: ProviderSelectProps) {
  const { t } = useI18n();
  const provider = useAppStore((s) => s.provider);
  const setProvider = useAppStore((s) => s.setProvider);
  const availability = useProviderAvailability();
  const [blocked, setBlocked] = useState<Provider | null>(null);

  const providerAvailability = {
    ...availability,
    grok: allowGrok
      ? availability.grok
      : { ok: false, reason: t("provider.grokClassicOnly"), hint: t("provider.grokClassicOnlyHint") },
  };

  const handleClick = (nextProvider: Provider) => {
    if (providerAvailability[nextProvider].ok) {
      setProvider(nextProvider);
    } else {
      setBlocked(nextProvider);
    }
  };

  const blockedLabel = blocked
    ? getProviderIdentity(blocked).compactLabel
    : "";
  const blockedInfo = blocked
    ? { label: blockedLabel, ...providerAvailability[blocked] }
    : null;

  return (
    <>
      <div className="section-title">{t("provider.authTitle")}</div>
      <div className="provider-grid">
        {PROVIDER_COLUMNS.map((col) => (
          <div key={col.family} className="provider-grid__col">
            <div className="provider-grid__header">
              <strong>{col.header}</strong>
              <span>{getProviderIdentity(col.providers[0]).company}</span>
            </div>
            {col.providers.map((providerValue) => {
              const identity = getProviderIdentity(providerValue);
              const selected = provider === providerValue;
              const availabilityInfo = providerAvailability[providerValue];
              const ok = availabilityInfo.ok;
              const statusLabel = ok ? t("provider.availableSr") : t("provider.unavailableSr");
              return (
                <ProviderCard
                  key={providerValue}
                  identity={identity}
                  selected={selected}
                  ok={ok}
                  statusLabel={statusLabel}
                  title={ok ? identity.longLabel : availabilityInfo.reason}
                  ariaLabel={ok ? t("provider.availableAria", { name: identity.longLabel }) : t("provider.unavailableAria", { name: identity.longLabel })}
                  onClick={() => handleClick(providerValue)}
                />
              );
            })}
          </div>
        ))}
      </div>
      <ApiDisabledModal
        open={!!blockedInfo}
        providerLabel={blockedInfo?.label ?? ""}
        reason={blockedInfo?.reason ?? ""}
        hint={blockedInfo?.hint}
        onClose={() => setBlocked(null)}
      />
    </>
  );
}
