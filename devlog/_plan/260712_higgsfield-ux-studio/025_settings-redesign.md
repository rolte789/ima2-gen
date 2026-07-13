---
created: 2026-07-12
tags: [ima2-gen, phase, settings, uiux, design-read]
---

# Phase 025 — 설정 워크스페이스 재설계

현 `SettingsWorkspace`는 6섹션(account / generation / appearance /
workspace / language / future) 균등 나열 스크롤 문서다. 슬롭 진단:

- **"future" 플레이스홀더 섹션** — 빈 약속은 필러. 삭제 대상.
- **위계 없음** — API 키 입력(1회성)과 기본 품질(가끔)과 언어(거의 안 바꿈)가
  전부 같은 무게의 섹션. 설정이 아니라 목차다.
- **워크스페이스 컨트롤과 중복** — generation 기본값은 RightPanel과 겹친다.
  같은 결정을 두 곳에서 하게 만드는 구조.
- 010 이후 theme 항목 소멸(다크 단일) → appearance 섹션 근거 약화.

## Design Read (cxc-dev-uiux-design)

```yaml
---
name: ima2-settings
colors:
  primary: "#f4f4f6"
  accent: "#cfd2dd"      # 프리즘은 생성 순간 전용 — 설정에서는 무채
  background: "#0b0b0f"
typography:
  heading: { fontFamily: Clash Display, fontSize: 20px }
  body: { fontFamily: "Satoshi / Pretendard Variable", fontSize: 14px }
  meta: { fontFamily: IBM Plex Mono, fontSize: 11px }
---
```

Reading this as: 로컬 스튜디오 도구의 환경설정면, 사용자는 파워유저 본인.
DaVinci Resolve 환경설정이나 시네마 카메라 메뉴의 밀도 — 장비 패널이지
제품 소개 페이지가 아니다.

Do's: 상태는 mono 상태 칩으로(연결됨 / 키 없음 / 쿼터 82%), 섹션 라벨은
mono uppercase eyebrow, 글래스 패널 카드.
Don'ts: 빈 섹션, 마케팅형 설명문, 프리즘 그라데이션 장식, 이모지.

```
DESIGN_VARIANCE: 3
MOTION_INTENSITY: 1
Product density profile: D5
Reasoning: 반복 작업 도구의 설정면 — 밀도는 높이고 시각 변주는 억제,
모션은 피드백만.
```

## IA 재배치 (Lazy-User Gate 적용)

| 항목 | 처분 | 근거 |
|---|---|---|
| future 섹션 | **삭제** | 필러. 로드맵은 devlog 소관. |
| theme(appearance) | **삭제** | 010 다크 단일화로 소멸. |
| generation 기본값 | **흡수(수정)** | RightPanel 컨트롤이 진실원. 항목들은 Providers 그룹의 컴팩트 행으로 흡수. *steering 2026-07-12: "기본값으로 저장" 액션은 신규 스토어 로직이라 025의 "표현만 변경" 계약과 충돌 → 보류하고 중복 축소로 대체. 필요해지면 별도 phase.* |
| language | **강등** | 시스템 로캘 자동 감지 default + 하단 한 줄 셀렉트로. |
| account + providers | **통합 승격** | 설정의 실제 존재 이유. 프로바이더별 카드(키/OAuth 상태 칩 + QuotaCard + Switch Account)로 첫 화면. |
| workspace | 유지 | 프로필/저장 경로 등 1회성 설정 성격에 맞음. |

결과: 6섹션 → 3그룹(Providers / Workspace / General). 화면당 primary
action 하나 원칙 유지.

## 범위

