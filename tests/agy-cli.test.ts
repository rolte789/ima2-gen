import test from "node:test";
import assert from "node:assert/strict";
import { chmod, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import {
  agyCommandName,
  agyLocalBinCandidates,
  buildAgyPathEnv,
  resolveAgyBin,
} from "../lib/agyCli.ts";

test("agy command name follows platform conventions", () => {
  assert.equal(agyCommandName("linux"), "agy");
  assert.equal(agyCommandName("darwin"), "agy");
  assert.equal(agyCommandName("win32"), "agy.cmd");
});

test("resolveAgyBin honors explicit IMA2_AGY_BIN", () => {
  assert.equal(
    resolveAgyBin({ IMA2_AGY_BIN: "/custom/agy", PATH: "" }, "/tmp/missing-home", "linux"),
    "/custom/agy",
  );
});

test("resolveAgyBin falls back to ~/.local/bin when server PATH is minimal", async () => {
  const tempHome = await mkdtemp(join(tmpdir(), "ima2-agy-bin-test-"));
  const localBin = join(tempHome, ".local", "bin");
  const agyBin = join(localBin, agyCommandName("linux"));

  await mkdir(localBin, { recursive: true });
  await writeFile(agyBin, "#!/bin/sh\nprintf '1.0.10\\n'\n", { mode: 0o755 });
  await chmod(agyBin, 0o755);

  try {
    assert.deepEqual(agyLocalBinCandidates(tempHome, "linux")[0], agyBin);
    assert.equal(resolveAgyBin({ PATH: "/usr/bin" }, tempHome, "linux"), agyBin);
    assert.equal(
      buildAgyPathEnv({ PATH: "/usr/bin" }, agyBin),
      `${localBin}${delimiter}/usr/bin`,
    );
  } finally {
    await rm(tempHome, { recursive: true, force: true });
  }
});

test("resolveAgyBin keeps PATH lookup when no local candidate exists", () => {
  assert.equal(resolveAgyBin({ PATH: "/usr/bin" }, "/tmp/missing-home", "linux"), "agy");
  assert.equal(buildAgyPathEnv({ PATH: "/usr/bin" }, "agy"), "/usr/bin");
});
