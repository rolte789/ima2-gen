# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **GPT-5.6 rollout** — `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna` accepted as OAuth image models across server validators, prompt builder, CLI, and UI pickers; reasoning ladder gains `max` after `xhigh`. Defaults unchanged (`gpt-5.4-mini`).
- **Release tag guard** — `publish.yml` release path refuses to publish when the GitHub Release tag does not match `package.json` version.
- **Release flow is OIDC-only** — local `scripts/release.sh` and `release:*` scripts no longer run credentialed `npm publish`; they end at `gh release create`, which triggers the trusted-publishing workflow (`publish.yml`). `gh` CLI auth is now a required preflight; npm login is not needed locally.
- **SSE multiplexing** — shared `GET /api/events` endpoint with ring-buffer replay and `Last-Event-ID` reconnect support (`lib/eventBus.ts`, `routes/events.ts`).
- **Async POST generation mode** — multimode, node, and video routes accept async POST and dual-emit progress on both per-request SSE and the shared event bus.
- **Frontend event channel** — singleton `EventSource` client (`ui/src/lib/eventChannel.ts`) replaces per-request SSE streams for UI generation flows.
- **Subscribe-before-fetch contract** — `tests/async-stream-subscribe-order.test.js` locks the race where ultra-fast server publish could arrive before client handler registration.
- Store modularization — split monolithic `useAppStore` into focused impl modules (`storeGenImpl`, `storeNodeGenImpl`, `storeVideoImpl`, `storeInflightImpl`, etc.).
- Frontend/API barrel splits — `ui/src/lib/api.ts` and `ui/src/index.css` decomposed into ≤500-line modules.
- Storyboard workflow — 9-panel grid with black Panel 1 lead-in for image and video generation.
- Gallery hang fix — video decoder/connection exhaustion on focus change (RCA 01).

### Changed

- UI clients migrated from per-request SSE to `eventChannel` + async POST for multimode, node, and video generation.
- Multimode concurrency tracking uses `activeFlightIds` Set instead of `multimodeAbortControllers`.
- Test suite grew to **968** cases across **186** files (65 runtime-importing, 121 contract-only).

### Fixed