1. IA 재배치 표대로 섹션 통폐합(`SettingsWorkspace.tsx` + settings/*).
2. 프로바이더 카드 UI: 상태 칩(mono), QuotaCard 통합, 키 입력은 카드 내
   인라인(020 컨트롤 킷 소비 1호 화면 — 킷 쇼케이스로 삼는다).
3. 섹션 인덱스는 유지하되 3그룹으로 축소, eyebrow 라벨 적용.
4. i18n 키 정리(`settings.sections.*` 재편, ko/en 동기).

## 의존/제외

- 010(토큰)·020(컨트롤 킷) 선행 필수. 030(레일)과는 독립.
- 신규 설정 항목 추가 없음. 서버 API 무변경.
- 감사(sol/Darwin) 반영 v3: 진입점 3곳(useAppStore 기본값,
  ProviderReadinessPopup, OnboardingPopup)을 `providers`로 이동,
  LanguageToggle은 이미 세그먼트 문법이라 유지(steering), Gemini/Vertex는
  API-key 아코디언 IA 유지(카드화는 시각 구조만), 클래스 계약 동결
  `.provider-card` / `.provider-card__head` / `.provider-chip--ok|warn|err`.

## Done 기준

- settings persistence 계약 테스트 green(키 재편 마이그레이션 포함).
- 3그룹 구조 스크린샷 → `assets/025/`.
- 키보드 전 조작 + 스크린리더 섹션 랜드마크 확인.

상태: **done** (2026-07-12 — 게이트 green, assets/025/ 실화면 검수, 6섹션→3그룹+프로바이더 카드 완료)

후속(2026-07-12, 사용자 제안): USAGE QUOTA 별도 행을 폐지하고 쿼터를
프로바이더 카드 안으로 통합 — Codex 쿼터+계정 전환은 GPT OAuth 카드,
Grok 쿼터+전환은 Grok 카드 내부로(useQuotaData 훅 공유 fetch 1회).
증거: assets/026/quota-merged.png

## Diff-Level Record

- 커밋: `7c01ab7`
- 비교 범위: `6d2e236..7c01ab7`
- 통계: **16 files, +188 / −221** (`git diff --stat 6d2e236..7c01ab7`)

| 파일 | + | − | diff-level 역할 |
|---|---:|---:|---|
| `tests/prompt-studio-ui-contract.test.js` | 3 | 2 | 프롬프트 스튜디오의 변경된 settings 계약 고정 |
| `tests/settings-workspace-layout-contract.test.js` | 4 | 4 | 6섹션 기대를 3그룹 IA 계약으로 교체 |
| `ui/src/components/AccountSettings.tsx` | 38 | 30 | provider 별 glass card, 상태 chip, 인라인 control 구성 |
| `ui/src/components/GeminiKeySection.tsx` | 8 | 7 | Gemini/Vertex key 행을 provider-card IA에 맞게 정렬 |
| `ui/src/components/ImageModelSelect.tsx` | 18 | 17 | native `<select>` 잔여분을 control-kit `Select`로 전환 |
| `ui/src/components/OnboardingPopup.tsx` | 1 | 1 | settings 진입 section을 `providers`로 변경 |
| `ui/src/components/ProviderReadinessPopup.tsx` | 1 | 1 | provider readiness 진입점을 `providers`로 변경 |
| `ui/src/components/SettingsWorkspace.tsx` | 24 | 43 | 6섹션 스크롤 문서를 Providers/Workspace/General 3그룹으로 축소 |
| `ui/src/components/settings/WorkspaceProfileSettings.tsx` | 6 | 11 | workspace 설정을 컴팩트 행 구조로 정리 |
| `ui/src/i18n/en.json` | 8 | 39 | 삭제된 section 키 제거 및 3그룹 label 동기화 |
| `ui/src/i18n/ko.json` | 8 | 39 | 영문과 동일한 IA로 한국어 키 축소 |
| `ui/src/store/useAppStore.ts` | 3 | 3 | 기본 settings section을 `account`에서 `providers`로 이동 |
| `ui/src/styles/canvas-accordion.css` | 0 | 22 | 이전 settings/accordion 표현 제거 |
| `ui/src/styles/responsive-mobile.css` | 1 | 1 | 변경된 settings 구조의 mobile selector 보정 |
| `ui/src/styles/settings-controls.css` | 64 | 0 | glass provider card, head, chip, row 시각 계약 추가 |
| `ui/src/types.ts` | 1 | 1 | `SettingsSection` union을 6개에서 3개로 축소 |

### Before → After Patterns

- `account | generation | appearance | workspace | language | future` →
  `providers | workspace | general`.
- 평면적인 OAuth/API/Grok/Antigravity settings row → provider 별 glass
  card + mono 상태 chip + 카드 내 인라인 control.
- 화면별 native `<select>` → 020 control-kit `Select`.
- `account`를 가리키던 onboarding/readiness/default 진입점 →
  통합된 `providers` 진입점.
- 중복된 generation/appearance/future 섹션 → 실제 설정 목적만
  남긴 고밀도 workspace.

### Settings Polish Chain (027-029)

025의 IA 재설계와 026의 contrast/deboxing 뒤에 이어진 settings
전용 후속 폴리시 연쇄다.

#### 027 — Quota → Provider Card Merge

- 커밋: `48a110c` | 범위: `690073e..48a110c`
- 통계: **6 files, +77 / −70**

| 파일 | + | − | 변경 |
|---|---:|---:|---|
| `ui/src/components/AccountSettings.tsx` | 4 | 0 | provider card에 quota slot 연결 |
| `ui/src/components/SettingsWorkspace.tsx` | 0 | 2 | 독립 quota section render 제거 |
| `ui/src/components/settings/QuotaCard.tsx` | 71 | 60 | 독립 카드를 provider 내부 inline quota로 재구성 |
| `ui/src/i18n/en.json` | 0 | 2 | 독립 quota section label 제거 |
| `ui/src/i18n/ko.json` | 0 | 2 | 독립 quota section label 제거 |
| `ui/src/styles/quota-card.css` | 2 | 4 | provider-card 내 inline 배치로 축소 |

독립 `USAGE QUOTA` 행 → 해당 OAuth/Grok provider card 내 quota +
account switch 문맥.

#### 028 — Provider Card Line Condensation

- 커밋: `3e71bd5` | 범위: `48a110c..3e71bd5`
- 통계: **3 files, +21 / −37**

| 파일 | + | − | 변경 |
|---|---:|---:|---|
| `ui/src/components/settings/QuotaCard.tsx` | 15 | 31 | multi-line quota 블록을 single-line condensed row로 축소 |
| `ui/src/i18n/en.json` | 3 | 3 | 한 줄 배치에 맞는 축약 label |
| `ui/src/i18n/ko.json` | 3 | 3 | 영문과 동일한 축약 label |

multi-line quota label/value → 라벨과 값을 한 줄에 둔 condensed row.

#### 029 — Minimal Chrome + One-Line Provider Heads

- 커밋: `fb5af2d` | 범위: `3e71bd5..fb5af2d`
- 통계: **6 files, +67 / −27**

| 파일 | + | − | 변경 |
|---|---:|---:|---|
| `ui/src/components/AccountSettings.tsx` | 32 | 4 | SVG icon + provider name + status chip 한 줄 head |
| `ui/src/components/SettingsWorkspace.tsx` | 3 | 8 | settings 외곽 chrome과 중복 설명 축소 |
| `ui/src/i18n/en.json` | 0 | 2 | 불필요한 chrome copy 제거 |
| `ui/src/i18n/ko.json` | 0 | 2 | 불필요한 chrome copy 제거 |
| `ui/src/styles/canvas-viewer.css` | 13 | 9 | 연관 viewer padding/배치 정리 |
| `ui/src/styles/settings-controls.css` | 19 | 2 | one-line provider head 스타일 |

설명과 chrome가 두꺼운 provider card head → icon/name/status가 한 줄인
minimal head; settings shell 장식과 중복 copy → 최소 chrome.
