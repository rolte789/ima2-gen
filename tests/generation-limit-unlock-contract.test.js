import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(relPath) {
  return readFileSync(join(root, relPath), "utf8");
}

test("generation image-count limit is configured once and exposed to clients", () => {
  const config = readSource("config.ts");
  const capabilities = readSource("lib/capabilities.ts");
  const configKeys = readSource("lib/configKeys.ts");

  assert.match(config, /maxGeneratedImages: pickInt\(env\.IMA2_MAX_GENERATED_IMAGES, fileCfg\.limits\?\.maxGeneratedImages, 24\)/);
  assert.match(config, /maxParallel: pickInt\(env\.IMA2_MAX_PARALLEL, fileCfg\.limits\?\.maxParallel, 24\)/);
  assert.match(config, /export const MAX_GENERATED_IMAGES = config\.limits\.maxGeneratedImages/);
  assert.match(capabilities, /maxGeneratedImages: appConfig\.limits\.maxGeneratedImages/);
  assert.match(capabilities, /enforced: true/);
  assert.match(configKeys, /"limits\.maxGeneratedImages"/);
  assert.match(configKeys, /IMA2_MAX_GENERATED_IMAGES/);
});

test("server generation paths no longer keep hard-coded 8 image-count caps", () => {
  for (const relPath of [
    "routes/generate.ts",
    "routes/multimode.ts",
    "lib/multimodeHelpers.ts",
    "lib/oauthProxy/prompts.ts",
    "lib/oauthProxy/generators.ts",
    "lib/oauthProxy/streams.ts",
    "lib/responsesImageAdapter.ts",
    "lib/grokMultimodeAdapter.ts",
    "lib/agentCommandParser.ts",
    "lib/agentRuntime.ts",
    "lib/agentGenerationPlanner.ts",
    "lib/agentSettings.ts",
    "bin/commands/gen.ts",
    "bin/commands/multimode.ts",
    "bin/commands/node.ts",
  ]) {
    const src = readSource(relPath);
    assert.doesNotMatch(src, /Math\.min\(8/);
    assert.doesNotMatch(src, /<1-8>/);
  }
});

test("frontend count persistence uses the shared 24 image limit", () => {
  const limits = readSource("ui/src/lib/generationLimits.ts");
  const picker = readSource("ui/src/components/CountPicker.tsx");
  const persistence = readSource("ui/src/store/storePersistence.ts");
  const agentPanel = readSource("ui/src/components/agent/AgentQualityPanel.tsx");
  const agentSettings = readSource("ui/src/lib/agentGenerationSettings.ts");

  assert.match(limits, /MAX_GENERATION_COUNT = 24/);
  assert.match(picker, /normalizeGenerationCount/);
  assert.match(persistence, /normalizeGenerationCount/);
  assert.match(agentPanel, /MAX_AGENT_VARIANTS/);
  assert.match(agentPanel, /MAX_AGENT_PARALLELISM/);
  assert.match(agentSettings, /MAX_AGENT_VARIANTS = MAX_GENERATION_COUNT/);
  assert.doesNotMatch(picker, /Math\.min\(8/);
  assert.doesNotMatch(persistence, /Math\.min\(8/);
  assert.doesNotMatch(agentPanel, /max=\{8\}/);
  assert.doesNotMatch(agentSettings, /maxAutoVariants: 8/);
});
