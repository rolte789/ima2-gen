import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { readSourceTree } from "./_readTree.mjs";

const root = process.cwd();

function readSource(path) {
  return readFileSync(join(root, path), "utf8");
}

describe("provider UI polish contract", () => {
  it("renders provider selection from the provider identity map", () => {
    const select = readSource("ui/src/components/ProviderSelect.tsx");

    assert.match(select, /PROVIDER_COLUMNS/);
    assert.match(select, /getProviderIdentity/);
    assert.match(select, /ProviderCard/);
    assert.doesNotMatch(select, /const GRID/);
    assert.doesNotMatch(select, /provider-pill/);
    assert.match(select, /setProvider\(nextProvider\)/);
    assert.match(select, /getProviderIdentity\(blocked\)\.compactLabel/);
  });

  it("owns provider component styles outside toast-modal css", () => {
    const indexCss = readSourceTree("ui/src/index.css");
    const providerCss = readSource("ui/src/styles/provider-controls.css");
    const toastCss = readSource("ui/src/styles/toast-modal.css");

    assert.match(indexCss, /@import "\.\/styles\/provider-controls\.css";/);
    assert.match(providerCss, /\.provider-card/);
    assert.match(providerCss, /\.provider-card--gpt/);
    assert.match(providerCss, /\.provider-card--grok/);
    assert.match(providerCss, /\.provider-card--gemini/);
    assert.match(providerCss, /\.provider-status-badge/);
    assert.match(providerCss, /container-type:\s*inline-size/);
    assert.doesNotMatch(toastCss, /\.provider-pill/);
    assert.doesNotMatch(toastCss, /\.provider-grid/);
  });

  it("keeps provider cards accessible and stable", () => {
    const card = readSource("ui/src/components/provider/ProviderCard.tsx");
    const badge = readSource("ui/src/components/provider/ProviderStatusBadge.tsx");
    const css = readSource("ui/src/styles/provider-controls.css");

    assert.match(card, /type="button"/);
    assert.match(card, /aria-label=\{ariaLabel\}/);
    assert.match(card, /aria-pressed=\{selected\}/);
    assert.match(card, /ProviderStatusBadge/);
    assert.match(badge, /status-dot--ok/);
    assert.match(badge, /status-dot--bad/);
    assert.match(css, /min-height:\s*54px/);
    assert.match(css, /text-overflow:\s*ellipsis/);
    assert.match(css, /:focus-visible/);
  });
});
