import { useI18n } from "../../i18n";
import { DEFAULT_IMAGE_MODEL, IMAGE_MODEL_OPTIONS, isGrokImageModel } from "../../lib/imageModels";
import { getProviderIdentity } from "../../lib/providerIdentity";
import { ProviderCard } from "../provider/ProviderCard";
import type { AgentGenerationSettings } from "./agentTypes";

type Props = {
  settings: AgentGenerationSettings;
  onChange: (patch: Partial<AgentGenerationSettings>) => void;
};

const AGENT_PROVIDER_OPTIONS: AgentGenerationSettings["provider"][] = ["oauth", "api", "grok", "agy"];

export function AgentModelSelector({ settings, onChange }: Props) {
  const { t } = useI18n();
  const setProvider = (provider: AgentGenerationSettings["provider"]) => {
    if (provider === "agy") {
      onChange({ provider, model: "nano-banana-2" });
      return;
    }
    if (provider === "grok" && !isGrokImageModel(settings.model)) {
      onChange({ provider, model: "grok-imagine-image" });
      return;
    }
    if (provider !== "grok" && isGrokImageModel(settings.model)) {
      onChange({ provider, model: DEFAULT_IMAGE_MODEL });
      return;
    }
    onChange({ provider });
  };
  const setModel = (model: string) => {
    if (isGrokImageModel(model)) {
      onChange({ model, provider: "grok" });
      return;
    }
    if (settings.provider === "grok") {
      onChange({ model, provider: "oauth" });
      return;
    }
    onChange({ model });
  };

  return (
    <section className="agent-settings-grid" aria-label={t("agent.model")}>
      <label>
        <span>{t("agent.model")}</span>
        <select value={settings.model} onChange={(event) => setModel(event.target.value)}>
          {IMAGE_MODEL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{t(option.fullLabelKey)}</option>
          ))}
        </select>
      </label>
      <div className="agent-settings-grid__field">
        <span>{t("agent.provider")}</span>
        <div className="agent-provider-options" role="group" aria-label={t("agent.provider")}>
          {AGENT_PROVIDER_OPTIONS.map((provider) => {
            const identity = getProviderIdentity(provider);
            const selected = settings.provider === provider;
            return (
              <ProviderCard
                key={provider}
                identity={identity}
                selected={selected}
                ok
                statusLabel={t("agent.statusReady")}
                title={identity.longLabel}
                ariaLabel={t("provider.availableAria", { name: identity.longLabel })}
                onClick={() => setProvider(provider)}
              />
            );
          })}
        </div>
      </div>
      <label>
        <span>{t("agent.reasoningEffort")}</span>
        <select value={settings.reasoningEffort} onChange={(event) => onChange({ reasoningEffort: event.target.value as AgentGenerationSettings["reasoningEffort"] })}>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
          <option value="xhigh">xhigh</option>
        </select>
      </label>
    </section>
  );
}
