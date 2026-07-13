---
created: 2026-07-12
tags: [ima2-gen, phase, node-canvas, video]
---

# Phase 080 — 노드 템플릿/팔레트 + 비디오 모션 칩/extend

스펙: `006_node-canvas-ux.md` + `007_video-ux.md`. 성격이 같은 "기존
워크스페이스에 스튜디오 어휘 입히기" 작업 두 벌을 한 phase로 묶는다.
상호 독립이라 내부에서 병렬 가능.

## 노드 (006)

1. 빈 상태 3택(빈 캔버스/템플릿/최근) + 시드 템플릿 4~6개.
2. 템플릿 저장/복원(미디어 strip 직렬화, 050 `kind: template`).
3. `/` 커맨드 팔레트 + 포트 드래그 호환 필터 삽입 + 미니맵.
4. 분기 비교 액션(프로바이더/설정 병렬 분기).
5. 070에서 미룬 요소 노드 타입 결정 포함.

## 비디오 (007)

1. `VideoControlsPanel` 카메라 모션 칩(060 컴파일러 + 배타 그룹 규칙).
2. Extend: 마지막 프레임 → 다음 I2V 첫 프레임 "이어가기"(갤러리 타일에도).
   `parentId` 기록.
3. 미결정: ffmpeg concat 단일 mp4 내보내기, 동기 컴페어 뷰 — 090 원장.

## Done 기준

- 템플릿 라운드트립 + 호환 필터 매트릭스 + 모션 칩 배타 규칙 테스트.
- extend 프레임 추출→주입 계약 테스트.
- 100+ 노드 팬/줌 프로파일 수치 → `assets/080/`.

상태: pending

## Diff-Level Implementation Spec

Node templates/palette/branching과 video motion/extend는 독립 sub-track으로 진행할 수 있다. 단, `ElementReferenceNode`만 070 완료를 선행 조건으로 둔다.

### Sub-track A — Node templates + palette

#### Server / domain

| Op | File | 구현 내용 | 예상 증감 |
|----|------|-----------|-----------|
| NEW | `lib/nodeTemplateStore.ts` | template CRUD, seed 4–6개, media strip 직렬화와 실행 결과 제거 규칙을 구현한다. 050의 `kind: template` 저장 계약을 사용한다. | +180 |

#### Frontend

| Op | File | 구현 내용 | 예상 증감 |
|----|------|-----------|-----------|
| NEW | `ui/src/components/node-canvas/NodeCanvasEmptyState.tsx` | 빈 캔버스/템플릿/최근의 3택 empty state를 구현한다. | +140 |
| NEW | `ui/src/components/node-canvas/NodeTemplatePicker.tsx` | seed와 사용자 저장 template 목록, preview, restore 진입을 구현한다. | +130 |
| NEW | `ui/src/components/node-canvas/NodeCommandPalette.tsx` | `/` 검색, 키보드 탐색, node type 삽입을 구현한다. | +170 |
| NEW | `ui/src/lib/nodeCompatibility.ts` | source/target port type 호환 매트릭스와 드래그 중 삽입 후보 필터를 제공한다. | +90 |
| NEW | `ui/src/lib/nodeBranching.ts` | 선택 node를 provider/설정별 2–4개 병렬 branch로 변환하고 edge를 보존한다. | +100 |
| NEW | `ui/src/components/node-canvas/ElementReferenceNode.tsx` | 070의 영속 element를 refs/notes 입력으로 공급하는 node type을 구현한다. | +110 |

#### Tests

| Op | File | 구현 내용 | 예상 증감 |
|----|------|-----------|-----------|
| NEW | `tests/node-template-contract.test.ts` | template save→restore round-trip, seed load, strip 직렬화 및 media/results 제거를 검증한다. | +170 |
| NEW | `tests/node-compatibility.test.ts` | 모든 port type 조합, 비호환 drag 차단, 유효 삽입 후보와 branching edge 보존을 검증한다. | +130 |

### Sub-track B — Video motion

#### Server / domain

| Op | File | 구현 내용 | 예상 증감 |
|----|------|-----------|-----------|
| NEW | `lib/videoMotionPresets.ts` | camera motion catalog, provider별 prompt fragment, 선택 상한과 배타 그룹을 정의한다. | +100 |

#### Frontend

| Op | File | 구현 내용 | 예상 증감 |
|----|------|-----------|-----------|
| NEW | `ui/src/lib/videoMotionSelection.ts` | motion chip toggle, 선택 상한, 배타 그룹 충돌 차단을 순수 함수로 구현한다. | +70 |
| MODIFY | `ui/src/components/VideoControlsPanel.tsx` | 060 preset UI를 확장한 camera motion chip row와 충돌/상한 피드백을 추가한다. | +55 |

#### Tests

| Op | File | 구현 내용 | 예상 증감 |
|----|------|-----------|-----------|
| NEW | `tests/video-motion-presets.test.ts` | provider fragment snapshot, 선택 상한, 배타 그룹, toggle 순서 계약을 검증한다. | +120 |

### Sub-track C — Video extend

#### Server / domain

| Op | File | 구현 내용 | 예상 증감 |
|----|------|-----------|-----------|
| MODIFY | `lib/videoFrameExtract.ts` | 생성 비디오의 마지막 프레임을 안전하게 추출해 다음 I2V 입력으로 반환하는 계약을 확장한다. | +45 |
| MODIFY | `lib/videoSeriesChain.ts` | extend 결과의 `parentId` lineage와 series 순서/조회 계약을 추가한다. | +55 |
| MODIFY | `routes/videoExtended.ts` | last-frame extraction → I2V injection → child 저장을 orchestration하고 실패 경계를 명시한다. | +70 |

#### Frontend

| Op | File | 구현 내용 | 예상 증감 |
|----|------|-----------|-----------|
| MODIFY | `ui/src/components/ResultActions.tsx` | 비디오 결과와 갤러리 tile에 "이어가기" action을 추가하고 extend 요청 상태를 표시한다. | +30 |

#### Tests

| Op | File | 구현 내용 | 예상 증감 |
|----|------|-----------|-----------|
| MODIFY | `tests/videoExtendedRoute.test.ts` | 마지막 프레임 추출→I2V 주입, `parentId` lineage, 추출 실패 응답 계약을 확장한다. | +90 |

### Done criteria

- node template save→restore round-trip이 통과하고 직렬화 결과에서 media/results가 제거된다.
- port compatibility 매트릭스 전수 테스트와 비호환 drag 필터 계약이 통과한다.
- video motion chip 선택 상한·배타 그룹 계약 테스트가 통과한다.
- video extend의 last-frame extraction→I2V injection과 `parentId` lineage 계약이 통과한다.
- 100개 이상 node 그래프의 pan/zoom 프로파일이 허용 기준을 충족하고 증거를 `assets/080/`에 남긴다.
- ffmpeg concat 단일 MP4와 동기 compare view는 구현하지 않고 090 미결정 원장에 유지한다.

### Dependencies on prior phases

- 020의 `Chip`/`ChipRow`를 video motion 선택 UI에 재사용한다.
- 040의 갤러리 체이닝/ResultActions 패턴을 video extend 진입점에 확장한다.
- 050의 `kind: template` 저장 계층과 media strip 직렬화 계약에 의존한다.
- 060의 preset compiler/provider fragment 규칙을 video motion compiler에 재사용한다.
- 070 완료 후에만 `ElementReferenceNode`를 활성화한다. 나머지 node/video sub-track은 병렬 진행 가능하다.
