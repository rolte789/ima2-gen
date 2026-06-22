import { useI18n } from "../../i18n";
import type { AgentRunProgress } from "./agentRunProgress";

type Props = {
  progress: AgentRunProgress | null;
};

export function AgentRunStatusBar({ progress }: Props) {
  const { t } = useI18n();
  if (!progress?.active) return null;
  const meta = [
    progress.runningCount > 0 ? `${progress.runningCount} ${t("agent.runningShort")}` : null,
    progress.queuedCount > 0 ? `${progress.queuedCount} ${t("agent.queuedShort")}` : null,
  ].filter(Boolean).join(" · ");

  return (
    <div className={`agent-run-status agent-run-status--${progress.status}`} role="status" aria-live="polite">
      <span className="agent-run-status__spinner" aria-hidden="true" />
      <span className="agent-run-status__label">{t(`agent.${progress.labelKey}`)}</span>
      {meta ? <span className="agent-run-status__meta">{meta}</span> : null}
      {progress.status === "error" && progress.lastError ? (
        <span className="agent-run-status__meta">{progress.lastError}</span>
      ) : null}
    </div>
  );
}
