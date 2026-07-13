---
created: 2026-07-12
tags: [ima2-gen, phase, controls, components]
---

# Phase 020 — 컨트롤 킷 통일 (방식 변경, 기능 무변경)

스펙: `001_design-language.md`의 마이크로 인터랙션 절 + 이 문서.
지금 우측 패널/설정에는 컨트롤 방식이 컴포넌트마다 제각각이다
(`OptionGroup` 세그먼트, `ProviderSelect`/`ImageModelSelect`/
`GrokModelPicker` 셀렉트, `SizePicker`/`CountPicker`/`ReasoningEffortSelect`,
`WebSearchToggle`/`MobileSettingsToggle` 토글, `HistoryStripLayoutToggle`).
이걸 한 벌의 컨트롤 킷으로 통일한다. 상태/로직은 그대로, 표현만 바꾼다.

## 범위

1. **컨트롤 킷 신설** (`ui/src/components/controls/`):
   - `Select` — 글래스 드롭다운(패널+blur), 키보드 내비, 항목에 부가정보
     슬롯(모델 설명·비용 힌트).
   - `Segmented` — 2~4택 세그먼트(현 OptionGroup 대체).
   - `Chip`/`ChipRow` — 선택형 칩. **060 프리셋·070 멘션이 그대로 재사용하는
     기반 컴포넌트**라 이 phase에서 먼저 만든다(디자인→기능 의존의 대표 예).
   - `Toggle` — 남길 곳(단순 on/off)에만. 다값 토글은 Segmented나 Select로
     전환.
2. **전환 매핑** (2026-07-12 확정 — sol 감사 2라운드 반영):

   | 기존 컨트롤 | 처분 | 비고 |
   |---|---|---|
   | `OptionGroup` | **Segmented로 이관** | 계약·클래스명 완전 보존 shim 재수출 + 화살표 키 내비 추가. 소비처 3곳 무변경 |
   | `GrokModelPicker` | Segmented 소비로 전환 | 수제 option-btn 마크업 제거 |
   | `ReasoningEffortSelect` (native select) | **controls/Select** | 글래스 리스트박스 |
   | `settings/GrokPlannerSelect` (native select) | controls/Select | |
   | `VideoControlsPanel` 모델 select | controls/Select | 해당 select만, 나머지 불변 |
   | `WebSearchToggle` label 변형 | **controls/Toggle**(스위치) | compact 아이콘 변형은 그대로 |
   | `HistoryStripLayoutToggle` | Segmented (`history-layout-toggle` 클래스 유지) | 3택 |
   | `SizePicker` / `CountPicker` 그리드 | 유지 + CSS 토큰 재스타일 | 그리드가 옳은 형태 |
   | `ProviderSelect` | 유지 (025에서 카드로 재설계) | |
   | `ImageModelSelect` | **020 불개입** | `.image-model-select__*`를 에이전트 레인(AgentModelSelector)이 공유 — 010 토큰 승계로 충분 |
   | SettingsWorkspace 갤러리 스코프 select | 025로 이연 | 설정 재설계에서 킷 소비 |
   | `WorkspaceProfileSettings` / `GeminiKeySection` select | 025로 이연 | 〃 |
   | `ImageModelSelect` settings 변형 native select | 025로 이연 | |
   | card-news `TextFieldCard` select 4곳 | 무기한 이연 | dev-only 표면 |

3. 라벨 문법 통일: mono 11px uppercase eyebrow(사이트 `.section-tag` 등가).
   **결정**: `.section-title`은 컴포저 PROMPT/프로바이더 헤딩/비디오 라벨/
   히스토리 헤딩 등 앱 전역 마이크로 라벨에 쓰이며 전부 라벨 문법 대상이
   맞음 — 전역 적용 승인(본문 헤딩 사용처 없음, 감사로 확인).
4. 포커스/hover 규칙: `:focus-visible` 시안 아웃라인, foil-hover는
   Generate 계열에만.

## 명시적 제외

- 컨트롤의 의미/옵션 변경, 새 설정 항목 추가.

## Done 기준

- 전환 매핑 표 100% 채움 + 컴포넌트별 교체 완료.
- 기존 계약 테스트 green(특히 settings persistence, mobile compose).
- 키보드 전 조작 가능(셀렉트/세그먼트 tab-arrow-enter) 확인.

상태: **done** (2026-07-12, 커밋 6d2e236 — 게이트 green, assets/020/ 실화면 검수)

## Diff-Level Record

- 커밋: `6d2e236`
- 범위: `67b2e01..6d2e236`
- 집계: 19 files changed, +631 / -119.

| 경로 | 작업 | + / - |
|---|---|---:|
| `tests/gallery-navigation-ux-contract.test.js` | MODIFY | +1 / -1 |
| `tests/settings-workspace-layout-contract.test.js` | MODIFY | +3 / -1 |
| `ui/src/components/GenerateButton.tsx` | MODIFY | +1 / -1 |
| `ui/src/components/GrokModelPicker.tsx` | MODIFY | +7 / -17 |
| `ui/src/components/HistoryStripLayoutToggle.tsx` | MODIFY | +9 / -17 |
| `ui/src/components/OptionGroup.tsx` | MODIFY | +5 / -46 |
| `ui/src/components/ReasoningEffortSelect.tsx` | MODIFY | +12 / -12 |
| `ui/src/components/VideoControlsPanel.tsx` | MODIFY | +6 / -8 |
| `ui/src/components/WebSearchToggle.tsx` | MODIFY | +12 / -0 |
| `ui/src/components/controls/Chip.tsx` | NEW | +63 / -0 |
| `ui/src/components/controls/Segmented.tsx` | NEW | +77 / -0 |
| `ui/src/components/controls/Select.tsx` | NEW | +165 / -0 |
| `ui/src/components/controls/Toggle.tsx` | NEW | +35 / -0 |
| `ui/src/components/controls/index.ts` | NEW | +4 / -0 |
| `ui/src/components/settings/GrokPlannerSelect.tsx` | MODIFY | +6 / -8 |
| `ui/src/index.css` | MODIFY | +8 / -0 |
| `ui/src/styles/controls.css` | NEW | +209 / -0 |
| `ui/src/styles/form-controls.css` | MODIFY | +5 / -5 |
| `ui/src/styles/sidebar.css` | MODIFY | +3 / -3 |

Before → After 핵심 패턴:

- 화면별 option button/native select/독자 toggle → `Segmented`, `Select`, `Toggle`, `Chip` 4개 공용 primitive.
- 산재한 컨트롤 스타일 → 신규 `controls.css`의 `.ctl-*` 규칙으로 통합.
- `OptionGroup` 직접 렌더링 → 기존 props·클래스 계약을 보존하는 `Segmented` shim 재수출.
- 개별 키보드 동작 편차 → Segmented 방향키 순환과 Select listbox 탐색으로 일관화.