- SSE multiplexing hardening — inflight cancel/done race guards, replay-gap handling, subscribe/timeout/requestId races, and frontend reconnect/error parsing (`sseStreamError.ts`).
- Node route validation order — `startJob`/202 response moved after request validation.
- CI typecheck — unused imports in card-news tests and store split type mismatches.
- Thumbnail backfill failure reporting (#94).
- AGY provider detection now finds user-local `agy` installs such as `~/.local/bin/agy` and supports `IMA2_AGY_BIN` for explicit binary paths.
- AGY Windows pipe handling, Gemini API aspect ratio string values, multimode same-prompt batching.
- Moderation over-filtering — removed safety tags and added error enrichment.

## [2.0.4] - 2026-06-27

### Added

- **Result metadata inspector** — inspect generation result metadata from the UI (#108).
- **OAuth size directive** — reinforce non-auto resolutions with explicit LANDSCAPE / PORTRAIT / SQUARE orientation in the text prompt.
- **Release notes script** — `scripts/generate-release-notes.mjs` auto-categorizes conventional commits for GitHub Releases.

### Changed

- **Preview publish** — merged preview npm publish into the registered `publish.yml` workflow (OIDC trusted publisher); preview dist-tag on `preview` branch push, `latest` on GitHub Release.

### Docs

- `docs/IMAGE_RESOLUTION.md` — OAuth image resolution temporary limitation (~1.57M cap) and future policy undecided.

### CI

- OIDC precondition checks and npm version logging in publish workflow.

## [2.0.1] - 2026-06-03

### Added

- **Gemini API provider** (`provider: "gemini-api"`) — direct Generative Language API and Vertex AI paths with `nano-banana-2` / `nano-banana-pro` model picker, aspect ratio, and resolution controls.
- **Grok billing quota bar** — `$used/$limit` on QuotaCard via `GET /api/quota`.
- **Switch Account** — device-code OAuth re-auth for Grok and Codex without leaving the app.
- **Grok video model picker** — V / V1.5 selection in video controls.
- Image/video thumbnails and history sidebar cards.
- Centralized recursive thumbnail backfill.
- Gemini/Vertex API key management routes and web UI.

### Changed

- Provider plumbing and CLI parity for gemini-api, grok-api, and vertex paths.
- Grok model/size pickers and adapter updates.
- Pages and developer docs reorganized to be feature-centric.

### Fixed

- Preserve video metadata in sequence history and thumbnail fallbacks in history UI.
- Vertex AI integration — auth mode persistence, skip unsupported `response_format`, prefer Vertex over API key when both configured.
- Gemini image cost corrected to official pricing; aspect ratio/resolution UI layout polish.
- Skip GPT pixel-limit size confirm for Grok/Gemini providers.
- Reap orphaned codex device-auth child on abandoned Switch Account flow.
- Document Gemini providers in CLI help; harden provider paths and CLI metadata.

### Security

- Atomic `config.json` writes in keys routes; atomic token write with codex env scrubbing.
- Cap sharp input pixels to prevent decompression bombs.
- Audit fixes — crypto session IDs, session cap, double-click guard, API key in header only.

## [2.0.0] - 2026-06-02

### Added

- Major version bump packaging the Gemini API, Grok API key, Vertex AI, and expanded provider surface shipped in the 1.1.x preview line.

## [1.1.23] - 2026-06-02

### Added

- Gallery skeleton shimmer and F5 refresh fix (#93).
- Hero one-click install scripts on the documentation site.

## [1.1.22] - 2026-06-02

### Fixed

- Graceful shutdown releases file handles on Windows (EBUSY fix).
- Ctrl+C clean shutdown — database close, child process stop, file lock release.

## [1.1.21] - 2026-05-31

### Changed

- Bump bundled progrok 0.1.1 → 0.2.0 (video edit + extend commands).

## [1.1.15] - 2026-05-31

### Added

- **Agent Mode** — conversational image workspace with sessions, turns, durable queue, slash commands (`/api/agent/*`).
- **Grok provider** — bundled progrok, Classic/Node/Agent through search + planner + xAI Images API.
- **Video generation** — text/image/reference-to-video via Grok, edit/extend/frame/analyze routes, branch-local last-frame continuation.
- `GET /api/capabilities` discovery endpoint (#62).
- `POST /api/prompt-builder/chat` assistant and `ima2 prompt build` CLI wrapper.
- Grok model/size pickers, billing API, and `ima2 grok` helpers.

### Fixed

- Prompt Studio regression (#75), long-prompt preview (#77), prompt autofill perf (#78).
- Per-image metadata persistence (#79), batch comparison matrix (#80).

## [1.1.10] - 2026-05-06

### Added

- API-key provider Responses parity for generate/edit/multimode/node (#49).
- Masked-edit feature flag groundwork (`IMA2_OAUTH_MASKED_EDIT_ENABLED`, #31).
- Gallery default-to-current-session with All Images toggle (#42).
- Centralized `persistenceRegistry` for `ima2.*` localStorage keys (#43).
- `typecheck:tests` and `test:inventory` quality gates.

### Changed

- Split `lib/oauthProxy.ts` into `lib/oauthProxy/*` subtree.
- Added `lib/runtimeContext.ts`, `lib/responsesImageAdapter.ts`, `lib/providerOptions.ts`, `lib/errInfo.ts`, `lib/promptSafetyPolicy.ts`.

## [1.1.0] - 2026-04-25

### Added

- TypeScript migration complete — route, lib, server, config, and bin sources are `*.ts` with committed build artifacts.
- CLI feature parity with server API (#45).
- Canvas Mode workspace split and dual-mask cleanup.
- OS-trash soft-delete for history.

## [1.0.3] - 2026-04-23

### Added

- Initial npm publish of `ima2-gen` — local OAuth image generation studio with Classic mode, Node mode, Canvas Mode, and CLI.

[Unreleased]: https://github.com/lidge-jun/ima2-gen/compare/v2.0.1...HEAD
[2.0.1]: https://github.com/lidge-jun/ima2-gen/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/lidge-jun/ima2-gen/compare/v1.1.23...v2.0.0
[1.1.23]: https://github.com/lidge-jun/ima2-gen/compare/v1.1.22...v1.1.23
[1.1.22]: https://github.com/lidge-jun/ima2-gen/compare/v1.1.21...v1.1.22
[1.1.21]: https://github.com/lidge-jun/ima2-gen/compare/v1.1.20...v1.1.21
[1.1.15]: https://github.com/lidge-jun/ima2-gen/compare/v1.1.14...v1.1.15
[1.1.10]: https://github.com/lidge-jun/ima2-gen/compare/v1.1.9...v1.1.10
[1.1.0]: https://github.com/lidge-jun/ima2-gen/compare/v1.0.11...v1.1.0
[1.0.3]: https://github.com/lidge-jun/ima2-gen/releases/tag/v1.0.3
