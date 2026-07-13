---
created: 2026-07-12
tags: [ima2-gen, phase, elements, mention]
---

# Phase 070 — @멘션 영속 요소

스펙: `005_reference-assets.md` 전체. 050(저장, `kind: element`) +
060(컴파일 파이프라인, Chip) 의존.

## 범위

1. 요소 CRUD: 갤러리 "요소로 저장" 체이닝 액션 + Assets 내 요소 상세
   (refs 1~6장, notes, kind).
2. `PromptComposer` `@` 자동완성 → 멘션 칩. 생성 시 refs 참조 슬롯 주입 +
   notes 컴파일(060 파이프라인 확장). XMP `elementIds` 기록.
3. 비디오 I2V 참조 경로에 동일 주입.
4. 테스트 시트 버튼(요소 고정 4변형 생성).
5. 미결정: 노드 모드 요소 노드 타입 — 080에서 함께 결정.

## Done 기준

- 멘션 파싱/주입 단위 테스트(프리셋 조합 포함) + 참조 상한 규칙 계약.
- 캐릭터 요소 1개 3사 프로바이더 일관성 수동 검수 → `assets/070/`.

상태: pending

## Diff-Level Implementation Spec

### Server / domain

| Op | File | 구현 내용 | 예상 증감 |
|----|------|-----------|-----------|
| NEW | `lib/elementCompiler.ts` | element ID를 조회해 notes를 prompt fragment로 컴파일하고 refs를 provider 참조 슬롯으로 변환한다. 중복 제거, 순서, provider별 참조 상한을 강제한다. | +120 |
| MODIFY | `lib/assetsStore.ts` | `kind: element` payload의 name, refs 1–6장, notes를 검증하고 element 필터/검색 및 왕복 저장 계약을 확장한다. | +60 |
| MODIFY | `routes/assets.ts` | element CRUD, 갤러리의 "요소로 저장" promote action, 요소 고정 4변형 테스트 시트 endpoint를 추가한다. | +95 |
| MODIFY | `lib/imageMetadata.ts` | XMP payload에 `elementIds: string[]`를 추가하고 060의 `presetIds`와 함께 왕복시킨다. | +13 |
| MODIFY | `lib/generatePipeline.ts` | preset compile 결과와 결합하기 전에 element notes/refs를 주입하고 provider 참조 상한을 적용한다. | +17 |

### Frontend

| Op | File | 구현 내용 | 예상 증감 |
|----|------|-----------|-----------|
| NEW | `ui/src/components/ElementMentionMenu.tsx` | caret의 `@query`를 감지해 저장된 요소를 검색·키보드 탐색·선택하는 자동완성 메뉴를 구현한다. | +130 |
| NEW | `ui/src/components/ElementMentionChip.tsx` | 본문 token과 연결되는 element mention pill, 제거, 누락 요소 상태를 구현한다. | +55 |
| NEW | `ui/src/components/assets/ElementDetail.tsx` | 요소 name/notes/refs 1–6장 편집, 저장, 테스트 시트 실행 UI를 구현한다. | +180 |
| MODIFY | `ui/src/components/PromptComposer.tsx` | `@query` 범위를 mention chip으로 치환하고 element ID를 prompt text와 분리해 유지한다. | +55 |
| MODIFY | `ui/src/components/assets/AssetsWorkspace.tsx` | element 목록/상세 master-detail과 갤러리 promote 진입을 연결한다. | +30 |
| MODIFY | `ui/src/store/storeAssetsImpl.ts` | element CRUD, promote, mention 검색용 refresh와 optimistic/error 상태를 추가한다. | +52 |

### Tests

| Op | File | 구현 내용 | 예상 증감 |
|----|------|-----------|-----------|
| NEW | `tests/element-compiler.test.ts` | mention 파싱, notes/refs 주입, 중복 제거, 순서, provider 참조 상한 및 060 preset 조합을 검증한다. | +180 |
| NEW | `tests/element-metadata.test.ts` | `presetIds`와 `elementIds`의 XMP 공존 왕복, element CRUD/filter/search 및 누락 ID 복원을 검증한다. | +70 |

### Done criteria

- element CRUD round-trip과 compiler의 참조 상한·중복 제거 계약 테스트가 통과한다.
- 060의 `presetIds`와 070의 `elementIds`가 동일 XMP payload에서 공존하는 왕복 테스트가 통과한다.
- 050 `assetsStore`가 `kind: element`를 올바르게 저장·필터·검색하는 확장 계약이 통과한다.
- 동일 캐릭터 요소를 GPT/Gemini/Grok에서 각 1회 생성해 일관성을 수동 검수하고 `assets/070/`에 남긴다.

### Dependencies on prior phases

- 020의 `Chip` 상호작용을 mention pill과 composer 선택 UI에 재사용한다.
- 040의 갤러리 체이닝 액션을 "요소로 저장" 진입점으로 확장한다.
- 050의 Assets CRUD, `kind: element`, refs 저장 계층과 검색 계약에 의존한다.
- 060의 preset compiler/generation context 및 XMP `presetIds` 왕복을 확장한다.
- 노드용 `ElementReferenceNode`는 이 phase 완료 후 080에서 구현한다.
