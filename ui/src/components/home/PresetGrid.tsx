import { useMemo, useState } from "react";
import type { PresetCategory } from "../../../../lib/presetCompiler";
import { getAllPresets, getPresetsByCategory } from "../../lib/presets";
import { useAppStore } from "../../store/useAppStore";
import { useI18n } from "../../i18n";
import { Segmented, type SegmentedItem } from "../controls";

type CategoryFilter = PresetCategory | "all";

const CATEGORY_ITEMS: ReadonlyArray<SegmentedItem<CategoryFilter>> = [
  { value: "camera-motion", label: "Camera Motion" },
  { value: "style", label: "Style" },
  { value: "lighting", label: "Lighting" },
  { value: "all", label: "All" },
];

export function PresetGrid() {
  const [category, setCategory] = useState<CategoryFilter>("camera-motion");
  const selectedPresetIds = useAppStore((state) => state.selectedPresetIds);
  const togglePreset = useAppStore((state) => state.togglePreset);
  const { t } = useI18n();
  const selectedIds = useMemo(() => new Set(selectedPresetIds), [selectedPresetIds]);
  const presets = useMemo(
    () => category === "all" ? getAllPresets() : getPresetsByCategory(category),
    [category],
  );

  return (
    <section className="home-preset-section" aria-labelledby="home-presets-title">
      <div className="home-preset-section__header">
        <div className="home-preset-section__title-row">
          <h2 id="home-presets-title">{t("home.presetsTitle")}</h2>
          <span className="home-preset-section__count" aria-live="polite">
            {t("home.selectedCount", { count: selectedPresetIds.length })}
          </span>
        </div>
        <Segmented
          className="home-preset-section__tabs"
          items={CATEGORY_ITEMS}
          value={category}
          onChange={setCategory}
        />
      </div>

      <div className="home-preset-grid">
        {presets.map((preset) => {
          const selected = selectedIds.has(preset.id);
          return (
            <button
              key={preset.id}
              type="button"
              className={`home-preset-card home-preset-card--${preset.category}${selected ? " is-selected" : ""}`}
              aria-pressed={selected}
              onClick={() => togglePreset(preset.id)}
            >
              <span className="home-preset-card__thumb" aria-hidden="true" />
              <span className="home-preset-card__meta">
                <span className="home-preset-card__name">{preset.name}</span>
                <span className="home-preset-card__category">{preset.category.replace("-", " ")}</span>
              </span>
              <span className="home-preset-card__check" aria-hidden="true">✓</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
