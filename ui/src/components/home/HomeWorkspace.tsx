import { HistoryStrip } from "../HistoryStrip";
import { useI18n } from "../../i18n";
import { HomePromptComposer } from "./HomePromptComposer";
import { PresetGrid } from "./PresetGrid";
import "../../styles/home-workspace.css";

export function HomeWorkspace() {
  const { t } = useI18n();

  return (
    <section className="home-workspace" aria-label={t("nav.create")}>
      <div className="home-workspace__hero">
        <HomePromptComposer />
      </div>
      <div className="home-workspace__presets">
        <PresetGrid />
      </div>
      <div className="home-workspace__recent">
        <h2>{t("home.recentTitle")}</h2>
        <HistoryStrip />
      </div>
    </section>
  );
}
