import { useI18n } from "../../i18n";
import { AgentComposer } from "./AgentComposer";
import { AgentMessageList } from "./AgentMessageList";
import { AgentModelSelector } from "./AgentModelSelector";
import { AgentStatusBadge } from "./AgentStatusBadge";
import type { AgentGenerationSettings, AgentImageHandle, AgentRuntimeStatus, AgentSessionSummary, AgentTurn } from "./agentTypes";

type Props = {
  session: AgentSessionSummary | null;
  turns: AgentTurn[];
  imagesById: Record<string, AgentImageHandle>;
  currentImageId: string | null;
  runtimeStatus: AgentRuntimeStatus;
  settings?: AgentGenerationSettings;
  insertedPrompt?: { id: number; text: string } | null;
  onSettingsChange?: (patch: Partial<AgentGenerationSettings>) => void;
  onWebSearchChange: (enabled: boolean) => void;
  onAttachFiles: (files: File[]) => void;
  onImageSelect: (imageId: string) => void;
  onSend: (text: string) => void;
};

export function AgentChatPane({
  session,
  turns,
  imagesById,
  currentImageId,
  runtimeStatus,
  settings,
  insertedPrompt,
  onSettingsChange,
  onWebSearchChange,
  onAttachFiles,
  onImageSelect,
  onSend,
}: Props) {
  const { t } = useI18n();

  return (
    <section className="agent-chat" aria-label={t("agent.chat")}>
      <header className="agent-pane-header">
        <div className="agent-pane-header__title">
          <span>{t("agent.chat")}</span>
          <strong>{session?.title ?? t("agent.newSession")}</strong>
        </div>
        <div className="agent-pane-header__actions">
          {settings && onSettingsChange ? <AgentModelSelector settings={settings} onChange={onSettingsChange} /> : null}
          <AgentStatusBadge status={runtimeStatus} compacted={session?.compacted} />
        </div>
      </header>
      <AgentMessageList turns={turns} imagesById={imagesById} currentImageId={currentImageId} onImageSelect={onImageSelect} />
      <AgentComposer webSearchEnabled={session?.webSearchEnabled ?? false} insertedPrompt={insertedPrompt} onWebSearchChange={onWebSearchChange} onAttachFiles={onAttachFiles} onSend={onSend} />
    </section>
  );
}
