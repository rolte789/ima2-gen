import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("async stream clients subscribe before POST fetch", () => {
  for (const rel of ["ui/src/lib/api-generation.ts", "ui/src/lib/nodeApi.ts"]) {
    const src = readFileSync(join(root, rel), "utf8");
    const subscribeIdx = src.indexOf("subscribe(requestId");
    const fetchIdx = src.indexOf('void fetch(');
    assert.ok(subscribeIdx >= 0, `${rel} must call subscribe(requestId)`);
    assert.ok(fetchIdx >= 0, `${rel} must POST via fetch`);
    assert.ok(subscribeIdx < fetchIdx, `${rel} must subscribe before fetch to avoid event loss`);
  }
});
