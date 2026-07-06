# WP3 — devlog hardening

`devlog/_plan/README.md` active-lane table was last updated 2026-06-11 and no
longer matches the folder listing (33 entries incl. 9 loose `.md` files). The
SSE multiplexing work shipped (v2.0.0+), grok-video-15-1080p shipped (v2.0.5),
docs-refresh + preview-deploy-pipeline shipped (v2.0.4). AGENTS.md still says
v2.0.1 / 968 tests (actual: 2.0.5 / 1066).

## Audit rule

A unit moves `_plan` → `_fin` only with closeout evidence: shipped code +
tests in the current tree, or a CHANGELOG/release mention. Anything ambiguous
stays in `_plan` and is only re-labeled in the README table. Loose `.md`
audits that describe completed/shipped investigations move into `_fin` as
single-file entries (keep filename). No content edits to moved docs, no
deletions, no history rewrites.

## Candidate moves (verify each before moving)

- `260608_sse-*.md` (4 files) + `260608_sse-multiplexing-eventbus.md` — SSE
  multiplexing shipped in v2.0.0 (CHANGELOG); AGENTS.md describes the SSE
  architecture as current. → `_fin`.
- `260629_grok-video-15-1080p/` — shipped in v2.0.5 (HEAD release commits).
- `260627_docs-refresh/`, `260627_preview-deploy-pipeline/`,
  `260628_wp6_docs_code_grounding/` — shipped in v2.0.4 (CHANGELOG mentions
  preview publish + docs).
- `260602_post-release-security-audit.md`, `260602_agy-provider-audit.md`,
  `260602_node-session-evaporation-fix.md`, `260603_dropin-auth-flow-overhaul.md`
  — verify by checking whether referenced fixes exist in code; move only if closed.
- `00_model-selector-visibility.md` — non-conforming name; if still active,
  folder it or move to `_future`; if shipped, `_fin`.

## Doc updates

- `devlog/_plan/README.md` — rewrite active-lane table to the post-move listing.
- `structure/07-devlog-map.md` — refresh counts/paths.
- `AGENTS.md` — v2.0.1 → v2.0.5, 968 → 1066 tests (two spots: intro + Test
  Command section).

## Accept criteria

- `ls devlog/_plan` matches the README table 1:1 (minus README/_future).
- All gates still green (docs-only phase; run full suite anyway per loop rule).
