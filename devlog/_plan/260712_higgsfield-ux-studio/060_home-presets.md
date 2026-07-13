---
created: 2026-07-12
tags: [ima2-gen, phase, home, presets]
---

# Phase 060 — 홈 진입면 + 프리셋 시스템

스펙: `003_home-presets.md` 전체. 020의 `Chip`/`ChipRow`와 050의 저장
계층 위에 얹는다. 이 레인의 체감 정점.

## 범위

1. `lib/presetCompiler.ts` — 프리셋 → 프로바이더별 프롬프트 조각/파라미터
   컴파일(순수 함수).
2. 시드 프리셋: 카메라 모션 ~20 / 스타일 ~15 / 조명 ~10 (JSON 시드).
   미리보기 썸네일·영상은 ima2 자체 생성으로 제작.
3. 컴포저 프리셋 칩(020 Chip 재사용) — 본문과 분리 저장, 생성 시 컴파일,
   XMP에 `presetIds` 기록.
4. `#home` 워크스페이스(레일 슬롯 활성화): 프롬프트 박스 + 프리셋 그리드 +
   최근 이어가기 스트립.
5. 미결정: 홈을 기본 진입 모드로 할지(현행 classic 유지 vs 홈) — 090 원장.

## Done 기준

- 컴파일러 프리셋×프로바이더 스냅샷 테스트 + 칩 저장/복원 계약.
- 동일 프리셋 Grok/Gemini 실생성 비교 수동 검수 1회 → `assets/060/`.

상태: pending

## Diff-Level Implementation Spec

### Server / domain

| Op | File | 구현 내용 | 예상 증감 |
|----|------|-----------|-----------|
| NEW | `lib/presetCompiler.ts` | `compilePresets()` 순수 함수. 선택 순서를 유지해 fragment를 결합하고, provider override와 params를 충돌 규칙에 따라 병합한다. | +160 |
| NEW | `presets/camera-motion.json` | dolly/orbit/crane/fpv 등을 포함한 카메라 모션 시드 약 20개와 provider별 fragment/배타 그룹을 정의한다. | +350 |
| NEW | `presets/style.json` | 스타일 시드 약 15개와 미리보기 자산 메타데이터를 정의한다. | +260 |
| NEW | `presets/lighting.json` | 조명 시드 약 10개와 provider별 prompt fragment를 정의한다. | +180 |
| MODIFY | `routes/generate.ts` | 요청의 `presetIds`를 정규화하고 generation context로 전달한다. 알 수 없는 ID와 중복 ID 처리 계약을 고정한다. | +15 |
| MODIFY | `routes/video.ts` | 비디오 생성 context/sidecar에 `presetIds`를 전달·저장한다. | +20 |
| MODIFY | `lib/imageMetadata.ts` | 이미지 XMP 직렬화/복원 payload에 순서가 보존된 `presetIds`를 추가한다. | +14 |

### Frontend

| Op | File | 구현 내용 | 예상 증감 |
|----|------|-----------|-----------|
| NEW | `ui/src/lib/presets.ts` | 브라우저용 프리셋 catalog와 `getPresetById`, `getPresetsByCategory` 조회 함수를 제공한다. | +60 |
| NEW | `ui/src/store/storePresetImpl.ts` | 선택 순서 보존, ID 중복 방지, mode별 defaults 저장/복원을 담당한다. | +75 |
| NEW | `ui/src/components/home/HomeWorkspace.tsx` | prompt-first composer, 프리셋 grid, 최근 이어가기 strip을 조합하는 `#home` 워크스페이스를 구현한다. | +130 |
| NEW | `ui/src/components/home/PresetGrid.tsx` | category/mode별 프리셋 grid, 선택 상태, hover preview video를 구현한다. | +160 |
| NEW | `ui/src/components/home/HomePromptComposer.tsx` | 홈 전용 대형 textarea와 Generate 진입 동작을 구현한다. | +75 |
| NEW | `ui/src/styles/home-workspace.css` | 반응형 grid, hover video, embedded recent strip과 홈 composer 레이아웃을 정의한다. | +270 |
| MODIFY | `ui/src/components/PromptComposer.tsx` | 020의 `ChipRow`를 재사용해 본문과 분리된 프리셋 chip row와 제거 동작을 추가한다. | +45 |
| MODIFY | `ui/src/components/VideoControlsPanel.tsx` | 비디오에서 사용할 프리셋 선택 상태를 노출하고 컴파일 입력으로 연결한다. 모션 전용 UX는 080에서 확장한다. | +25 |
| MODIFY | `ui/src/store/storeGenerateImpl.ts` | 생성 직전에 선택된 프리셋을 컴파일하고 `presetIds`와 병합 params를 요청에 싣는다. | +45 |
| MODIFY | `ui/src/store/storeVideoImpl.ts` | video mode용 프리셋 컴파일 결과와 `presetIds`를 비디오 요청에 전달한다. | +45 |
| MODIFY | `ui/src/App.tsx` | `HomeWorkspace`를 lazy-load하고 `uiMode === "home"` 렌더 분기를 추가한다. | +25 |
| MODIFY | `ui/src/components/NavRail.tsx` | `#home` hash와 Home rail item을 추가하되 기본 진입 모드 결정은 090까지 보류한다. | +25 |
| MODIFY | `ui/src/types.ts` | preset catalog, 선택 상태, generation/video request의 `presetIds` 타입을 추가한다. | +25 |

### Tests

| Op | File | 구현 내용 | 예상 증감 |
|----|------|-----------|-----------|
| NEW | `tests/preset-compiler.test.ts` | 프리셋×provider snapshot, 선택 순서, override/params 병합, 중복·미등록 ID 계약을 검증한다. | +220 |
| NEW | `tests/preset-restore-contract.test.ts` | chip 저장/복원과 XMP `presetIds` 왕복, image/video sidecar 보존을 검증한다. | +120 |

### Done criteria

- 프리셋×provider 컴파일러 snapshot과 chip 저장/복원 계약 테스트가 통과한다.
- 동일 프리셋으로 Grok/Gemini 실생성을 각 1회 비교 검수하고 결과를 `assets/060/`에 남긴다.
- 홈을 기본 진입 모드로 할지는 구현에서 확정하지 않고 090 미결정 원장에 유지한다.

### Dependencies on prior phases

- 020의 `Chip`/`ChipRow`와 통일 컨트롤 계약을 재사용한다.
- 030의 NavRail/hash routing 슬롯 위에 `#home`을 추가한다.
- 040의 최근 결과 체이닝 데이터를 홈의 이어가기 strip에서 소비한다.
- 050의 Assets 저장 계층과 metadata/sidecar 왕복 계약을 사용한다.
