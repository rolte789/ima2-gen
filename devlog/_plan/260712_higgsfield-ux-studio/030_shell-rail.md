---
created: 2026-07-12
tags: [ima2-gen, phase, shell, navigation]
---

# Phase 030 — 좌측 레일 + 라우팅

스펙: `002_shell-navigation.md`. 010/020으로 새 질감·컨트롤이 깔린 뒤
구조를 바꾼다. 여기까지가 "디자인/구조" 구간이고 신규 서버 기능은 없다.

## 범위

1. 아이콘 레일: 생성(classic) / 캔버스 / 노드 / 에이전트 / 설정.
   `UIModeSwitch` 흡수. 홈·자산 슬롯은 자리만 예약(060/050에서 활성화).
2. 해시 라우팅(`#create` `#canvas` `#node` `#agent`) + 새로고침 복원 +
   `persistenceRegistry.ts` 마지막 모드 저장.
3. 모바일: 레일 → 하단 탭바(`MobileAppBar` 확장).
4. 승격 동선 1차: 클래식 결과 → "캔버스에서 편집" 상시 액션만 먼저
   (나머지 체이닝은 040).

## 명시적 제외

- 홈 워크스페이스 내용물(→ 060), Assets 워크스페이스(→ 050).

## Done 기준

- 모든 기존 진입점 레일 경유 도달 + 해시 복원 계약 테스트.
- 390px 탭바 스크린샷 → `assets/030/`.

상태: **done** (2026-07-12 — NavRail 5슬롯+해시 라우팅+UIModeSwitch 삭제+sol 11항목 감사, assets/030/ 실화면 검수)

## Diff-Level Record

커밋: `2b552d5` (`2b552d5c09688c2f129fb2c74eb6bc26010cb229`)

비교 범위: `690073e..2b552d5` — **26 files, +505 / -240**. 이 범위에는
Phase 030뿐 아니라 선행 Settings polish 3커밋(`48a110c`, `3e71bd5`,
`fb5af2d`)이 포함된다. 따라서 NavRail의 핵심 신규 표면은 아래 2개 파일
(합계 **+269 / -0**)이며, 26파일 전체 수치를 NavRail 단독 수치로 해석하지 않는다.

| 구분 | 파일 | Diff |
|---|---|---:|
| Docs | `structure/01-file-function-map.md` | +1 / -1 |
| Docs | `structure/02-command-reference.md` | +11 / -4 |
| Contract | `tests/agent-mode-frontend-contract.test.js` | +3 / -3 |
| Contract | `tests/card-news-frontend-contract.test.js` | +6 / -3 |
| Contract | `tests/cli-skill-command-contract.test.js` | +16 / -0 |
| Contract | `tests/gallery-navigation-ux-contract.test.js` | +5 / -5 |
| Wiring | `ui/src/App.tsx` | +2 / -0 |
| Settings polish | `ui/src/components/AccountSettings.tsx` | +36 / -4 |
| Core | `ui/src/components/NavRail.tsx` | +182 / -0 |
| Settings polish | `ui/src/components/SettingsWorkspace.tsx` | +3 / -10 |
| Shell cleanup | `ui/src/components/Sidebar.tsx` | +0 / -2 |
| Replacement | `ui/src/components/UIModeSwitch.tsx` | +0 / -58 |
| Settings polish | `ui/src/components/settings/QuotaCard.tsx` | +70 / -75 |
| Labels/polish | `ui/src/i18n/en.json` | +10 / -7 |
| Labels/polish | `ui/src/i18n/ko.json` | +10 / -7 |
| Wiring | `ui/src/index.css` | +1 / -0 |
| Shell cleanup | `ui/src/styles/agent-panels-composer.css` | +0 / -4 |
| Shell cleanup | `ui/src/styles/agent-workspace.css` | +6 / -2 |
| Mixed shell/polish | `ui/src/styles/canvas-viewer.css` | +18 / -9 |
| Shell cleanup | `ui/src/styles/classic-workspace.css` | +4 / -4 |
| Core | `ui/src/styles/nav-rail.css` | +87 / -0 |
| Shell cleanup | `ui/src/styles/node-workspace.css` | +0 / -24 |
| Settings polish | `ui/src/styles/quota-card.css` | +2 / -4 |
| Wiring | `ui/src/styles/responsive-layout.css` | +1 / -0 |
| Settings polish | `ui/src/styles/settings-controls.css` | +19 / -2 |
| Theme/polish | `ui/src/styles/themes.css` | +12 / -12 |

Before -> After:

- 화면별 `UIModeSwitch`와 분산된 설정 진입점 -> 선언형 `RAIL_ITEMS` 기반 전역 NavRail.
- Zustand 내부 모드만으로 전환 -> `#create`, `#canvas`, `#node`, `#agent`, `#settings`와 상태를 양방향 동기화하고 새로고침 시 복원.
- Settings를 workspace mode처럼 취급 -> `settingsAction` overlay 목적지로 분리.
- 데스크톱 전용 workspace 전환 -> 같은 목적지를 모바일 safe-area 하단 bar로 투영.

### Sub-phase 031 — duplicate settings entry removal

커밋: `6be0d4b` (`6be0d4b9df42af267a8c574cb7d2e8e32530e790`);
비교 범위 `2b552d5..6be0d4b` — **1 file, +0 / -2**.

| 파일 | Diff | Before -> After |
|---|---:|---|
| `ui/src/components/Sidebar.tsx` | +0 / -2 | Sidebar의 `SettingsButton` import/render -> NavRail의 단일 전역 설정 진입점 |
