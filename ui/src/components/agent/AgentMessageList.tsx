import { useEffect, useMemo, useRef } from "react";
import { useI18n } from "../../i18n";
import { AgentMessage } from "./AgentMessage";
import { AgentRunGroup } from "./AgentRunGroup";
import type { AgentImageHandle, AgentTurn } from "./agentTypes";

type Props = {
  turns: AgentTurn[];
  imagesById: Record<string, AgentImageHandle>;
  currentImageId: string | null;
  onImageSelect: (imageId: string) => void;
};

type MessageGroup =
  | { kind: "single"; turn: AgentTurn }
  | { kind: "run"; turns: AgentTurn[]; key: string };

function groupTurns(turns: AgentTurn[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  let runBatch: AgentTurn[] = [];

  const flushRun = () => {
    if (runBatch.length === 0) return;
    groups.push({ kind: "run", turns: runBatch, key: runBatch.map((t) => t.id).join("+") });
    runBatch = [];
  };

  for (const turn of turns) {
    if (turn.role === "user") {
      flushRun();
      groups.push({ kind: "single", turn });
    } else {
      runBatch.push(turn);
    }
  }
  flushRun();
  return groups;
}

export function AgentMessageList({ turns, imagesById, currentImageId, onImageSelect }: Props) {
  const { t } = useI18n();
  const listRef = useRef<HTMLDivElement>(null);
  const groups = useMemo(() => groupTurns(turns), [turns]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns.length]);

  return (
    <div ref={listRef} className="agent-message-list" aria-live="polite">
      {turns.length === 0 ? <div className="agent-message-list__empty">{t("agent.emptyChat")}</div> : null}
      {groups.map((group) =>
        group.kind === "run" ? (
          <AgentRunGroup key={group.key} turns={group.turns} imagesById={imagesById} currentImageId={currentImageId} onImageSelect={onImageSelect} />
        ) : (
          <AgentMessage key={group.turn.id} turn={group.turn} imagesById={imagesById} currentImageId={currentImageId} onImageSelect={onImageSelect} />
        ),
      )}
    </div>
  );
}
