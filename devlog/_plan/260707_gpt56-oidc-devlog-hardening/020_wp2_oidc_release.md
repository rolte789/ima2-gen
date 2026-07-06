# WP2 — OIDC release transition (local flow stops direct `npm publish`)

Production publishing already runs through `.github/workflows/publish.yml`
(npm trusted publishing / OIDC): GitHub Release → `latest`, `preview` branch
push → `preview` dist-tag, with npm >= 11.5.1 + OIDC endpoint preconditions.
The remaining gap: local tooling still performs credentialed `npm publish`.

## File change map

- `package.json`
  - `release:patch|minor|major`: replace
    `npm version X && npm publish && git push origin main --tags` with
    `./scripts/release.sh patch|minor|major` (single entry point; script owns
    collision handling and ends at `gh release create`).
- `scripts/release.sh`
  - Drop the `npm whoami` preflight (no npm credentials needed locally);
    require `gh auth status` instead.
  - Remove the `npm publish --access public` step entirely.
  - Keep: worktree-clean check, version detection/bump, build, commit, tag,
    push commit+tag, `gh release create` (now REQUIRED, not best-effort —
    the Release event is what triggers the OIDC publish).
  - End with a pointer to the Actions run:
    `gh run list --workflow=publish.yml --limit 1` hint + release URL.
- `structure/06-infra-operations.md`
  - §npm Publish (OIDC): state local `release.sh` is now a release-trigger
    only (no direct publish path remains); update the 2026-06-27 note with a
    2026-07-07 entry.
- `docs/README.ko.md` — refresh the OIDC line if it still implies local publish.
- `CHANGELOG.md` — Unreleased entry: local release flow now OIDC-only.

## Accept criteria

- `rg -n "npm publish" package.json scripts/release.sh` → only hits inside
  comments or the preview note, none executable in the local path.
- `bash -n scripts/release.sh` exits 0.
- typecheck/typecheck:tests/test/test:inventory stay green (no src changes).

## Out of scope

- Running a release; touching `publish.yml` (already correct); npm tokens.
