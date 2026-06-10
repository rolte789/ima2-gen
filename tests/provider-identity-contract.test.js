import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function readSource(path) {
  return readFileSync(join(root, path), "utf8");
}

describe("provider identity contract", () => {
  it("keeps a display identity for every Provider union member", () => {
    const types = readSource("ui/src/types.ts");
    const identity = readSource("ui/src/lib/providerIdentity.ts");

    const providerUnion = types.match(/export type Provider = ([^;]+);/)?.[1] ?? "";
    const providers = [...providerUnion.matchAll(/"([^"]+)"/g)].map((match) => match[1]);

    assert.deepEqual(providers, ["oauth", "api", "grok", "grok-api", "agy", "gemini-api"]);
    for (const provider of providers) {
      const key = provider.includes("-") ? JSON.stringify(provider) : provider;
      assert.match(identity, new RegExp(`${key}:\\s*\\{[\\s\\S]*?provider:\\s*${JSON.stringify(provider)}`));
    }
  });

  it("separates company, product, method, and visual family metadata", () => {
    const identity = readSource("ui/src/lib/providerIdentity.ts");

    for (const field of ["company", "product", "method", "methodLabel", "compactLabel", "longLabel", "detailLabel", "family", "statusKind", "accentVar"]) {
      assert.match(identity, new RegExp(`\\b${field}:`), `missing ${field}`);
    }
    assert.match(identity, /company: "OpenAI"[\s\S]*?product: "GPT"/);
    assert.match(identity, /company: "xAI"[\s\S]*?product: "Grok"/);
    assert.match(identity, /company: "Google"[\s\S]*?product: "Gemini"/);
    assert.match(identity, /agy:[\s\S]*?method: "local-cli"[\s\S]*?detailLabel: "Antigravity"/);
  });

  it("keeps provider columns as a compact company-family grid", () => {
    const identity = readSource("ui/src/lib/providerIdentity.ts");

    assert.match(identity, /PROVIDER_COLUMNS/);
    assert.match(identity, /providers: \["oauth", "api"\]/);
    assert.match(identity, /providers: \["grok", "grok-api"\]/);
    assert.match(identity, /providers: \["agy", "gemini-api"\]/);
  });
});
