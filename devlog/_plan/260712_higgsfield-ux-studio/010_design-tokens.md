---
created: 2026-07-12
tags: [ima2-gen, phase, design-tokens]
---

# Phase 010 — 토큰/질감 이식 + 다크 단일화

스펙: `001_design-language.md`. 이 phase는 **값 교체와 레이어 추가만** 한다.
컴포넌트 구조, 마크업, 동작은 건드리지 않는다. 가장 명확하고 되돌리기 쉬운
단위라 첫 phase.

2026-07-12 결정: **테마는 다크 단일로 간다.** 라이트 테마와 `ThemeToggle`을
제거하고 팔레트 하나만 유지한다(사용자 결정 — 90 미결정 원장에서 해소).
미디어-퍼스트 스튜디오에서 라이트는 유지 비용만 있고 쓰임이 없다.

## 범위

1. `ui/src/index.css` 토큰 값 교체: `--bg #0b0b0f`, surface/border 계열을
   사이트 팔레트(`#14141a`/`#15151c`/`#26262f`)로. 토큰 이름은 유지.
2. 신규 토큰 추가: `--prism`, `--chrome`, `--glass`, `--glass-line`
   (이 phase에서는 정의만, 소비는 020부터).
3. 앱 셸 루트에 노이즈 오버레이 + 듀얼 radial glow 레이어. 노드 캔버스·
   이미지 뷰어·비디오 재생 영역 위에서는 비활성.
4. 서체 교체: Clash Display(디스플레이) / Satoshi+Pretendard(본문) /
   IBM Plex Mono(메타·비용·상태). 사이트와 동일 소스 self-host.
5. 다크 단일화: `:root[data-theme="light"]` 블록 + `ThemeToggle` +
   테마 persistence 키 제거. `data-theme` 분기 소비처 정리.

## 명시적 제외

- 컴포넌트별 스타일 리라이트(→ 020), 레이아웃 변경(→ 030).

## Done 기준 — 2026-07-12 전부 충족

- `cd ui && npm run build` + 기존 테스트 green.
  → typecheck/typecheck:tests PASS, npm test 1133 pass 0 fail, vite build OK.
- 클래식/노드/에이전트/설정 4면 스크린샷 → `assets/010/` (라이브 서버 실검수).
- 잔재 0건: `rg 'data-theme|ThemeToggle|themeFamily|ima2:theme|Outfit|Geist' ui/src ui/index.html`.
- 노이즈 레이어는 fixed 오버레이 + 불투명 패널 커버 방식이라 스크롤 레이어
  영향 없음(합성 1회). 워커 증거: `.codexclaw/evidence/260712-phase-010-theme-removal.md`.

구현 노트: 테마는 라이트만이 아니라 **5패밀리(default/gpt/claude/gemini/grok)
시스템 전체**를 제거했다(themes.css 467→82줄). 폰트는 Fontshare/Google에서
woff2를 받아 `ui/public/fonts/` self-host 7종(사이트는 CDN 유지 — 사이트
측 참고사항). index.html 테마 부트스트랩 스크립트 삭제, meta color-scheme
추가. 계획 감사는 sol 리뷰어 2라운드(블로커 8건 수용) 후 진행.

상태: **done** (2026-07-12)

## Diff-Level Record

- 커밋: `67b2e01`
- 범위: `dc09410..67b2e01`
- 기준선: `dc09410`은 Phase 010 적용 전(pre-phase) baseline이다.
- 집계: 26 files changed, +170 / -761, binary fonts 7개 추가.

| 경로 | 작업 | + / - |
|---|---|---:|
| `devlog/_plan/README.md` | MODIFY | +2 / -1 |
| `structure/01-file-function-map.md` | MODIFY | +5 / -5 |
| `tests/node-ui-contract.test.js` | MODIFY | +11 / -7 |
| `ui/index.html` | MODIFY | +21 / -21 |
| `ui/public/fonts/ClashDisplay-600.woff2` | NEW | binary |
| `ui/public/fonts/ClashDisplay-700.woff2` | NEW | binary |
| `ui/public/fonts/IBMPlexMono-400.woff2` | NEW | binary |
| `ui/public/fonts/IBMPlexMono-500.woff2` | NEW | binary |
| `ui/public/fonts/Satoshi-400.woff2` | NEW | binary |
| `ui/public/fonts/Satoshi-500.woff2` | NEW | binary |
| `ui/public/fonts/Satoshi-700.woff2` | NEW | binary |
| `ui/src/App.tsx` | MODIFY | +1 / -28 |
| `ui/src/components/SettingsWorkspace.tsx` | MODIFY | +0 / -10 |
| `ui/src/components/ThemeToggle.tsx` | DELETE | +0 / -117 |
| `ui/src/i18n/en.json` | MODIFY | +1 / -3 |
| `ui/src/i18n/ko.json` | MODIFY | +1 / -3 |
| `ui/src/index.css` | MODIFY | +98 / -53 |
| `ui/src/store/persistenceRegistry.ts` | MODIFY | +17 / -24 |
| `ui/src/store/storePersistence.ts` | MODIFY | +0 / -32 |
| `ui/src/store/storeTypes.ts` | MODIFY | +0 / -11 |
| `ui/src/store/storeUIImpl.ts` | MODIFY | +1 / -14 |
| `ui/src/store/useAppStore.ts` | MODIFY | +1 / -19 |
| `ui/src/styles/sidebar.css` | MODIFY | +2 / -2 |
| `ui/src/styles/themes.css` | MODIFY | +9 / -394 |
| `ui/src/styles/viewer-workflow.css` | MODIFY | +0 / -6 |
| `ui/src/types.ts` | MODIFY | +0 / -11 |

Before → After 핵심 패턴:

- `ThemeToggle`과 테마 선택/persistence 상태 → 다크 단일 visual identity.
- 5개 테마 패밀리를 담던 `themes.css` → canvas/minimap용 최소 토큰만 유지.
- 평면 단색 팔레트 → `--prism`, `--chrome`, `--glass`, glow/grain을 포함한 site-texture 토큰.
- Outfit/Geist 및 외부 서체 의존 → Satoshi/Clash Display/IBM Plex Mono 7종 self-host.
