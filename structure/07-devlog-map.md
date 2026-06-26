---
created: 2026-06-08
tags: [ima2-gen, structure-docs, devlog, roadmap]
---

# Devlog Map

This document maps the `devlog/` folder structure and explains how to navigate planning, in-progress, and completed work.

## Folder Structure

```
devlog/
├── 00_sse-multiplexing-architecture.md   # SSE multiplexing design doc
├── 01_sse-multiplexing-risk-summary.md   # Integrated risk matrix
├── _plan/                                # Active planning and research
├── _fin/                                 # Completed work (archived)
└── _artifacts/                           # Supporting artifacts
```

## Naming Convention

Devlog entries use decade-range numbering within each initiative:

| Range | Purpose |
|-------|---------|
| 00–09 | Research, specs, architecture docs |
| 10–19 | Phase 1 implementation |
| 20–29 | Phase 2 implementation |
| 30–39 | Phase 3 implementation |

Top-level entries (`00_*.md`, `01_*.md`) are cross-cutting architecture documents not scoped to a single issue.

## Active Plans (`_plan/`)

Files in `_plan/` are work-in-progress. They use the format `YYMMDD_<topic>` to aid chronological sorting. Each plan typically maps to a GitHub issue or a standalone initiative.

| Date Range | Focus |
|------------|-------|
| 260428–260430 | Canvas, provider, import features |
| 260514–260516 | CLI parity, agent mode, hardening |
| 260529–260602 | Video, Agent UI, gallery, Gemini providers |
| 260602–260608 | Security audit, SSE multiplexing, deployment readiness |
| 260624–260627 | AGY integration, preview deploy pipeline, docs refresh (2.0.4) |

## Completed Work (`_fin/`)

When an initiative is fully shipped and merged, its plan folder moves to `_fin/`. Each `_fin/` entry typically contains a `README.md` with a summary, plus phase-specific logs.

### Key Completed Milestones

| Archive | Description |
|---------|-------------|
| `260428_issue33-mobile-overhaul-logs` | Mobile shell redesign |
| `260429_app-weight-reduction` | Code splitting and bundle diet |
| `260429_issue45-cli-feature-parity` | CLI ↔ server API parity |
| `260430_issue24-typescript-strict-cleanup` | TypeScript strict migration |
| `260508_issue60-multimode-incremental-progress` | Multimode per-slot progress |
| `260516_agent-mode-codex-rs-workspace` | Agent Mode implementation |
| `260602_gemini-vertex-api-provider` | Gemini/Vertex provider integration |
| `260604_500-line-split` | Source file ≤500-line enforcement |
| `260621_issue95-generation-request-log` | Generation request log (#95) |
| `260627_preview-deploy-pipeline` | npm preview OIDC publish pipeline |

Snapshot note, 2026-06-27: current release is `ima2-gen@2.0.4`. Active `_plan/` includes `260627_docs-refresh` (structure/docs code-grounding).

## Cross-References

| Document | Relation |
|----------|----------|
| `[[00-structure-hub]]` | Parent hub — reading order and document map |
| `[[05-node-mode]]` | Node mode devlog entries reference graph session changes |
| `[[06-infra-operations]]` | Build/test infra devlog entries |

## How to Use

1. Check `_plan/` for active work before starting a new initiative — there may be prior research.
2. When finishing an initiative, move its `_plan/` entry to `_fin/` with a `README.md` summary.
3. Top-level numbered docs (e.g., `00_*.md`) are persistent architecture references, not initiative-scoped.
